define(['jqueryui'], function() {
    "use strict";
    
    function getEmote(name) {
        return "<div class='emoteContainer'><img src='../../img/emotes-named/0.8/" + name + ".png' /></div>";
    }
    
    var routines = {};
    
    var LINES = 5;
    var blueFeed = [];
    var blueInd = 0;
    var redFeed = [];
    var redInd = 0;
    for(var i = 0; i < LINES; i++){
        blueFeed.push('');
        redFeed.push('');
    }
    
    routines.blueFeed = function(feedText) {
        //console.log(blueFeed);
        if (feedText === 'Team Blue won the match!')
            feedText += " \\" + getEmote('Kappa') + '/';
        if (feedText === 'Team Red won the match!')
            feedText += ' ' + getEmote('BibleThump');
        
        var lastLine = blueFeed[blueInd] = "<span class='tppBlueFeed'>" + feedText + "  </span>";
        blueInd = (blueInd+1) % LINES;
        var i = blueInd; 
        var feed = "";
        do {
            if (blueFeed[i] !== '') {
                //console.log("i is " + i + " and blueInd-1%LINES is " + (blueInd) % LINES);
                feed += blueFeed[i] + "<br>";
            }
            i = (i+1) % LINES;
            
        } while (i !== (blueInd + LINES - 1) % LINES);
        
        feed += '<div id="js-tppBlueLatest">' + lastLine + '</div>';
        
        $("#js-blueBets").html(feed);
        $("#js-tppBlueLatest").effect("highlight", {color:'#8bf'}, 2500);
    };
    
    routines.redFeed = function(feedText) {
        //console.log(redFeed);
        if (feedText === 'Team Red won the match!')
            feedText += " \\" + getEmote('Kappa') + '/';
        if (feedText === 'Team Blue won the match!')
            feedText += ' ' + getEmote('BibleThump');
        var lastLine = redFeed[redInd] = "<span class='tppRedFeed'>" + feedText + "  </span>";
        redInd = (redInd+1) % LINES;
        var i = redInd; 
        var feed = "";
        do {
            if (redFeed[i] !== '')
                feed += redFeed[i] + "<br>";
            i = (i+1) % LINES;
        } while (i !== (redInd + LINES - 1) % LINES);
        
        feed += '<div id="js-tppRedLatest">' + lastLine + '</div>';
        $("#js-redBets").html(feed);
        $("#js-tppRedLatest").effect("highlight", {color:'#f77'}, 2500);
    };
    
    
    return routines;
});