define(['gameData', 'Logger'],
    function(gameData, Log) {
    "use strict";
   
    var writeHTML = {};
   
    function getDuelBackground(ib, ir) {
        var r = '<div class="duelBackground">';
        r += '<div class="weather-small-container"></div>';
        
        
        for(var im = 0; im < 4; im++) {
            r += '<div class="redAttackBG_Container"><div id="js-move-bg-';
            r += '' + (ir + 3) + '-' + ib + '-' + im;
            r+= '" class="redAttack' + im + '_BG strip"></div></div>';
        }
        
        for(var im = 0; im < 4; im++) {
            r += '<div class="blueAttackBG_Container"><div id="js-move-bg-';
            r += '' + ib + '-' + (ir + 3) + '-' + im;
            r+= '" class="blueAttack' + im + '_BG strip"></div></div>';
        }
        
        r += '</div>';
        return r;
    };
   
    function getSquare(color, type, move) {
        var r = '';
        if (type === 'empty') {
            r += '<div class="' + color + 'Square"></div>';
        } else if (type === 'damage') {
            r += '<div class="' + color + 'Square">';
            r += '<div><span id="js-move-damage-min-' + move + '" class="' + color + 'Damage"></span>';
            r += '<span id="js-move-damage-max-' + move + '" class="' + color + 'Damage"></span>';
            r += '</div></div>';
        } else if (type === 'percentage') {
            r += '<div class="' + color + 'Square">';
            r += '<div><span id="js-move-percentage-min-' + move + '" class="' + color + 'Percentage"></span>';
            r += '<span id="js-move-percentage-max-' + move + '" class="' + color + 'Percentage"></span>';
            r += '</div></div>';
        } else if (type === 'percentTaken') {
            var percentTakenId = 'js-' + color + '-percent-taken-' + move;
            r += '<div class="' + color + 'Square">';
            r += '<div><span id="' + percentTakenId + '" class="' + color + 'PercentTaken"></span>';
            r += '</div></div>';
        }
        return r;
    };
   
    function getCorner(ibir, move) {
        var cornerId = 'js-corner-' + ibir + '-' + move;
//        var ibirim3 = ibir3 + '-' + move;
//        var iribim3 = irib3 + '-' + move;
        //return '<div class="corner move-' + ibirim3 + ' move-' + iribim3 + '"><div></div></div>';
        return '<div id="' + cornerId + '" class="corner"><div></div></div>';
    };
   
    function getDuel(ib, ir) {
        var ibir = ib + '-' + ir;
        var ibir3 = ib + '-' + (ir + 3);
        var irib3 = (ir + 3) + '-' + ib;
        
        var r = '<div class="duel">';
        r += getDuelBackground(ib, ir);
        
        r += '<div id="js-speed-' + ibir + '" class="weather-small-container"><img id="js-weather-' + ibir + '" class="weather-small-img" src="/img/none.png" /></div>';
        
        // row 1
        for(var im = 0; im < 4; im++) {
            var iribm3 = irib3 + '-' + im;
            r += getSquare('red', 'damage', iribm3);
        }
        
        //row 2
        for(var im = 0; im < 4; im++) {
            var iribm3 = irib3 + '-' + im;
            r += getSquare('red', 'percentage', iribm3);
        }
        
        //row 3 (blue move 0)
        r += getSquare('blue', 'damage', ibir3 + '-0');
        r += getSquare('blue', 'percentage', ibir3 + '-0');
        r += getCorner(ibir, 0);
        r += getSquare('red', 'empty');
        r += getSquare('red', 'empty');
        r += getSquare('red', 'empty');
        
        //row 4 (blue move 1)
        r += getSquare('blue', 'damage', ibir3 + '-1');
        r += getSquare('blue', 'percentage', ibir3 + '-1');
        r += getSquare('blue', 'empty');
        r += getCorner(ibir, 1);
        r += getSquare('red', 'percentTaken', ibir);
        r += getSquare('red', 'empty');
        
        //row 5 (blue move 2)
        r += getSquare('blue', 'damage', ibir3 + '-2');
        r += getSquare('blue', 'percentage', ibir3 + '-2');
        r += getSquare('blue', 'empty');
        r += getSquare('blue', 'percentTaken', ibir);
        r += getCorner(ibir, 2);
        r += getSquare('red', 'empty');
        
        //row 6 (blue move 3)
        r += getSquare('blue', 'damage', ibir3 + '-3');
        r += getSquare('blue', 'percentage', ibir3 + '-3');
        r += getSquare('blue', 'empty');
        r += getSquare('blue', 'empty');
        r += getSquare('blue', 'empty');
        r += getCorner(ibir, 3);
        
        r += '</div>';
        
        return r;
    };
    
    function getDuelGrid(ib, ir) {
        var ibir = ib + '-' + ir;
        var ibir3 = ib + '-' + (ir + 3);
        var irib3 = (ir + 3) + '-' + ib;
        var r = '';

        r += '<div data-right-click="resetAll" class="duelGrid rightClick">'
        
        r += '<div id="js-grid-speed-' + ibir + '" class="speedGrid">';
        r += '<div id="js-grid-sprite-' + ibir3 + '" class="gridSprite blueGridSprite"></div>';
        
        r += '<div class="gridWeather rightClick" data-right-click="set-weather-' + ibir + '">';
        r += '<img id="js-grid-weather-' + ibir + '" class="grid-weather-small-img" src="/img/none.png" />';
        r += '</div>';
        
        r += '<div id="js-grid-sprite-' + irib3 + '" class="gridSprite redGridSprite"></div>';
        r += '</div>';
        
        r += '<div id="js-grid-blue-percent-taken-' + ibir + '" class="blueGridPercentTaken"></div>';
        r += '<div id="js-grid-red-percent-taken-' + ibir + '" class="redGridPercentTaken"></div>';

        for(var im = 0; im < 4; im++) {
            var ibirim3 = ibir3 + '-' + im;
            var iribim3 = irib3 + '-' + im;
            var ibirim = ibir + '-' + im;
            
            r += '<div data-left-click="attack-' + ibirim + '" class="gridAttackPair leftClick">';
            
            r += '<div id="js-grid-move-bg-' + ibirim3 + '" class="gridAttack gridAttack-blue">';
            
            r += '<div class="gridSquare">';
            r += '<div id="js-grid-move-damage-min-' + ibirim3 + '" class="blueGridDamage"></div>';
            r += '<div id="js-grid-move-damage-max-' + ibirim3 + '" class="blueGridDamage"></div>';
            r += '</div>';
            
            r += '<div class="gridSquare-rborder">';
            r += '<div id="js-grid-move-percentage-min-' + ibirim3 + '" class="blueGridPercentage"></div>';
            r += '<div id="js-grid-move-percentage-max-' + ibirim3 + '" class="blueGridPercentage"></div>';
            r += '</div>';
            
            r += '</div>'; //end gridattack
            
            r += '<div id="js-grid-move-bg-' + iribim3 + '" class="gridAttack gridAttack-red">';
            
            r += '<div class="gridSquare">';
            r += '<div id="js-grid-move-percentage-min-' + iribim3 + '" class="redGridPercentage"></div>';
            r += '<div id="js-grid-move-percentage-max-' + iribim3 + '" class="redGridPercentage"></div>';
            r += '</div>';
            
            r += '<div class="gridSquare">';
            r += '<div id="js-grid-move-damage-min-' + iribim3 + '" class="redGridDamage"></div>';
            r += '<div id="js-grid-move-damage-max-' + iribim3 + '" class="redGridDamage"></div>';
            r += '</div>';
            r += '</div>'; //end gridattack
            
            r += '</div>'; //end gridattack pair
        }
        
        
        r += '</div>'
        return r;
    }
    
    function getDiamond() {
        
        var r = '<div class="diamondTip"></div>';
        r += '<div class="redEmptyPkmnMoveset"></div>';
        r += '<div class="redEmptyPkmnMoveset"></div>';
        r += '<div class="redEmptyPkmnMoveset"></div>';
        r += '<div class="blueEmptyPkmnMoveset"></div>';
        r += getDuel(0, 0);
        r += getDuel(0, 1);
        r += getDuel(0, 2);
        
        r += '<div class="blueEmptyPkmnMoveset"></div>';
        r += getDuel(1, 0);
        r += getDuel(1, 1);
        r += getDuel(1, 2);
        
        r += '<div class="blueEmptyPkmnMoveset"></div>';
        r += getDuel(2, 0);
        r += getDuel(2, 1);
        r += getDuel(2, 2);
        
        //Log.debug(r);
        return r;
    };
    
    function getGrid() {
        var r = '';
        
        r += getDuelGrid(0, 0);
        r += getDuelGrid(0, 1);
        r += getDuelGrid(0, 2);
        
        r += getDuelGrid(1, 0);
        r += getDuelGrid(1, 1);
        r += getDuelGrid(1, 2);
        
        r += getDuelGrid(2, 0);
        r += getDuelGrid(2, 1);
        r += getDuelGrid(2, 2);
        
        return r;
    }
        
    writeHTML.writeDiamond = function() {
        var diamond = $('#diamond');
        var grid = $('#grid');
        diamond.html("").html(getDiamond());
        
        
        //change class to switch between diamond & grid
        $('#bluePartyButtonsAndStages').removeClass("bluePartyButtonsAndStages-grid").addClass("bluePartyButtonsAndStages-diamond");
        $('#redPartyButtonsAndStages').removeClass("redPartyButtonsAndStages-grid").addClass("redPartyButtonsAndStages-diamond");
        
        $('#bluePartyMoveset').removeClass("bluePartyMoveset-grid").addClass("bluePartyMoveset-diamond");
        $('#redPartyMoveset').removeClass("redPartyMoveset-grid").addClass("redPartyMoveset-diamond");
        
        
        $('#js-help').addClass("help-diamond").removeClass("help-grid");
        $('#js-options').addClass("options-diamond").removeClass("options-grid");
        
        $('#js-page-container').addClass("page-container-diamond").removeClass("page-container-grid");
        $('#teamPkmn-form').addClass("diamond-team-pkmn-form").removeClass("grid-team-pkmn-form");
        $('#StageMultContainer').addClass("diamond-stage-mult-container").removeClass("grid-stage-mult-container");
        $('#bidCommandContainer').addClass("diamond-bid-command-container").removeClass("grid-bid-command-container");
        //grid
        $('#bluePkmnInfo-grid').css("display", "none");
        $('#redPkmnInfo-grid').css("display", "none");
        $('#js-grid-global-weather-icons').css("display", "none");
        
        grid.css("display", "none");
        
        // diamond
        diamond.css("display", "block");
        $('#blueTypesAndAbilities').css("display", "block");
        $('#redTypesAndAbilities').css("display", "block");
        $('#blueItems').css("display", "block");
        $('#redItems').css("display", "block");
        $('#clickmapDiamond').css("display", "block");
        $('#js-global-weather-icons').css("display", "block");
        $('#js-notice0').css("display", "block");
        $('#js-layout').html("Grid<br>Layout").addClass("layout-diamond").removeClass("layout-grid");
        
        $('#js-blueMovePerc').css({ "top": "-640px", "right": "445px" });
        $('#js-redMovePerc').css({ "top": "-640px", "left": "430px" });
        $('#js-blueTotal').css({ "top": "-782px", "right": "10px" });
        $('#js-redTotal').css({ "top": "-782px", "left": "5px" });
        $('#js-odds').css({ "top": "-725px", "left": "-49px" });
    };
   

    writeHTML.writeGrid = function() {
        var diamond = $('#diamond');
        
        var grid = $('#grid');
        grid.html("").html(getGrid());
        
       
        //change class to switch between diamond & grid 
        $('#js-page-container').addClass("page-container-grid").removeClass("page-container-diamond");
        
        $('#bluePartyButtonsAndStages').removeClass("bluePartyButtonsAndStages-diamond").addClass("bluePartyButtonsAndStages-grid");
        $('#redPartyButtonsAndStages').removeClass("redPartyButtonsAndStages-diamond").addClass("redPartyButtonsAndStages-grid");
       
        $('#bluePartyMoveset').removeClass("bluePartyMoveset-diamond").addClass("bluePartyMoveset-grid");
        $('#redPartyMoveset').removeClass("redPartyMoveset-diamond").addClass("redPartyMoveset-grid");
        
        $('#js-help').addClass("help-grid").removeClass("help-diamond");
        $('#js-options').addClass("options-grid").removeClass("options-diamond");
        
        $('#teamPkmn-form').addClass("grid-team-pkmn-form").removeClass("diamond-team-pkmn-form");
        $('#StageMultContainer').addClass("grid-stage-mult-container").removeClass("diamond-stage-mult-container");
        
        $('#bidCommandContainer').addClass("grid-bid-command-container").removeClass("diamond-bid-command-container");
        
        //diamond only
        diamond.css("display", "none");
        $('#blueTypesAndAbilities').css("display", "none");
        $('#redTypesAndAbilities').css("display", "none");
        $('#blueItems').css("display", "none");
        $('#redItems').css("display", "none");
        $('#clickmapDiamond').css("display", "none");
        $('#js-global-weather-icons').css("display", "none");
        $('#js-notice0').css("display", "none");
        
        //grid only
        $('#bluePkmnInfo-grid').css("display", "block");
        $('#redPkmnInfo-grid').css("display", "block");
        $('#js-grid-global-weather-icons').css("display", "block");
        grid.css("display", "block");
        $('#js-layout').html("Diamond<br>Layout").addClass("layout-grid").removeClass("layout-diamond");
        
        
        $('#js-blueMovePerc').css({ "top": "-800px", "right": "180px" });
        $('#js-redMovePerc').css({ "top": "-800px", "left": "180px" });
        
        $('#js-blueTotal').css({ "top": "-782px", "right": "55px" });
        $('#js-redTotal').css({ "top": "-782px", "left": "50px" });
        
        $('#js-odds').css({ "top": "-782px", "left": "-49px" });
    };   
   
   
   return writeHTML;
   
});
