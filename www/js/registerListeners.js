define(['jquery', 'Logger', 'gameData', 
    'settings', 'utils', 'clickRoutines', 
    'writeHTML'], 
    function($, logger, gameData,
        settings, utils, clickRoutines, 
        writeHTML) {
    "use strict";
/*
     
     openMenu
     clickInsideElement() assigns this the element (or parent) of the contextmenu event, or null 
     clickEleIsLink
     clickInsideElement() assigns this the element of the left-click event, or null
     
     LISTENERS
     leftClickListener()
     listens for left clicks
     calls clickInsideElement() which sets clickEleIsLink to left-click target
     if openMenu not null (ie. a valid menu option)
     calls leftClickInMenuExecute() to execute rightClick
     else
     shuts menu off, after some tricks to ensure left click works cross-browser
     
     rightClickListener()
     listens for right clicks
     calls clickInsideElement which sets openMenu to right-click target (or valid parent)
     if openMenu not null (ie. a valid right click menu)
     toggle menu on and call positionMenu(openMenu) to set menu's position
     else
     shuts menu off (since it might be on)
     resizeListener()
     shuts menu off
     
     HOW TO USE
     
     assign to right click element:
     class='rightClick',
     data-right-click 'someIdentifier' (1-3)
     assign to context menu element"
     class='leftClick'
     data-left-click='someIdentifier'
     
     */

     var routines = {};
    // from http://www.sitepoint.com/building-custom-right-click-context-menu-javascript/
    routines.registerClick = function(match, recalcMatch, reloadMatch) {
        "use strict";

        //////////////////////////////////////////////////////////////////////////////
        // H E L P E R    F U N C T I O N S
        //////////////////////////////////////////////////////////////////////////////

        /**
         * Function to check if we clicked inside an element with a particular class
         * name.
         * 
         * @param {Object} e The event
         * @param {String} className The class name to check against
         * @return {Boolean}
         */
        function clickInsideElement(e, className) {
            var el = e.srcElement || e.target;

            if (el.classList.contains(className)) {
                return el;
            } else {
                //intentional assignment
                while (el = el.parentNode) {
                    if (el.classList && el.classList.contains(className)) {
                        return el;
                    }
                }
            }

            return false;
        }

        /**
         * Get's exact position of event.
         * 
         * @param {Object} e The event passed in
         * @return {Object} Returns the x and y position
         */
        function getPosition(e) {
            var posx = 0;
            var posy = 0;

            if (!e)
                var e = window.event;

            if (e.pageX || e.pageY) {
                posx = e.pageX;
                posy = e.pageY;
            } else if (e.clientX || e.clientY) {
                posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }

            return {
                x: posx,
                y: posy
            };
        }

        //////////////////////////////////////////////////////////////////////////////
        // C O R E    F U N C T I O N S
        //////////////////////////////////////////////////////////////////////////////

        /**
         * Variables.
         */
        var contextMenuClassName = "context-menu";
        var leftClickClassName = "leftClick";

        //this css class toggles display:none / block
        var contextMenuActive = "context-menu--active";

        //
        var rightClickClassName = "rightClick";
        var openMenu;

        var clickCoords;
        var clickCoordsX;
        var clickCoordsY;

        var menu = document.querySelector("#context-menu");

        //unused presently
        var menuState = 0;
        var menuWidth;
        var menuHeight;
        var menuPosition;
        var menuPositionX;
        var menuPositionY;

        var windowWidth;
        var windowHeight;

        /**
         * Initialise our application's code.
         */
        function init() {
            rightClickListener();
            leftClickListener();
            keyupListener();
            resizeListener();
        }

        /**
         * Listens for right click events.
         */
        function rightClickListener() {
            document.addEventListener("contextmenu", function (e) {
                var newMenu = clickInsideElement(e, rightClickClassName);
                if (newMenu) {
                    rightClickExecute(e, newMenu);
                } else {
                    openMenu = null;
                    toggleMenuOff();
                }
            });
        }

        function rightClickExecute(e, link) {
            var action = link.getAttribute('data-right-click');
//            logger.info("right-click: " + action);
            if (action.indexOf('set-weather') !== -1) {
                e.preventDefault();
                openMenu = link;
                toggleMenuOn();
                positionMenu(e);
            } else if (!openMenu) { // execute only if menu is not open
                e.preventDefault();
                openMenu = null;
                toggleMenuOff();
                if (action === 'resetAll') {
                    reloadMatch();
                } else if (action.indexOf('pkmn-img') !== -1) {
                    var matchId = action.split('-')[2];
                    clickRoutines.damageOrHealPkmn(match.sixPkmn[matchId], 'heal');
                    recalcMatch();
                }
            } else {
                e.preventDefault();
                openMenu = null;
                toggleMenuOff();
            }
        }
        /**
         * Listens for left click events.
         */
        function leftClickListener() {
            document.addEventListener("click", function (e) {
                var leftClickable = clickInsideElement(e, leftClickClassName);
                //some trickery to make sure it is actually a left-click, or something like that
                var button = e.which || e.button;
                if (button === 1 && leftClickable) {//if left click is valid
                    e.preventDefault();
                    if (openMenu) {
                        leftClickInMenuExecute(leftClickable);
                        toggleMenuOff();
                    } else {
                        leftClickExecute(e, leftClickable);
                    }
                }
            });
        }

        /**
         * Dummy action function that logs an action when a menu item link is clicked
         * 
         * @param {HTMLElement} link The link that was clicked
         */
        function leftClickInMenuExecute(link) {
            var rightClick = openMenu.getAttribute("data-right-click");
            var action = link.getAttribute("data-left-click");
//            logger.info("rightClick ID:" + rightClick + ", leftClick action:" + action + ".");
            toggleMenuOff();
            if (gameData.ALL_WEATHER.indexOf(action) !== -1) {
                if(settings.disableWeather)
                    return;
                var i = rightClick.split('-')[2];
                var j = rightClick.split('-')[3];
                match.setWeather( i, j, action );
                recalcMatch();
                logger.info("Set duel (" + i + ", " + j + ") weather to " + action + ".");
            }
        }

        function leftClickExecute(e, link) {
            var action = link.getAttribute("data-left-click");
            //var bodyRect = document.body.getBoundingClientRect();
            var rect = link.getBoundingClientRect();
            var middle = (rect.left + rect.right) / 2;
            //logger.debug('Body rect: ' + Math.floor(bodyRect.top), Math.floor(bodyRect.right), Math.floor(bodyRect.bottom), Math.floor(bodyRect.left));
            //logger.debug('Element rect: ' + Math.floor(rect.top), Math.floor(rect.right), Math.floor(rect.bottom), Math.floor(left));
            //logger.debug('Sum: ' + top, right, bottom, left);
//            logger.info("leftClick action:" + action + ".");
            if (action.indexOf('attack') !== -1) {
                var clickCoords = getPosition(e);
                var clickX = clickCoords.x;
                var clickY = clickCoords.y;
                action = action.split('-');
                var blueIndex = parseInt(action[1]);
                var redIndex = parseInt(action[2]);
                var moveIndex = parseInt(action[3]);

                if (clickX < middle) {
                    clickRoutines.executeMove(match, blueIndex, redIndex + 3, moveIndex);
                    recalcMatch();
                } else {
                    clickRoutines.executeMove(match, redIndex + 3, blueIndex, moveIndex);
                    recalcMatch();
                }
            } else if (action.indexOf('pkmn-img') !== -1) {
                var matchId = action.split('-')[2];
                clickRoutines.damageOrHealPkmn(match.sixPkmn[matchId], 'damage');
                recalcMatch();
            }
        }
        /**
         * Listens for keyup events.
         */
        function keyupListener() {
            window.onkeyup = function (e) {
                switch(e.keyCode) {
                    case 27:
                        toggleMenuOff();
                        break;
                    case 36:
                    case 50:
                        if( match.fullTeams[0].length > 3 ) {
                            match.shiftTeamOffset(0, -1);
                            recalcMatch();
                        }
                        break;
                    case 35:
                    case 49:
                        if( match.fullTeams[0].length > 3 ) {
                            match.shiftTeamOffset(0, 1);
                            recalcMatch();
                        }
                        break;
                    case 33:
                    case 51:
                        if( match.fullTeams[1].length > 3 ) {
                            match.shiftTeamOffset(1, -1);
                            recalcMatch();
                        }
                        break;
                    case 34:
                    case 52:
                        if( match.fullTeams[1].length > 3 ) {
                            match.shiftTeamOffset(1, 1);
                            recalcMatch();
                        }
                        break;
                }
            };
        }

        /**
         * Window resize event listener
         */
        function resizeListener() {
            window.onresize = function (e) {
                toggleMenuOff();
            };
        }

        /**
         * Turns the custom context menu on.
         */
        function toggleMenuOn() {
            if (menuState !== 1) {
                menuState = 1;
                menu.classList.add(contextMenuActive);
            }
        }

        /**
         * Turns the custom context menu off.
         */
        function toggleMenuOff() {
            openMenu = null;
            if (menuState !== 0) {
                menuState = 0;
                menu.classList.remove(contextMenuActive);
            }
        }

        /**
         * Positions the menu properly.
         * 
         * @param {Object} e The event
         */
        function positionMenu(e) {
            clickCoords = getPosition(e);
            clickCoordsX = clickCoords.x;
            clickCoordsY = clickCoords.y;

            menuWidth = menu.offsetWidth + 4;
            menuHeight = menu.offsetHeight + 4;

            windowWidth = window.innerWidth;
            windowHeight = window.innerHeight;

            if ((windowWidth - clickCoordsX) < menuWidth) {
                menu.style.left = windowWidth - menuWidth + "px";
            } else {
                menu.style.left = clickCoordsX - 70 + "px";
            }

            if ((windowHeight - clickCoordsY) < menuHeight) {
                menu.style.top = windowHeight - menuHeight + "px";
            } else {
                menu.style.top = clickCoordsY - 90 + "px";
            }
        }

        //run
        init();
    };
    
    routines.registerLayout = function(reloadMatch, writeHTML) {
        $("#js-layout").click(function() {
            this.blur();
            switch(settings.layout) {
                case 'diamond':
                    writeHTML.writeGrid();
                    settings.layout = 'grid';
                    reloadMatch();
                    break;
                case 'grid':
                    writeHTML.writeDiamond();
                    settings.layout = 'diamond';
                    reloadMatch();
                    break;
            }
        });  
    };
    
    
    var helpHTML = "<h2>How to use the Visualizer</h2> <div> <h3>What is shown?</h3> <p>The blue and red squares are colored to indicate the faster Pokémon. If there is a speed tie, the square is colored purple.</p> <p>In Pokémon, the damage caused by attacks is multiplied by a randomly generated number between 85% and 100%. Thus the visualizer shows the minimum and maximum HP damage that can be done for every attack. It also shows that damage as a percentage of the foe's total HP.</p> <h3>Click around</h3> <p>Click on attacks to do damage! You can click on many non-damaging moves as well, such as Rain Dance, Swagger, and Thunder Wave. Moves with a side effect of 70% or more activate automatically- such as Icy Wind or Charge Beam.</p> <p>Right-click on any attack to reset all match damage, stage changes, and weather.</p> <p>Right-click on the speed indicator squares to open a weather menu.</p> <p>Click on the large weather icons to set the weather for all nine duels.</p> </div> <h2>Changelog</h2> <div> <h3>June 27 2017</h3> <p>Hidden Power, Natural Gift, Return and Frustration now display the correct type and BP on mouseover.</p> <p>Substitute can now be clicked to tick off 25% HP rounded down. This is its only clickable functionality.</p> <p>Moves that start with below 5pp are highlighted purple.</p> <p>Descriptions, color coding, and markings relating to items have been improved.</p> <p>Trump Card now keeps track of PP and displays appropriate damage. Pressure is considered.</p> <p><b>Now clickable:</b> Tailwind, Leech Seed, Heart Swap, Me First, Embargo.</p> <p></p> </div> <h2>About</h2> <div> <h3>Acknowledgement</h3> <p>/u/FelkCraft for creating a visualizer which was the inspiration for the creation of this one.</p> <p>Pokémon Showdown for damage calculation scripts and sprites.</p> <p>/u/Droar for helping with previous versions of visualizebot and auto updating.</p> <p>This website has and does not accept payments in any form.</p> </div> ";
        
    routines.registerHelpMenu = function() {
        $( "#js-helpDialog" ).dialog({ 
            autoOpen: false,
            modal: true,
            height: 800,
            width: 800,
            open: function() {
                $('.ui-widget-overlay').addClass('custom-overlay');
            },
            close: function() {
                $('.ui-widget-overlay').removeClass('custom-overlay');
            }    
        });

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                $("#js-helpDesc").html(xmlhttp.responseText);
                $("#js-helpDesc").accordion({
                    header: "h2",
                    collapsible: true,
                    autoHeight: true,
                    heightStyle: "content",
                    navigation: true,
                    active: false
                });
            }
        };
        $( "#js-help" ).click(function() {
            this.blur();
            $("#js-helpDialog").dialog("open");
        });
        xmlhttp.open("GET", "/pbr/visualizer/help.html", true);
        xmlhttp.setRequestHeader("Cache-Control", "no-cache");
        xmlhttp.send();
    };
   
    routines.registerSettingsMenu = function(reloadMatch) {
        $( "#js-optionsDialog" ).dialog({ 
            autoOpen: false,
            modal: true,
            height: 180,
            width: 370,
            open: function() {
                $('.ui-widget-overlay').addClass('custom-overlay');
            },
            close: function() {
                $('.ui-widget-overlay').removeClass('custom-overlay');
            }    
        });
        $( "#js-options" ).click(function() {
            this.blur();
            $( "#js-optionsDialog" ).dialog( "open" );
        });
        
        $("#js-match-pkmn-update").click(function() {
            this.blur();
            settings.autoPkmnUpdate = this.checked;
        });
        
        $("#js-animated-sprites").click(function() {
            this.blur();
            settings.animatedSprites = this.checked;
            reloadMatch();
        });
        
    };
    
    
    function updateWeather(match, recalcMatch) {
            pollWeather(match);
            recalcMatch();
        }

    function pollWeather(match) {
        //get the selected global weather name, eg 'rain'
        var selectedGlobalWeather = $('.globalWeather:checked').attr("id").split("-")[1];

        //uncheck global weather, since weather can also be set per-duel
        $('.globalWeather:checked').prop('checked', false);

        logger.info("Set global weather to " + selectedGlobalWeather + ".");
        match.setGlobalWeather( selectedGlobalWeather );
    }
    routines.registerGlobalWeather = function(match, recalcMatch) {   
        $('.globalWeather').on("change", function() {
            if(settings.disableWeather)
                return;
            updateWeather(match, recalcMatch);
        });
    };
    
    routines.registerStageButtons = function(match, recalcMatch) {
        function buttonIncDecStage() {
            this.blur();
            if(settings.disableStageButtons)
                return;
            var parts = $(this).attr("id").split("-");
            var pkmnIndex = parts[3];
            var stageName = gameData.STAGE_NAMES[parts[4]];
            var pkmn = match.sixPkmn[pkmnIndex];
            var currStage = pkmn.stages[stageName];
            if (parts[2] === "inc")
                pkmn.stages[stageName] = currStage === 6 ? 6 : currStage + 1;
            else
                pkmn.stages[stageName] = currStage === -6 ? -6 : currStage - 1;
            recalcMatch();
        }  
        $('.js-stage-inc').on("click", buttonIncDecStage);
        $('.js-stage-dec').on("click", buttonIncDecStage);
    };


    routines.registerAll = function(match, recalcMatch, reloadMatch, 
        newNamesSubmitted, visualizePressed, randomize) {
        routines.registerClick(match, recalcMatch, reloadMatch);
        routines.registerLayout(reloadMatch, writeHTML);
        routines.registerHelpMenu();
        routines.registerSettingsMenu(reloadMatch);
        routines.registerGlobalWeather(match, recalcMatch);       
        routines.registerStageButtons(match, recalcMatch);
        
        // register misc stuff
        $('.teamPkmn-formText').on("click", function () {
            this.setSelectionRange(0, this.value.length);
        });
        $('#visualize').on("click", visualizePressed);
        $('#randomize').on("click", randomize);
        $('#teamPkmn-form').on('submit', function(e) {
            e.preventDefault();
            newNamesSubmitted();
        });
        
    };
    
    return routines;
});