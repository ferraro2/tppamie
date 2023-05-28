define(["gameData", 'utils', 'settings'], 
    function(gameData, utils, settings) {
    "use strict";
    function MatchWeather(team0Len, team1Len) {
        var self = this;    
        
        self.teamLengths = [team0Len, team1Len];
        
        self.weather = [];
        for( var i = 0; i < self.teamLengths[0]; i++ ) {
            self.weather.push([]);
            for( var j = 0; j < self.teamLengths[1]; j++ ) {
                self.weather[i].push("none");
            }
        }
        self.teamOffsets = [0, 0];
    }
    
    MatchWeather.prototype.get = function(team0pkmnIndex, team1pkmnIndex) {
        var self = this;
        return self.weather[ Number(team0pkmnIndex) + self.teamOffsets[0] ] 
            [ Number(team1pkmnIndex) + self.teamOffsets[1] ];
    };

    MatchWeather.prototype.set = function(team0pkmnIndex, team1pkmnIndex, val) {
        var self = this;
        self.weather[ Number(team0pkmnIndex) + self.teamOffsets[0] ] 
            [ Number(team1pkmnIndex) + self.teamOffsets[1] ] = val;
    };
    
    MatchWeather.prototype.setGlobal = function(val) {
        var self = this;
        for( var i = 0; i < self.teamLengths[0]; i++ ) {
            for( var j = 0; j < self.teamLengths[1]; j++ ) {
                self.weather[i][j] = val;
            }
        }
    };
    MatchWeather.prototype.setTeamOffset = function(team, newOffset) {
        var self = this;
        self.teamOffsets[team] = newOffset;
    };
    
    
    return MatchWeather;
});