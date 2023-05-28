define(['gameData', 'utils', 'Logger',
    'Pokemon', 
    'MatchWeather', 'MatchDuels',
    'calcWeather', 'calcDuel', 'calcRoutines'], 
    function(gameData, utils, Log,
        Pokemon, 
        MatchWeather, MatchDuels,
        calcWeather, calcDuel, calcRoutines) {
    "use strict";
    function Match() {
        var self = this;    
        
        self.field = {};
        self.teamFields = [{}, {}];
        self.weather = null;
    }
    
    Match.prototype.resetField = function() {
        var self = this;
        
        self.field.gravity = false;
        self.field.trickroom = false;
        
        self.teamFields.forEach( function(field) {
            field.reflect = false;
            field.screen = false;
            field.tailwind = false;
        } );
    };
    
    Match.prototype.activateFirstMatchupEffects = function() {
        var self = this;
        calcRoutines.activate_first_matchup_effects(self.teams[0][0], self.teams[1][0]);
    };
    
    Match.prototype.calcWeather = function() {  
        var self = this;
        calcWeather(self);
    };
    
    Match.prototype.getWeather = function(ib, ir) {  
        var self = this;
        return self.weather.get(ib, ir);
    };
    
    Match.prototype.setWeather = function(ib, ir, val) {  
        var self = this;
        self.weather.set(ib, ir, val);
    };
    
    Match.prototype.setGlobalWeather = function(val) {  
        var self = this;
        self.weather.setGlobal(val);
    };
    
    function getTeamBidCommand(team) {
        var bid = [];
        for( var i = 0; i < team.length; i++ ) {
            var pkmn = team[i];
            if( !pkmn.isFiller ) {
                bid.push( pkmn.id + " " + pkmn.setName );
            }
        } 
        var bidStr;
        if( bid.length > 3 )
            bidStr = bid.slice(0, 3).join(', ') + "<br>" + bid.slice(3, bid.length).join(', ');
        else
            bidStr = bid.join(', ');
        return bidStr;
    }
    
    Match.prototype.getBidCommand = function() {
        var self = this;
        return 'match <br>' + 
                self.fullTeams.map( function(team) { return getTeamBidCommand(team); } )
                .join(" / <br> ");
    };
    
    function getFillerPkmn() {
        var pkmnSpec = Pokemon.getBlankPkmnSpec();
        pkmnSpec.isFiller = true;
        return new Pokemon(pkmnSpec);
    };
    
    /*
     * we assume match.teams is an array with two teams of at least one pokemon each
     */
    Match.prototype.loadSpec = function(matchSpec) {
        var self = this;
        var teamsSpec = matchSpec.teams;
        
        self.lastLoadedSpec = utils.deepCopy(matchSpec);
        self.gimmick = matchSpec.gimmick;
        self.stage = matchSpec.stage;
        self.switching = matchSpec.switching;
        self.fullTeams = [ [], [] ];
        
        if(typeof(matchSpec.base_gimmicks) !== 'undefined') {
            self.baseGimmicks = matchSpec.base_gimmicks;
        } else {
        self.baseGimmicks = [];
        }
        
        self.fInverse = self.baseGimmicks.indexOf('inverse') !== -1;
        
        /*
         * Instantiate all Pokemon from the spec, and insert into respective teams
         */
        self.fullTeams.forEach( function(team, teamsIndex) {
            teamsSpec[teamsIndex].forEach(function(pkmnSpec) {
                team.push(new Pokemon(pkmnSpec));
            } );
        } );
        
        self.lastRealPkmnIndices = [self.fullTeams[0].length - 1, self.fullTeams[1].length - 1];
        
        /*
         * If needed, insert blank Pokemon into teams until each team has at least 3 Pokemon
         */
        self.fullTeams.forEach( function(team) {
            while ( team.length < gameData.TEAM_SIZE ) {
                team.push( getFillerPkmn( ) );
            }
        } );
        
        /*
         * Encapsulate access to weather and duels
         * Pass team lengths so these classes know how much space to create internally
         */
        self.weather = new MatchWeather( self.fullTeams[0].length, self.fullTeams[1].length );
        self.duels = new MatchDuels( self.fullTeams[0].length, self.fullTeams[1].length );
        
        
        // set the offsets for our working blue/red arrays
        self.teamOffsets = [0, 0];
        
        self.updateDisplayTeams();
    };
    
    /*
     * Called by Match.prototype.loadSpec, Match.prototype.setTeamOffset
     * Create working teams, of length 3, to represent the subsection of pokemon currently visualized
     * Create another team array with all 6 working pokemon
     */
    Match.prototype.updateDisplayTeams = function() {
        var self = this;
        self.teams = [ [], [] ];
        self.teams.forEach( function(team, teamsIndex) {
            for( var teamIndex = 0; teamIndex < 3; teamIndex++ ){
                team.push( self.fullTeams[ teamsIndex ][ teamIndex + self.teamOffsets[teamsIndex] ] );
            }
        } );
        self.sixPkmn = self.teams[0].concat(self.teams[1]);  
    };
    
    
    Match.prototype.shiftTeamOffset = function(team, shift) {
        var self = this;
        var success = false;
        if( shift > 0 ) {
            if( self.teamOffsets[team] + shift <= self.fullTeams[team].length - gameData.TEAM_SIZE ) {
                Log.info("Shifting " + gameData.TEAM_NAMES[team] + " team down.");
                self.setTeamOffset(team, self.teamOffsets[team] + shift);
            } else {
                Log.info(self.fullTeams[team][self.lastRealPkmnIndices[team]].name + " is the last Pokemon on the "
                    + gameData.TEAM_NAMES[team] + " team.  You cannot shift this team further down.");
            }
        } else {
            if( self.teamOffsets[team] + shift >= 0 ) {
                Log.info("Shifting " + gameData.TEAM_NAMES[team] + " team up.");
                self.setTeamOffset(team, self.teamOffsets[team] + shift);
            } else {
                Log.info(self.fullTeams[team][0].name + " is the first Pokemon on the "
                    + gameData.TEAM_NAMES[team]+ " team.  You cannot shift this team further up.");
            }
        }
        if( !success ) {
        }
    };    
    
    Match.prototype.setTeamOffset = function(team, newOffset) {
        var self = this;
//        Log.info("Setting team " + team + " offset to " + newOffset + ".");
        self.teamOffsets[team] = newOffset;
        self.weather.setTeamOffset(team, newOffset);
        self.duels.setTeamOffset(team, newOffset);
        
        // update the display team subsets
        self.updateDisplayTeams();
    };
    
    
    /*
     * helper function for Match.prototype.calcDuels
     */
    Match.prototype.clearAttacks = function() {
        var self = this;
        self.duels.clearAttacks();
    };
    
    Match.prototype.calcDuels = function() {
        var self = this;
        self.clearAttacks();
        self.teams[0].forEach(function (t0Pkmn, t0PkmnTeamIndex) {
            self.teams[1].forEach(function (t1Pkmn, t1PkmnTeamIndex) {
                var duelWeather = self.getWeather(t0PkmnTeamIndex, t1PkmnTeamIndex);
                var t0PkmnDuel = self.duels.get(t0PkmnTeamIndex, t1PkmnTeamIndex, 0);
                var t1PkmnDuel = self.duels.get(t0PkmnTeamIndex, t1PkmnTeamIndex, 1);
                calcDuel(self, t0Pkmn, t1Pkmn, t0PkmnDuel, t1PkmnDuel, duelWeather, self.fInverse);
            });
        });  
    };
    
    Match.prototype.getDuels = function(team, teamIndex) {
        var self = this;
        return self.duels.getDuels(team, teamIndex);
    };
    
    Match.prototype.getDuel = function( t0PkmnTeamIndex, t1PkmnTeamIndex, team ) {
        var self = this;
        return self.duels.get( t0PkmnTeamIndex, t1PkmnTeamIndex, team );
    };
    
    var blankMatches = []; 

    // 1:  pbr yay
    blankMatches.push(["r", "b", "p", "y", "a", "y"]);
    
    // 2:  pay out
    blankMatches.push(["y", "a", "p", "o", "u", "t"]);
    
    // 3:  spo oky
    blankMatches.push([92, "p", "s", 92, "k", "y"]);

    // 4:  reddy zigzagoon
    blankMatches.push(["d", "e", "r", "d", "y", 263]);

    // 5:  nebby cosmog
    blankMatches.push(["b", "e", "n", "b", "y", 789]);

    // 6:  meelo banned (bex cat pic)
    blankMatches.push(["n", 725, "b", "n", "e", "d"]);
    
    // 7:  fer aro
    blankMatches.push(["r", "e", "f", "a", "r", "o"]);
    
    // 8:  racc
    blankMatches.push(["a", "r", 263, "c", "c", 263]);
    
    // 9:  roll
    blankMatches.push(["o", "r", 363, "l", "l", 363]);
    
    // 10:  wowee
    blankMatches.push(["w", "o", "w", "e", "e", 58]);
    
    // 11:  helix
    blankMatches.push(["l", "e", "h", "i", "x", 139]);
    
    // 12:  cult
    blankMatches.push(["u", "c", 140, "l", "t", 140]);
    
    // 13:  hail
    blankMatches.push(["a", "h", 139, "e", "e", 58]);
    
    // 14:  bait
    blankMatches.push(["a", "b", 129, "i", "t", 129]);
    
    // 15:  ayaya
    blankMatches.push(["a", "y", "a", "y", "a", 549]);
    
    // 16: blind 
    blankMatches.push(["i", "l", "b", "n", "d", 633]);
    
    // 17: money
    blankMatches.push(["n", "o", "m", "e", "y", 139]);
    
    // 18: shiny 
    blankMatches.push(["i", "h", "s", "n", "y", 263]);
    
    // 19: royal
    blankMatches.push(["y", "o", "r", "a", "l", 184]);
    
    // 20:  loa din
    blankMatches.push(["a", "o", "l", "d", "i", "n"]);
    
          
    // used in 
    var testIndex = 1;
    
    
    Match.prototype.loadBlank = function(matchSpec) {
        var self = this;
        
        var matchSpec = {};
        var teamData = [];
        matchSpec.gimmick = "Normal";
        matchSpec.stage = null;
        matchSpec.switching = false;
        
        var rand = Math.floor(Math.random() * blankMatches.length);
        var blankMatchIds = blankMatches[rand];
        
        // testing
//        testIndex += 1;
//        blankPkmn = blankMatches[testIndex];
        
        [0,1,2,3,4,5].forEach(function(matchIndex) {
            var pkmnId = blankMatchIds[matchIndex];
            var pkmn = Pokemon.getBlankPkmnSpec();
            if (utils.isNumber(pkmnId)) {
                // regular pokemon
                var id = pkmnId;
                pkmn.name = gameData.PKMN_NAMES[id];
                pkmn.displayName = pkmn.name;
                pkmn.setName = "";
                pkmn.id = id;
                pkmn.form = 0;
                pkmn.blankMatch = true;
            } else {
                //unown pokemon
                var letterName = pkmnId;
                var formNum = gameData.UNOWN_FORM_IDS[letterName];
                pkmn.form = formNum;
                pkmn.formName = letterName;
                pkmn.displayName = letterName;
                pkmn.setName = letterName;
                pkmn.blankMatch = true;
            }
            teamData.push(pkmn);
        });
        matchSpec.teams = [ 
            [ teamData[0], teamData[1], teamData[2] ], 
            [ teamData[3], teamData[4], teamData[5] ] ];
        self.loadSpec(matchSpec);
    };
    
    return Match;
});