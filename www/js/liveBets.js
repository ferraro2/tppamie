define(["Logger"], function(logger) {
    "use strict";

    var liveBets = {};
    var statsNotice = "";
//    var statsNotice = "No stats available";
    var statsNotice = "Mouseover for player info";
    
    function clear() {
        updateTopBlueBets([]);
        updateTopRedBets([]);
        var emptyData = {};
        emptyData.blue = {};
        emptyData.red = {};
        emptyData.blue.odds = 1;
        emptyData.blue.total = 0;
        emptyData.red.total = 0;
        var emptyPerc = {};
        emptyPerc.a = 0;
        emptyPerc.b = 0;
        emptyPerc.c = 0;
        emptyPerc.d = 0;
        emptyPerc._1 = 0;
        emptyPerc._2 = 0;
        emptyPerc._3 = 0;
        emptyData.blue.movePercentages = emptyPerc;
        emptyData.red.movePercentages = emptyPerc;
        updateData(emptyData);
    }
    
    function newUpdates(updates, match) {
        updates.forEach( function(update) {
//            logger.debug("Received " + update.type + " update. Payload:");
//            logger.debug(update.payload);
            switch(update.type) {
                case 'odds':
                    updateOdds(update.payload);
                    break;
                case 'team 0 pokeyen total':
                case 'team 1 pokeyen total':
                    updateTeamPokeyenTotal(update.payload);
                    break;
                case 'team 0 top bets':
                case 'team 1 top bets':
                    updateTopBets(update.payload);
                    break;
                case 'team 0 move percentages':
                case 'team 1 move percentages':
                    updateTeamMovePerc(update.payload);
            }
        });
    }
    
    function updateOdds(data) {
        var odds = data.odds;
        if( odds === 0 ) {
            $("#js-odds").html('0 : 0');
        } else {
            if (odds < 1) {
                $("#js-odds").html('1 : ' + Math.round10(1/odds, -2));
            } else if (odds > 1) {
                $("#js-odds").html(Math.round10(odds, -2) + ' : 1');
            } else {
                $("#js-odds").html('0 : 0');
            }
        }   
//              //reversed odds
//            if (odds < 1) {
//                $("#js-odds").html(decFormat(1/odds, 2) + ' : 1');
//            } else if (odds > 1) {
//                $("#js-odds").html('1 : ' + decFormat(odds, 2));
//            } else {
//                $("#js-odds").html('1 : 1');
//            }
    }
    
    function updateTopBets(data) {
        if (data.team === 0)
            updateTopBlueBets(data.bets);
        else if (data.team === 1)
            updateTopRedBets(data.bets);
    }
    
    function updateTopBlueBets(topBets) {
        var str = '';
        topBets.forEach(function(bet) {
//            bet.playerInfo.emotes = [57116];
            str += getBlueBet(bet) + '\n';
        });
        
        str += '<span class="light-notice">    ' + statsNotice + '</span>';
        
        $("#js-blueBets").html(str).addClass("");
    }

        
    function updateTopRedBets(topBets) {
        var str = '';
        topBets.forEach(function(bet) {
//            bet.playerInfo.emotes = [57116];
            str += getRedBet(bet) + '\n';
        });
        
        str += '<span class="light-notice">' + statsNotice + '    </span>';
        
        $("#js-redBets").html(str);
    }
    
    function updateTeamPokeyenTotal(data) {
        var team = data.team;
        var total = data.pokeyenTotal;
        if( team === 0 ) {
            $("#js-blueTotal").html(getEmote("tppPokeyen") + moneyFormat(total));
        } else {
            $("#js-redTotal").html(getEmote("tppPokeyen") + moneyFormat(total));
        }
    }
    
    
    function updateTeamMovePerc(data) {
        var team = data.team;
        var movePerc = data.movePerc;
        if (team === 0) {
            var percHtml = moveLetterPerc(movePerc) + moveNumberPerc(movePerc);
            $("#js-blueMovePerc").html(percHtml);
        } else {
            var percHtml = moveNumberPerc(movePerc) + moveLetterPerc(movePerc);
            $("#js-redMovePerc").html(percHtml);
        }
    }
    
    function moveLetterPerc(perc) {
        var ret = '<div class="percentages">';
        ret += percFormat('A', perc.a);
        ret += '<br>';
        ret += percFormat('B', perc.b);
        ret += '<br>';
        ret += percFormat('C', perc.c);
        ret += '<br>';
        ret += percFormat('D', perc.d);
        ret += '<br>';
        ret += '</div>';
        return ret;
    }
    
    function moveNumberPerc(perc) {
        var ret = '<div class="percentages">';
        ret += percFormat('1', perc['1']);
        ret += '<br>';
        ret += percFormat('2', perc['2']);
        ret += '<br>';
        ret += percFormat('3', perc['3']);
        ret += '<br>';
        ret += '</div>';
        return ret;
    }
    
    function percFormat(move, perc) {
        if( perc === 100 ) 
            perc = 'MAX';
        return '<span class="move move' + move + '">' + perc + ' %</span>';
    }
    
    function moneyFormat(x) {
        var parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }
    
    
    function getCustomHtml(player) {
        switch(player.toLowerCase()) {
            case 'beesafree':
                return getEmote('beeWow') + 
                        getEmote('tppCursor') + 
                        getEmote('beeHeart');
                break;
            case 'visualizebot':
                return getEmote('MrDestructoid');
                break;
            case 'projectrevotpp':
            case 'keredau':
            case 'twitch_plays_3ds':
            case 'twitchplayspokemon':
            case 'felkcraft':
                return getEmote('tppCursor');
                break;
            case 'chauzu_vgc':
                return getEmote('weedKnife') +
                        getEmote('punWaifu');
                break;
            case 'addarash1':
//                return getEmote("KappaWealth") + getEmote("fragKnife") + getEmote("bearCake");
                return getEmote('KappaWealth') +
                        getEmote('fragKnife');
                break;
            case 'wolf_drawn':
                var ret = getEmote('tannerCash') +
                        getEmote('zedRengardoge') + 
                        getEmote('tannerCash');
                return ret;
                break;
            case 'chaosdukemon':
//                var ret = getEmote('angryCash') + 
//                        getEmote('dodCash') + 
//                        getEmote('KappaWealth') + 
//                        getEmote('punDokuro') + 
//                        getEmote('tannerCash') + 
//                        getEmote('angryCash');
                var ret = getEmote('silverRupee') + 
                        getEmote('redRupee') + 
                        getEmote('linkKapp') + 
                        getEmote('hotSword') + 
                        getEmote('dokTrifroid') + 
                        getEmote('kylieRupee') + 
                        getEmote('purpleRupee');
                return ret;
                break;
            case 'nkekev':
                return getEmote('deIlluminati');
            default:
                ret = '';
                return ret;
        }
    }
    
    function getEmote(name) {
        return "<div class='emoteContainer'><img src='/img/emotes-named/0.8/" + name + ".png' /></div>";
    }
    
    function getEmoteWithId(id) {
        return "<div class='emoteContainer2'><img src='https://static-cdn.jtvnw.net/emoticons/v1/" + id + "/1.0' /></div>";
    }
    
    function getRankEmote(rank) {
        if (rank === 1)
            return getEmote('BORT');
        else if (rank <= 10)
            return getEmote('Kreygasm');
        else if (rank <= 25)
            return getEmote('PogChamp');
    }
    
    function getBlueBet(bet) {
        var ret = [];
        ret.push("<span class='move move" + bet.move.toUpperCase() + "'>" + bet.move.toUpperCase() + "</span>");
        //₱
        ret.push("<span class='amount'>  " + moneyFormat(bet.amount) + "</span>");
        ret.push("<span class='username'>  " + bet.playerInfo.displayName + "</span>");
        var rank = bet.playerInfo.pokeyen_bet_rank;
        if (rank === 1) {
            rank = 2;
        }
        if (bet.player === 'chaosdukemon') {
            rank = 1;
        }
        if (rank) {
            ret.push("<span class='rank'>  #" + rank + "  </span>");
            ret.push(getRankEmote(rank));
        } else {
            ret.push(' ' + getEmote('TriHard'));
        }
        if(bet.playerInfo.subscriber) {
            ret.push("" + getEmote('tppSlowpoke'));
        }
        ret.push('' + getCustomHtml(bet.player));
        
        var numEmotes = getNumEmotes(bet.player, rank);
        
//        if( bet.player === 'domdude64' ) {
//            bet.playerInfo.displayName = "ANON99999999999999999999";
//            numEmotes = 6969;
//            bet.playerInfo.emotes = [{"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}];
//            bet.playerInfo.emotes = [{"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}, {"name": "extainzElite", "id": 34669}];
//        }
        
        if (bet.playerInfo.emotes) {
            bet.playerInfo.emotes.forEach( function(emote, i) {
                if( i < numEmotes ) {
                    ret.push('' + getEmoteWithId(emote.id));
                }
            });
        }
        
        return addTooltip(bet, numEmotes, ret.join(''));
    }

    function getNumEmotes(player, rank) {
        if( player === 'chaosdukemon' || player === 'bexxxxxxx' )
            return 6969;
        if( !rank )
            return 1;
        else if( rank <= 1 )
            return 6;
        else if( rank <= 5 )
            return 5;
        else if( rank <= 10 )
            return 4;
        else if( rank <= 20 )
            return 3;
        else if( rank <= 50 )
            return 2;
        else
            return 1;
    }

    function getRedBet(bet) {
        var ret = [];
        var rank = bet.playerInfo.pokeyen_bet_rank;
        var numEmotes = getNumEmotes(bet.player, rank);
        
//        if( bet.player === 'phoenx67' ) {
//            bet.playerInfo.displayName = "ANON99999999999999999999";
//            numEmotes = 6969;
//            bet.playerInfo.emotes = [{"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}];
//            bet.playerInfo.emotes = [{"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}, {"name": "extainzElite", "id": 34667}];
//        }
        
        if (bet.playerInfo.emotes) {
            bet.playerInfo.emotes.forEach( function(emote, i) {
                if( i < numEmotes ) {
                    ret.push(getEmoteWithId(emote.id) + '');
                }
            });
        }
        ret.push(getCustomHtml(bet.player) + '');
        if(bet.playerInfo.subscriber) {
            ret.push(getEmote('tppSlowpoke') + '');
        }
        if (rank === 1) {
            rank = 2;
        }
        if (bet.player === 'chaosdukemon') {
            rank = 1;
        }
        if (rank) {
            ret.push(getRankEmote(rank));
            ret.push("<span class='rank'>  #" + rank + "  </span>");
        } else {
            ret.push(getEmote('TriHard') + ' ');
        }
        ret.push("<span class='username'>" + bet.playerInfo.displayName + "  </span>");
        ret.push("<span class='amount'>" + moneyFormat(bet.amount) + "  </span>");
        ret.push("<span class='move move" + bet.move.toUpperCase() + "'>" + bet.move.toUpperCase() + "</span>");
        return addTooltip(bet, numEmotes, ret.join(''));
    }

    function addTooltip(bet, numEmotes, betStr) {
        var ret = [];
        
        var emotes = bet.playerInfo.emotes;
        ret.push("<span class='tooltip singleBet' title='");
        var ret2 = [];
        if( bet.player !== bet.playerInfo.displayName.toLowerCase() )
            ret2.push("Username: " + bet.player);
        ret2.push("Balance: " + moneyFormat(bet.playerInfo.pokeyen));
        ret2.push("Tokens: " + moneyFormat(bet.playerInfo.tokens));
        
        if( emotes ) {
            var emoteNames = [];
            emotes.forEach( function(emote, i) {
                if( i < numEmotes )
                    emoteNames.push(emote.name);
            });
            var emotesPretty = emoteNames.join(', ');
            if( emotesPretty )
                ret2.push("Current emotes: " + emotesPretty);
            
            if( numEmotes === 1 )
                ret2.push("Eligible for up to 1 emote");
            else
                ret2.push("Eligible for up to " + numEmotes + " emotes");
        }
        
//        if (bet.playerInfo.badge)
//            ret.push("Selected badge: " + moneyFormat(bet.playerInfo.badge) + "<br><br>");
//        
        ret.push(ret2.join('<br><br>'));
        ret.push("'>");
        ret.push(betStr);
        ret.push("</span>");
        return ret.join('');
    }
   
   
    return newUpdates;
});