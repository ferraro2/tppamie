/* global settings */

define(['jquery', 'io', 'settings',
        'utils', 'gameData', 'logger',
    'Match', 'registerListeners', 'updatePage', 
    'liveBets', 'liveFeed', 'writeHTML', 
    'jqueryui'], 
    function ($, io, settings,
        utils, gameData, logger,
        Match, registerListeners, updatePage, 
        liveBets, liveFeed, writeHTML) {

    "use strict";

    logger.setLevel("debug");
    document.title = "PBR Visualizer";
    
    var firstIdsLoaded = false;
    var blankMatchCycling = false;
    var visualizePressedFlag = false;
    
    var match = new Match();
    
    /*
     * load new match pokemon data
     * called when websockets pushes the new match pokemon 
     */
    function loadMatchSpecEvent(matchSpec) {
        if (!settings.autoPkmnUpdate) {
            logger.info("New match specification available, but the auto pokemon update setting is off.");
            return;
        }
        logger.info("'match spec' event received.");
        firstIdsLoaded = true;
        // easy uncomment to test more than 3 pokemon on a team
//        matchSpec.teams[1].push(utils.deepCopy(matchSpec.teams[0][0]));
//        matchSpec.teams[0].push(utils.deepCopy(matchSpec.teams[1][0]));
        loadMatchSpec(matchSpec);
    }
    
    /*
     * load new match pokemon data
     * called by reloadMatch(), loadMatchSpecEvent(), loadFromLocalSets()
     * not called by loadBlankMatch()
     */
    function loadMatchSpec(matchSpec) {
        logger.info("Loading the following match specification:");
        logger.info(utils.deepCopy(matchSpec));
        match.loadSpec(matchSpec);
        
        resetAndRecalcMatch();
        // a real match has been received, so stop cycling though 'blank' matches
        blankMatchCycling = false;
        //$("#showBidCommand").html(match.getBidCommand());
    }
        
    // reload the current match, using the last match received from websockets
    function reloadMatch() {
        logger.info("Reloading the last loaded match specification.");
        loadMatchSpec(match.lastLoadedSpec);
    }
        
    function resetAndRecalcMatch() {
        pressVisualizeIfNotPressed("flashy");
        match.resetField();
        match.calcWeather();
        match.activateFirstMatchupEffects();
        recalcMatch();
    }
    /*
     * recalc info and update display
     * called after clicking moves, changing weather, etc.
     * called by loadMatchSpec()
     */
    function recalcMatch() {
        match.calcDuels();
        updatePage.updateAll(match);
//        logger.debug("Latest match data:");
//        logger.debug(utils.deepCopy(match));
    }
    
    /*
     * upon receiving a load blank match event, initiate cycling through fun 'blank' matches
     */
    function loadBlankMatchEvent() {
        if (!settings.autoPkmnUpdate) {
            logger.info("'load blank match' event received, but the auto pokemon update setting is off.");
            return;
        }
        // if already cycling, return
        if (blankMatchCycling) {
            logger.info("'load blank match' event received, but blank match cycling is already on.");
            return;
        } else {
            logger.info("'load blank match' event received. Blank match cyling initiated.");
            blankMatchCycling = true;
            loadBlankMatch();
            
        }
    }
    
    /*
     * load a blank match, while awaiting the next pokemon to be announced
     */
    function loadBlankMatch() {
        if (!blankMatchCycling) {
//            logger.debug("loadBlankMatch called, but cycling was toggled off.");
            return;
        } else {
//            logger.debug("loadBlankMatch called. Clearing match.");

            firstIdsLoaded = true;
            match.loadBlank();

            resetAndRecalcMatch();
            setTimeout(loadBlankMatch, 10000);
        }
    }
    
    function stateChangeEvent(newState) {
        logger.info("Received new state:" + newState);
    };
    
    /*
     * if nothing was auto loaded, initiate blank match cycling
     */
    function autoLoadFailure() {
        if (!firstIdsLoaded) {
            logger.info("Could not auto-load pokemon. Blank match cycling initiated.");
            blankMatchCycling = true;
            loadBlankMatch();
        }
    }
    
    function loadLiveBetsEvent(data) {
//        logger.info("'live bets updates' event received.");
        liveBets(data, match);
    }
    
    $(document).ready(function() {
        writeHTML.writeDiamond();
        settings.layout = 'diamond';
//        writeHTML.writeGrid();
//        settings.layout = 'grid';
//        

        /*
         * for displaying notices to the public
         */
        //$("#js-notice0").load("notice.html"); 
        $.ajax ({
            url:"notice.html",
            cache: false,
            success: function(result){
                $("#js-notice0").html(result);
            }
        });
        
        // websockets
        if (io) {    
            var versionIO = '(1.1)';
            var localSockOn = true;
            var matchSock;
            if (localSockOn) {
                matchSock = io('http://localhost:8000/');
            } else {
                matchSock = io('https://ws.tppamie.com/');
            }
           
            matchSock.on('live bets updates' + versionIO, loadLiveBetsEvent);
            matchSock.on('live match spec' + versionIO, function(data) { gameData.whenLoaded(loadMatchSpecEvent, data); });
            matchSock.on('load blank match' + versionIO, function(data) { gameData.whenLoaded(loadBlankMatchEvent, data); });
            matchSock.on('state change' + versionIO, stateChangeEvent);

            matchSock.on('connect', function() {
                matchSock.emit('visualizer initialize request' + versionIO);
                logger.info("Initialization request emitted.");
            });
        }

        // timeout to load a blank match if websockets isn't working
        setTimeout(autoLoadFailure, 3500);
        
        // set up tooltip
        $(".tooltip").tooltip({track: true, tooltipClass: "tooltipClass", content: function () {
                return $(this).prop('title');
            }
        });
 
        // set up all click, button, form, etc listeners
        registerListeners.registerAll(match, recalcMatch, reloadMatch, 
            newNamesSubmitted, visualizePressed, randomize);
    });

    function pressVisualizeIfNotPressed(flashy) {
        if (!visualizePressedFlag) {
            pressVisualize(flashy);
            visualizePressedFlag = false;
        }   
    }

    // simulate button press even when button wasn't pressed, for aesthetics
    function pressVisualize(flashy) {
        if (flashy === "flashy") {
            // a more flashy animation
            $("#visualize").addClass('hovering');
            setTimeout(function () {
                $("#visualize").removeClass('hovering');

                $("#visualize").addClass('visualizing');
                setTimeout(function () {
                    $("#visualize").removeClass('visualizing');
                }, 90);
            }, 200);
        } else {
            $("#visualize").addClass('visualizing');
            setTimeout(function () {
                $("#visualize").removeClass('visualizing');
            }, 300);
        }
    }

    /*
     * user clicked visualizer button. 
     * set flag to indicate match loader should not call pressVisualize()
     * 
     * we will assume user wants to load pokemon from the names.
     */
    function visualizePressed() {
        visualizePressedFlag = true;
        newNamesSubmitted();
    }

    //form of pokemon names was submitted
    function newNamesSubmitted() {
        loadFromLocalSets("form");
    }
    
    /*
     * load pokemon from locally stored api sets.
     * pokemon can be loaded from the HTML form, or simply randomly selected
     */
    function loadFromLocalSets(loadFrom) {
        var matchSpec = {};
        var teamData = [];
        matchSpec.gimmick = "Normal";
        matchSpec.stage = null;
        matchSpec.switching = false;
        for (var matchIndex = 0; matchIndex < 6; matchIndex++) {
            if (loadFrom === "random") {
                var randIndex = Math.floor(gameData.SETS_KEYS.length * Math.random());
                var setKey =  gameData.SETS_KEYS[randIndex];
            } else if (loadFrom === "form") {
                var setKey = $("#js-pkmn-name-" + matchIndex).val().toLowerCase();
            }
            var newPkmn = gameData.SETS[setKey];
            if (!newPkmn) {
                logger.error("Could not find set for \"" + setKey + "\".");
                return;
            }
            teamData[matchIndex] = utils.deepCopy(newPkmn);
        }
        matchSpec.teams = [ 
            [ teamData[0], teamData[1], teamData[2] ], 
            [ teamData[3], teamData[4], teamData[5] ] ];
      loadMatchSpec(matchSpec);
    }
    
    function randomize() {
        logger.info("randomizing");
        loadFromLocalSets("random");
    }
});
