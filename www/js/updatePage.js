define(['gameData', 'logger', 'settings',
    'typeCSS', 'utils', 'loadSprite'], 
    function(gameData, logger, settings,
        typeCSS, utils, loadSprite) {
    "use strict";
   
   var updatePage = {};
   
   var aprilFools = true;
   aprilFools = false;
   
   function getDamageEmote(damage) {
       var emote;
       //logger.debug(damage);
       if (damage >= 400) {
           emote = "WutFace";
       } else if (damage >= 100) {
           //ohko
           emote = "PogChamp";
       } else if (damage >= 50) {
           //2hko
           emote = "BloodTrail";
       } else if (damage >= 33) {
           //3hko
           emote = "SeemsGood";
       } else if (damage >= 25) {
           //4hko
           emote = "OpieOP";
       } else if (damage >= 10) {
           //8hko
           emote = "FailFish";
       } else {
           // over 8hko
           emote = "TriHard";
       }
    
       return "<img src='../../img/emotes/" + emote + ".png' />";
   }
   
   function getPtEmotes(pt1, pt2) {
       var emote1 = pt1 > 0 ? getDamageEmote(pt1) : "";
       var emote2 = pt2 > 0 ? getDamageEmote(pt2) : "";
       return emote1 + emote2;
   }
   
   //show stages in html
    updatePage.updateStageHTML = function(match) {
        match.sixPkmn.forEach(function(pkmn, i) {
            gameData.STAGE_NAMES.forEach(function(stageName, stageNum) {
                var text = pkmn.stages[stageName];
                if (text >= 0)
                    text = "+" + text;
                $("#stage-" + i + "-" + stageNum).html(text);
            });
        });
    };

    var ACTIVE_ABILITY_COLOR = {
        Overgrow: '#53ed22',
        Blaze: '#f80000',
        Torrent: '#0040ff',
        Swarm: '#aaff00'
    };

    updatePage.updateAbilityHTML = function(pkmn, i) {
        var pkmnAbility = pkmn.ability;
        var account = pkmnAbility.account;
        if(settings.ignoreAbilitiesAndItems === true) {
           pkmnAbility = pkmn.ability2;
           account = 0;
        }
        
        
        var abilityIdPrefix = '#js-ability-';
        if (settings.layout === 'grid')
            abilityIdPrefix = '#js-ability-grid-';
        
        var ability = $(abilityIdPrefix + i).html("");

            //to do
            //shield dust, hydration, leaf guard, magic guard,
            //tangled feet, unburden

            //solar power removes hp even if the attacker did not use a damaging move
            //we will leave accounting of this to the user

            //add fake out to steadfast and put in less-obvious

            //skill swap, make pokemon clickable for hp damage / restore, power trick

            var activeStyle = '';
            if (pkmn.minHPLeft <= pkmn.stats.hp / 3 &&
                    (pkmnAbility.name === "Overgrow" ||
                            pkmnAbility.name === "Blaze" ||
                            pkmnAbility.name === "Torrent" ||
                            pkmnAbility.name === "Swarm")) {

                var color = ACTIVE_ABILITY_COLOR[pkmnAbility.name];
                activeStyle = 'text-shadow: -1px -1px #111, 1px -1px #111, -1px 1px #111, 1px 1px #111' +
                        ', -3px -3px 3px ' + color +
                        ', -3px 3px 3px ' + color +
                        ', 3px -3px 3px ' + color +
                        ', 3px 3px 3px ' + color + '; font-size: 19px;';
            }
            
            if ((pkmnAbility.name === 'Intimidate' || pkmnAbility.name === 'Download') &&
                    pkmn.teamIndex === 0)
                account = 1;

            switch(account) {
                case 2:
                    ability.append('<span class="is-accounted-ability">' + pkmnAbility.name + '</span>');
                    ability.attr("title", pkmnAbility.desc);
                    break;
                case 1:
                    ability.append('<span class="is-nonobvious-ability" style="' + activeStyle + '">' + pkmnAbility.name + '</span>');
                    ability.attr("title", "<span style='font-style: italic;'>Effects may not be obvious.</span><br /><br />" + pkmnAbility.desc);
                    break;
                case 0:
                    ability.append('<span class="is-unaccounted-ability">' + pkmnAbility.name + '</span>');
                    ability.attr("title", "<span style='font-style: italic;'>Effects not accounted for.</span><br /><br />" + pkmnAbility.desc);
                    break;
            }
    };
    
    updatePage.updateMovesHTML = function( match, pkmn, team, i, duels ) {
        function getMoveName( move, pp ) {
            var moveName = "";
            if ( match.gimmick === "fragile" ) {
                moveName = move.name;
            } else if ( pp < 5 ) {
                moveName = "<b><span style=\"color:#f088d8;text-shadow: -1px -1px #111, 1px -1px #111, -1px 1px #111, 1px 1px #111, -1px 0 #111, 1px 0 #111, 0 1px #111, 0 -1px #111;\">" + move.name + "</span></b>";
            } else if ( pp <= 8 ) {
                moveName = "<span style=\"color:#ff9c9c;text-shadow: -1px -1px #111, 1px -1px #111, -1px 1px #111, 1px 1px #111, -1px 0 #111, 1px 0 #111, 0 1px #111, 0 -1px #111;\">" + move.name + "</span>";
            } else {
                moveName = move.name;
            }
            return moveName;
        }
        
        for(var im = 0; im < 4; im++) {
            var move = pkmn.moves[im];
            var pp = pkmn.pp[im];
            var move_obj = $(".move-" + i + "-" + im).html("");
            if(!move)
                continue;
            
            var moveInfoClass = 'MoveInfo';
            var fontPercSize = '10';
            if(settings.layout === 'grid') {
                moveInfoClass = 'MoveInfo-grid';
                fontPercSize = '11';
            }
            
            
            if(team === 0)
                var moveInfo = '<div class="blue' + moveInfoClass + '">';
            else
                var moveInfo = '<div class="red' + moveInfoClass + '">';
            
            
            move_obj.attr("title", "");

            if (move.priority) {
                var priority;
                var priorityClass = "is-priority ";
                if (move.priority > 0) {
                    priority = '+' + move.priority;
                    priorityClass += "positive";
                } else {
                    priority = '- ' + (-1 * move.priority);
                    priorityClass += "negative";
                }

                if(team === 0) {
                    priority = '<span class="' + priorityClass + '">' + priority + ' </span>';
                    moveInfo += priority + ' ' + getMoveName(move, pp) + "<br />";
                } else {
                    priority = '<span class="' + priorityClass + '">  ' + priority + '</span>';
                    moveInfo += getMoveName(move, pp) + priority + "<br />";
                }
            } else
                moveInfo += getMoveName(move, pp) + "<br />";

            //accuracy
            var accuracy_str = "<span style='font-size: " + fontPercSize + "px;'>";
            
            if (move.accuracy === 0 || 
                    (duels[0].attacks[im].accuracy === 0 && duels[1].attacks[im].accuracy === 0 && duels[2].attacks[im].accuracy === 0)) {
                accuracy_str += "&infin;%";
            } else if (duels[0].attacks[im].accuracy === duels[1].attacks[im].accuracy && duels[0].attacks[im].accuracy === duels[2].attacks[im].accuracy) {
                accuracy_str += duels[0].attacks[im].accuracy + "%";
            } else {
                for (var io = 0; io < 3; io++) {
                    if (duels[io].attacks[im].accuracy === 0)
                        accuracy_str += "&infin;%";
                    else
                        accuracy_str += duels[io].attacks[im].accuracy + "%";
                    if (io < 2)
                        accuracy_str += " ";
                }
            }

            if (i >= 3)
                accuracy_str += " ";
            accuracy_str += "</span>";

            //category
            var categoryClass = "";
            if (move.category === "special")
                categoryClass = "special ";
            else if (move.category === "physical")
                categoryClass = "physical ";

            if (move.category === 'physical' && move.abnormalContact ||
                    move.category === 'special' && move.abnormalContact)
                categoryClass += "white-border ";

            if (categoryClass !== "") {
                categoryClass += "move-category-block";
                var imageContainer = "<div class='" + categoryClass + "'></div>";
                if (i < 3)
                    accuracy_str = imageContainer + " " + accuracy_str;
                else
                    accuracy_str = accuracy_str + imageContainer;
            }

            moveInfo += accuracy_str + "<div>";
            move_obj.append(moveInfo);
            
            var desc = "";
            
            
            if (move.power > 0)
//                if(move.name === "Hidden Power")
//                    desc += "<b>" + pkmn.hPowerBP + "</b> BP&nbsp;&nbsp;";
//                else
//                    desc += "<b>" + move.power + "</b> BP&nbsp;&nbsp;";
//            
            if(move.name === "Frustration")
                desc += "<b>" + pkmn.frustrationBP + "</b> BP&nbsp;&nbsp;";
            else if(move.name === "Return")
                desc += "<b>" + pkmn.returnBP + "</b> BP&nbsp;&nbsp;";
            
            if(["Hidden Power", "Natural Gift", "Frustration", "Return"].indexOf(move.name) !== -1) {
                desc += "<b>" + duels[0].attacks[im].power + "</b> BP&nbsp;&nbsp;";
                desc += getPrettyType(duels[0].attacks[im].type);
            } else {
                if(move.power) {
                    desc += "<b>" + move.power + "</b> BP&nbsp;&nbsp;";
                }
                desc += getPrettyType(move.type);
            }
            
            desc += "&nbsp;&nbsp;<i>(" + pp + " pp)</i><br><br>";
            //logger.debug(move);
            
            desc += move.desc;
            move_obj.attr("title", desc);
        }
    };
    
    updatePage.updateItemHTML = function(pkmn, i) {
        var pkmnItem = pkmn.item;
        var account = pkmnItem.account;
        if(settings.ignoreAbilitiesAndItems === true) {
           pkmnItem = pkmn.item2;
           account = 0;
        }
        
        
        var itemIdPrefix = '#js-item-';
        if (settings.layout === 'grid')
            itemIdPrefix = '#js-item-grid-';
        
        var item = $(itemIdPrefix + i);
        if (pkmnItem.name) {
            
            var desc = pkmnItem.desc;
            
            
            if (desc.indexOf("Held:") === -1) {
//                desc = "<i>This item might not be intended for use as a held item?</i> <br><br>"
//                    + desc;
            } else {
                desc = "<b>Held: </b>" + desc.substring(6);
            }
            if (pkmnItem.flingEffectId) {
                desc += "<br><br><b>When Flung: </b>" + gameData.ITEM_FLING_EFFECT_PROSE[pkmnItem.flingEffectId];
            }
            
            if (pkmnItem.naturalGiftType) {
                desc = desc + "<br><br><b>" + pkmnItem.naturalGiftPower + "</b> BP " + getPrettyType(pkmnItem.naturalGiftType) + " (Natural Gift)";
            } 
            
            item.html("");
            switch(account) {
                case 2:
                    item.append('<span class="is-accounted-item">' + pkmnItem.name + '</span>');
                    item.attr("title", desc);
                    break;
                case 1:
                    item.append('<span class="is-nonobvious-item">' + pkmnItem.name + '</span>');
                    item.attr("title", "<span style='font-style: italic;'>Effects may not be obvious.</span><br /><br />" + desc);
                    break;
                case 0:
                    item.append('<span class="is-unaccounted-item">' + pkmnItem.name + '</span>');
                    item.attr("title", "<span style='font-style: italic;'>Effects not accounted for.</span><br /><br />" + desc);
                    break;
            }
            
//            item.html(pkmnItem.name);
//            item.attr("title", desc);
            
        } else {
            item.html("");
        }
    };
    
    function getPrettyType(type) {
        
        var t1Style = 'font-style: italic; color: ' + typeCSS.getShade(type) + '; ';
        var t1Hue = typeCSS.getHue(type);
        t1Style += 'text-shadow: ';
        t1Style += '-2px -2px 2px ' + t1Hue + ', -2px 2px 2px ' + t1Hue + ', 2px -2px 2px ' + t1Hue + ', 2px 2px 2px ' + t1Hue + ', ';
        t1Style += '-2px 0 2px ' + t1Hue + ', 2px 0 2px ' + t1Hue + ', 0 -2px 2px ' + t1Hue + ', 0 2px 2px ' + t1Hue + ';';

        return '<span style="' + t1Style + '">' + type + '</span>';
    }
    
    
    updatePage.updateTypeHTML = function(pkmn, i) {
        var genderChar = '';
        if (pkmn.gender === "m")
                genderChar = "&#9794;";
        else if (pkmn.gender === "f")
            genderChar = "&#9792;";
        
        
        if (settings.layout === 'grid') {
            var t1 = $("#js-type-grid-" + i + '-1').html("");
            var t2 = $("#js-type-grid-" + i + '-2').html("");
            
            t1.html(getPrettyType(pkmn.type1) + '&nbsp;' + genderChar);
            if (pkmn.type2) {
                t2.html(getPrettyType(pkmn.type2));
            }
        } else {
            // diamond layout
            var types = $("#js-pkmn-types-" + i).html("");

            if (genderChar !== '')
                types.append("&nbsp;&nbsp;&nbsp;");

            types.append(getPrettyType(pkmn.type1));
            if (pkmn.type2) {
                types.append("&nbsp;&nbsp;" + getPrettyType(pkmn.type2));
            }

            /* update gender*/
            $("#js-pkmn-gender-" + i).html(genderChar);
            
        }
    };
    
    updatePage.updateDuelHTML = function(match) {
        var layout = settings.layout;
        
        var prefix = '#js-';
        if (layout === 'grid')
            prefix += 'grid-';
        
        var diamond = $("#diamond");
        match.teams[0].forEach(function(blue, ib) {
            match.teams[1].forEach(function(red, ir) {
                var blueDuel = match.getDuel( ib, ir, 0 );
                var redDuel = match.getDuel( ib, ir, 1 );
                
                var ibir = ib + '-' + ir;
                var ibir3 = ib + '-' + (ir + 3);
                var irib3 = (ir + 3) + '-' + ib;
                
                if(layout === 'grid') {
                    var blueSprite = $(prefix + 'sprite-' + ibir3);
                    var redSprite = $(prefix + 'sprite-' + irib3);
                    blueSprite.html('<img class="gridSpriteImg" src="/img/pokemon/bwicons/' + gameData.baseSpeciesID(blue.id) + '.png"/>');
                    redSprite.html('<img class="gridSpriteImg" src="/img/pokemon/bwicons/' + gameData.baseSpeciesID(red.id) + '.png"/>');
                }
                
                //PT- Percentage (of damage) Taken
                
                var redPtMin = Math.floor(100 * red.minDamageTaken / red.stats.hp);
                var redPtMax = Math.floor(100 * red.maxDamageTaken / red.stats.hp);
                
                var redPTStr = redPtMin + '%' + '<br />' + redPtMax + '%';
                
                var bluePtMin = Math.floor(100 * blue.minDamageTaken / blue.stats.hp);
                var bluePtMax = Math.floor(100 * blue.maxDamageTaken / blue.stats.hp);
                
                var bluePTStr = bluePtMin + '%' + '<br />' + bluePtMax + '%';

                var redPTColor = 'black';
                var bluePTColor = 'black';

                if (redPTStr === '0%<br />0%')
                    redPTColor = 'rgba(0,0,0,0)';
                if (bluePTStr === '0%<br />0%')
                    bluePTColor = 'rgba(0,0,0,0)';

                //if the blue move is 'not' effective and black, make the pt color light / white
                if (blue.moves[2]) {
                    if (layout !== 'grid' && blueDuel.attacks[2].effective === 'not') {
                        bluePTColor = 'rgb(250,250,250)';
                        if (bluePTStr === '0%<br />0%')
                            bluePTColor = 'rgba(175,175,175,0)';
                    }
                }
                if (red.moves[2]) {
                    if (layout !== 'grid' && redDuel.attacks[2].effective === 'not') {
                        redPTColor = 'rgb(250,250,250)';
                        if (redPTStr === '0%<br />0%')
                            redPTColor = 'rgba(175,175,175,0)';
                    }
                }

                var ptStyleStr = 'font-weight: bold;';

                bluePTStr = '<span style="' + ptStyleStr + ' color:' + bluePTColor + ';">' + bluePTStr + '</span>';
                redPTStr = '<span style="' + ptStyleStr + ' color:' + redPTColor + ';">' + redPTStr + '</span>';
                
                if (aprilFools) {
                    var blueEmotes = "<div style='margin-left:-20px;margin-right:-40px;'>" +getPtEmotes(redPtMin, redPtMax) + "</div>";
                    $(prefix + 'blue-percent-taken-' + ibir).html(blueEmotes);
                    
                    var redEmotes = "<div style='margin-left:-40px;margin-right:-20px;'>" +getPtEmotes(bluePtMin, bluePtMax) + "</div>";
                    $(prefix + 'red-percent-taken-' + ibir).html(redEmotes);
                } else {
                    $(prefix + 'red-percent-taken-' + ibir).html(redPTStr);
                    $(prefix + 'blue-percent-taken-' + ibir).html(bluePTStr);
                }


                var best = -1;
                var bestval = -1;

                //blue pokemon's moves
                for(var im = 0; im < 4; im++) {
                    var move = blue.moves[im];
                    var ibirim3 = '' + ib + "-" + (ir + 3) + "-" + im;
                    var ibirim = ibir + '-' + im;
                    
                    var moveBgColorStrip = $(prefix + 'move-bg-' + ibirim3).removeClass("e-super e-normal e-weak e-not e-status e-inadvisable e-advisable");
                    var moveBgColorCorner = $('#js-corner-' + ibirim).removeClass("e-super-blue e-normal-blue e-weak-blue e-not-blue e-status-blue e-inadvisable-blue e-advisable-blue");
                    
                    var moveDamageMin = $(prefix + 'move-damage-min-' + ibirim3).html("").css("font-weight", "normal");
                    var moveDamageMax = $(prefix + 'move-damage-max-' + ibirim3).html("").css("font-weight", "normal");
                    var movePercentageMin = $(prefix + 'move-percentage-min-' + ibirim3).html("").css("font-weight", "normal");
                    var movePercentageMax = $(prefix + 'move-percentage-max-' + ibirim3).html("").css("font-weight", "normal");
                    
                    //var moveText = moveAll.filter(".corner").removeClass("e-super-blue e-normal-blue e-weak-blue e-not-blue e-status-blue e-inadvisable-blue e-advisable-blue");
                    
                    //moveText = moveText.not(".corner");


                    //default status color- for unown, etc. with only one move
                    var colorClass = "status";
                    if (move !== undefined) {
                        var attack = blueDuel.attacks[im];

                        colorClass = attack.effective;

                        //most status moves have color class 'status' rather than their effectivity of 'normal'
                        if (move.category === 'status' && attack.effective === 'normal')
                            colorClass = 'status';

                        if ((move.category !== "status" && attack.effective !== "not") ||
                                attack.showDamage === true) {
                            if (move.OHKO) {
                                movePercentageMin.html("<span style='font-weight:bdold;font-style:italic;line-height:28px;white-space:pre;'>OHKO     </span>");
                            } else {
                                var avg = attack.min + attack.max;
                                if (avg > bestval) {
                                    best = im;
                                    bestval = avg;
                                }
                                
                                var percentMinRaw = Math.floor(100 * attack.min / red.stats.hp);
                                var percentMin = percentMinRaw + "%";
                                
                                var percentMaxRaw = Math.floor(100 * attack.max / red.stats.hp);
                                var percentMax = percentMaxRaw + "%";
                                
                                var attackMin = attack.min;
                                var attackMax = attack.max;
                                if(move.name === 'Spit Up' && blue.stockpiles === 0) {
                                    
                                    attackMin = '<span style="color:#999;">' + attackMin + '</span>';
                                    attackMax = '<span style="color:#999;">' + attackMax + '</span>';
                                    percentMin = '<span style="color:#999;">' + percentMin + '</span>';
                                    percentMax = '<span style="color:#999;">' + percentMax + '</span>';
                                }
                                
                                if (aprilFools) {
                                var minEmote = getDamageEmote(percentMinRaw);
                                var maxEmote = getDamageEmote(percentMaxRaw);
                                moveDamageMin.html(minEmote);
                                movePercentageMin.html(maxEmote);
                                } else {
                                    movePercentageMin.html(percentMin);
                                    movePercentageMax.html(percentMax);
                                    moveDamageMin.html(attackMin);
                                    moveDamageMax.html(attackMax);
                                }
                            }
                        }
                    }

                    if(!settings.disableMoveMarkings) {
                        if (attack.mark === 'negative' && attack.effective !== 'not')
                            colorClass = 'inadvisable';

                        if (attack.mark === 'positive' && attack.effective !== 'not')
                            colorClass = 'advisable';
                    }

                    moveBgColorStrip.addClass("e-" + colorClass);
                    moveBgColorCorner.addClass("e-" + colorClass + "-blue");

                }

                if (best >= 0) {
                    var ibirim3 = '' + ib + "-" + (ir + 3) + "-" + best;
                    $(prefix + 'move-damage-min-' + ibirim3).css("font-weight", "bold");
                    $(prefix + 'move-damage-max-' + ibirim3).css("font-weight", "bold");
                    $(prefix + 'move-percentage-min-' + ibirim3).css("font-weight", "bold");
                    $(prefix + 'move-percentage-max-' + ibirim3).css("font-weight", "bold");
                }

                best = -1;
                bestval = -1;


                //red pokemon's moves
                for(var im = 0; im < 4; im++) {
                    var move = red.moves[im];
                    var iribim3 = '' + (ir + 3) + "-" + ib + "-" + im;
                    var ibirim = ibir + '-' + im;
                    
                    var moveBgColorStrip = $(prefix + 'move-bg-' + iribim3).removeClass("e-super e-normal e-weak e-not e-status e-inadvisable e-advisable");
                    var moveBgColorCorner = $('#js-corner-' + ibirim).removeClass("e-super-red e-normal-red e-weak-red e-not-red e-status-red e-inadvisable-red e-advisable-red");
                    
                    var moveDamageMin = $(prefix + 'move-damage-min-' + iribim3).html("").css("font-weight", "normal");
                    var moveDamageMax = $(prefix + 'move-damage-max-' + iribim3).html("").css("font-weight", "normal");
                    
                    var movePercentageMin = $(prefix + 'move-percentage-min-' + iribim3).html("").css("font-weight", "normal");
                    var movePercentageMax = $(prefix + 'move-percentage-max-' + iribim3).html("").css("font-weight", "normal");

                    
                    //default status color- for unown, etc. with only one move
                    var colorClass = "status";
                    if (move !== undefined) {
                        var attack = redDuel.attacks[im];

                        colorClass = attack.effective;

                        //most status moves have color class 'status' rather than their effectivity of 'normal'
                        if (move.category === 'status' && attack.effective === 'normal')
                            colorClass = 'status';

                        //showDamage is true for moves such as Stealth Rock
                        if ((move.category !== "status" && attack.effective !== "not") ||
                                attack.showDamage === true) {
                            if (move.OHKO) {
                                movePercentageMin.html("<span style='font-weight:bdold;font-style:italic;line-height:28px;white-space:pre;'>     OHKO</span>");
                            } else {
                                var avg = attack.min + attack.max;
                                if (avg > bestval) {
                                    best = im;
                                    bestval = avg;
                                }
                                var percentMinRaw = Math.floor(100 * attack.min / blue.stats.hp);
                                var percentMin = percentMinRaw + "%";
                                
                                var percentMaxRaw = Math.floor(100 * attack.max / blue.stats.hp);
                                var percentMax = percentMaxRaw + "%";
                                
                                var attackMin = attack.min;
                                var attackMax = attack.max;
                                if(move.name === 'Spit Up' && red.stockpiles === 0) {
                                    
                                    attackMin = '<span style="color:#999;">' + attackMin + '</span>';
                                    attackMax = '<span style="color:#999;">' + attackMax + '</span>';
                                    percentMin = '<span style="color:#999;">' + percentMin + '</span>';
                                    percentMax = '<span style="color:#999;">' + percentMax + '</span>';
                                }
                                
                                
                                if (aprilFools) {
                                    var minEmote = getDamageEmote(percentMinRaw);
                                    var maxEmote = getDamageEmote(percentMaxRaw);
                                    moveDamageMin.html(maxEmote);
                                    movePercentageMin.html(minEmote);
                                } else {
                                    movePercentageMin.html(percentMin);
                                    movePercentageMax.html(percentMax);
                                    moveDamageMin.html(attackMin);
                                    moveDamageMax.html(attackMax);
                                }
                            }
                        }

                    }
                    
                    if(!settings.disableMoveMarkings) {
                        if (attack.mark === 'negative' && attack.effective !== 'not')
                            colorClass = 'inadvisable';

                        if (attack.mark === 'positive' && attack.effective !== 'not')
                            colorClass = 'advisable';
                    }

                    moveBgColorStrip.addClass("e-" + colorClass);
                    //moveText.addClass("e-" + colorClass);
                    moveBgColorCorner.addClass("e-" + colorClass + "-red");
                }

                if (best >= 0) {   
                    var iribim3 = '' + (ir + 3) + "-" + ib + "-" + best;
                    $(prefix + 'move-damage-min-' + iribim3).css("font-weight", "bold");
                    $(prefix + 'move-damage-max-' + iribim3).css("font-weight", "bold");
                    $(prefix + 'move-percentage-min-' + iribim3).css("font-weight", "bold");
                    $(prefix + 'move-percentage-max-' + iribim3).css("font-weight", "bold");
                }

                var speed = $(prefix + "speed-" + ib + "-" + ir).removeClass("blue red purple");
                
                
                if (blueDuel.isFaster) {
                    speed.addClass("blue");
                } else if (blueDuel.isSlower) {
                    speed.addClass("red");
                } else {
                    speed.addClass("purple");
                }
                $(prefix + "weather-" + ib + "-" + ir).attr("src", "/img/" + match.getWeather(ib, ir) + ".png");

            });
        });
    };
    
    updatePage.updateAll = function(match) {
        var animeIndex = -1;
        var matchHashStr = '';
        match.sixPkmn.forEach(function(pkmn) {
            matchHashStr = pkmn.id + pkmn.name.substr(0, 5);
        });
        
        match.sixPkmn.forEach(function(pkmn, i) {
            //load sprite
            loadSprite(pkmn, i, matchHashStr);

            var team = i < 3 ? 0 : 1;
            var teamIndex = i - team * 3;
            
            //set other fields
            $(".pkmn-id-" + i).text("#" + pkmn.id);
            $("#js-pkmn-name-" + i).val(pkmn.name + " " + pkmn.setName);
            $(".pkmn-hp-" + i).text(pkmn.stats.hp);

            updatePage.updateAbilityHTML(pkmn, i);

            gameData.STAT_NAMES.forEach(function(statName, statNum) {
                $(".stat-" + i + "-" + statNum).attr("title", pkmn.stats[statName]);
            });

            updatePage.updateMovesHTML(match, pkmn, team, i, match.getDuels(team, teamIndex));
            updatePage.updateTypeHTML(pkmn, i);
            
            updatePage.updateItemHTML(pkmn, i);

        }); //end loop over 6 pokemon

        
        updatePage.updateDuelHTML(match);
        updatePage.updateStageHTML(match);
    };
    
    return updatePage;
});


