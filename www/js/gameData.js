define(['jquery', 'logger'], 
    function($, logger) {
    "use strict";
    
    var gameData = {};
    gameData.loaded = false;
    
    gameData.whenLoaded = function(func, data) {
        if(gameData.loaded !== true) {
            logger.debug("Game data not loaded yet. Waiting...");
            setTimeout(function() { gameData.whenLoaded(func, data); }, 100);
            return;
        }
        func(data);
    };
    
    gameData.GEN_NUM = 4;
        
    gameData.TEST_SPEC = {"gimmick":"normal",
	"teams":
            [
                [
                    {"pp":[5,10,15,30],"displayName":"Rhyhorn","name":"Rhyhorn","form":0,"item":238,"gender":"f","setName":"Physical","type2":"rock","ivs":{"hp":31,"atk":31,"spA":31,"spD":31,"spe":31,"def":31},"stats":{"hp":301,"atk":269,"sdf":146,"spd":113,"def":226,"sat":86},"moves":[439,89,34,14],"type1":"ground","id":"111","happiness":255,"ability":120},
                    {"pp":[25,15,15,20],"displayName":"Murkrow","name":"Murkrow","form":0,"item":232,"gender":"f","setName":"Special","type2":"flying","ivs":{"hp":31,"atk":31,"spA":31,"spD":31,"spe":31,"def":31},"stats":{"hp":321,"atk":185,"sdf":147,"spd":254,"def":147,"sat":206},"moves":[314,101,196,347],"type1":"dark","id":"198","happiness":255,"ability":105}
                ], [
                    {"pp":[10,20,15,10],"displayName":"Cacturne","name":"Cacturne","form":0,"item":175,"gender":"m","setName":"Standard","type2":"dark","ivs":{"hp":31,"atk":31,"spA":31,"spD":31,"spe":31,"def":31},"stats":{"hp":314,"atk":308,"sdf":189,"spd":131,"def":189,"sat":280},"moves":[412,185,280,201],"type1":"grass","id":"332","happiness":255,"ability":8}, 
                    {"pp":[25,15,15,20],"displayName":"Murkrow","name":"Murkrow","form":0,"item":232,"gender":"f","setName":"Special","type2":"flying","ivs":{"hp":31,"atk":31,"spA":31,"spD":31,"spe":31,"def":31},"stats":{"hp":321,"atk":185,"sdf":147,"spd":254,"def":147,"sat":206},"moves":[314,101,196,347],"type1":"dark","id":"198","happiness":255,"ability":105},
                    {"pp":[5,10,15,30],"displayName":"Rhyhorn","name":"Rhyhorn","form":0,"item":238,"gender":"f","setName":"Physical","type2":"rock","ivs":{"hp":31,"atk":31,"spA":31,"spD":31,"spe":31,"def":31},"stats":{"hp":301,"atk":269,"sdf":146,"spd":113,"def":226,"sat":86},"moves":[439,89,34,14],"type1":"ground","id":"111","happiness":255,"ability":120},
                    {"pp":[20,15,10,10],"displayName":"Arbok","name":"Arbok","form":0,"item":273,"gender":"f","setName":"Rest","ivs":{"hp":31,"atk":31,"spA":31,"spD":31,"spe":31,"def":31},"stats":{"hp":283,"atk":295,"sdf":215,"spd":176,"def":195,"sat":166},"moves":[398,231,157,156],"type1":"poison","id":"24","happiness":255,"ability":61},
                    {"pp":[5,10,15,30],"displayName":"Rhyhorn","name":"Rhyhorn","form":0,"item":238,"gender":"f","setName":"Physical","type2":"rock","ivs":{"hp":31,"atk":31,"spA":31,"spD":31,"spe":31,"def":31},"stats":{"hp":301,"atk":269,"sdf":146,"spd":113,"def":226,"sat":86},"moves":[439,89,34,14],"type1":"ground","id":"111","happiness":255,"ability":120}
                ]
            ]
	,"switching":true,"stage":null};
    
    gameData.ALL_WEATHER = ['none', 'sun', 'rain', 'hail', 'sandstorm', 'fog'];   
    gameData.TEAM_SIZE = 3;
    gameData.TEAM_NAMES = ["blue", "red"];
    gameData.STAT_NAMES = ['atk','def','sat','sdf','spd'];
    gameData.STAGE_NAMES = ['atk','def','sat','sdf','spd','acc','eva'];
    
    gameData.ACCURACY = [33 / 100, 36 / 100, 43 / 100, 50 / 100, 60 / 100, 75 / 100, 100 / 100, 133 / 100, 166 / 100, 200 / 100, 250 / 100, 266 / 100, 300 / 100];
    
    $.ajax({
        url: "/json/visData.min.json?_=1.0.1",
        dataType: "json",
        cache: true,
        success: function(response) {
            gameData.SETS = response.visSets;
            gameData.SETS_KEYS = Object.keys(gameData.SETS);
            gameData.MOVES = response.moves;
            gameData.ABILITIES = response.abilities;
            gameData.ITEMS = response.items;
            gameData.PKMN_WEIGHTS = response.pkmnWeights;
            gameData.PKMN_NAMES = response.pkmnNames;
            gameData.UNOWN_FORM_IDS = response.unownFormIds;
            /*
             * Arceus also supposedly has actual forms. If this is true, API reports them all incorrectly as form 0.  
             * So Arceus's type will just be set in visualizer, and its form will always be 0
             */
            gameData.FORM_NAMES = response.formNames;
            gameData.ITEM_FLING_EFFECT_PROSE = response.itemFlingProse;
            gameData.ALT_GIF_SPRITES = response.altGifSprites;
            console.log(response.altGifSprites);
            gameData.loaded = true;
            return gameData;
        },
        error: function() { 
            logger.error("Error loading items data."); 
        }
    });
    
    return gameData;
});