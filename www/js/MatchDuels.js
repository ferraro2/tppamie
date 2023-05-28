define(["gameData", 'utils', "Duel"], 
    function(gameData, utils, Duel) {
    "use strict";
    function MatchDuels(bLen, rLen) {
        var self = this;
        self.teamLengths = [bLen, rLen];
        
        self.duels = [];
        for( var i = 0; i < self.teamLengths[0]; i++ ) {
            self.duels.push([]);
            for( var j = 0; j < self.teamLengths[1]; j++ ) {
                self.duels[i].push([ new Duel(), new Duel() ]);
            }
        }
        self.teamOffsets = [0, 0];
    }
    
    MatchDuels.prototype.get = function(team0pkmnIndex, team1pkmnIndex, teamsIndex) {
        var self = this;
        return self.duels[ Number(team0pkmnIndex) + self.teamOffsets[0] ] 
            [ Number(team1pkmnIndex) + self.teamOffsets[1] ]
            [teamsIndex];
    };

//    //untested code
//    MatchDuels.prototype.set = function(team0pkmnIndex, team1pkmnIndex, val) {
//        var self = this;
//        self.duels[ Number(team0pkmnIndex) + self.teamOffsets[0] ] 
//            [ Number(team1pkmnIndex) + self.teamOffsets[1] ] = val;
//    };

    MatchDuels.prototype.setTeamOffset = function(team, newOffset) {
        var self = this;
        self.teamOffsets[team] = newOffset;
    };
    
    /*
     * returns the three duels associated with a Pokemon in the visible match
     */
    MatchDuels.prototype.getDuels = function(team, teamIndex) {
        var self = this;
        var duels = [];
        for( var i = 0; i < 3; i++ ) {
            if( team === 0 ) {
                duels.push( self.get(teamIndex, i, team) );
            } else {
                duels.push( self.get(i, teamIndex, team) );
            }
        }
        return duels;
    };
    
    MatchDuels.prototype.clearAttacks = function() {
        var self = this;
        for( var i = 0; i < 3; i++ ) {
            for( var j = 0; j < 3; j++ ) {
                for( var k = 0; k < 2; k++ ) {
                    self.get(i, j, k).clearAttacks();
                }
            }
        }
    };
    
    return MatchDuels;
});