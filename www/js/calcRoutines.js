define(['gameData'], function(gameData) {
    "use strict";

    var routines = {};
    var TYPE_CODE = {
        normal: 0,
        fire: 1,
        water: 2,
        electric: 3,
        grass: 4,
        ice: 5,
        fighting: 6,
        poison: 7,
        ground: 8,
        flying: 9,
        psychic: 10,
        bug: 11,
        rock: 12,
        ghost: 13,
        dragon: 14,
        dark: 15,
        steel: 16
    };
    var TYPE_NAMES = Object.keys(TYPE_CODE);
    
    var HP_TYPE_CODE = {
        fighting: 0,
        flying: 1,
        poison: 2,
        ground: 3,
        rock: 4,
        bug: 5,
        ghost: 6,
        steel: 7,
        fire: 8,
        water: 9,
        grass: 10,
        electric: 11,
        psychic: 12,
        ice: 13,
        dragon: 14,
        dark: 15
    };
    var HP_TYPE_NAMES = Object.keys(HP_TYPE_CODE);
    
    var aprilfools = false;
    
    var TYPE_CHART = {
        normal: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0, 1, 1, 0.5],
        fire: [1, 0.5, 0.5, 1, 2, 2, 1, 1, 1, 1, 1, 2, 0.5, 1, 0.5, 1, 2],
        water: [1, 2, 0.5, 1, 0.5, 1, 1, 1, 2, 1, 1, 1, 2, 1, 0.5, 1, 1],
        electric: [1, 1, 2, 0.5, 0.5, 1, 1, 1, 0, 2, 1, 1, 1, 1, 0.5, 1, 1],
        grass: [1, 0.5, 2, 1, 0.5, 1, 1, 0.5, 2, 0.5, 1, 0.5, 2, 1, 0.5, 1, 0.5],
        ice: [1, 0.5, 0.5, 1, 2, 0.5, 1, 1, 2, 2, 1, 1, 1, 1, 2, 1, 0.5],
        fighting: [2, 1, 1, 1, 1, 2, 1, 0.5, 1, 0.5, 0.5, 0.5, 2, 0, 1, 2, 2],
        poison: [1, 1, 1, 1, 2, 1, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 0],
        ground: [1, 2, 1, 2, 0.5, 1, 1, 2, 1, 0, 1, 0.5, 2, 1, 1, 1, 2],
        flying: [1, 1, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 0.5],
        psychic: [1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0.5, 1, 1, 1, 1, 0, 0.5],
        bug: [1, 0.5, 1, 1, 2, 1, 0.5, 0.5, 1, 0.5, 2, 1, 1, 0.5, 1, 2, 0.5],
        rock: [1, 2, 1, 1, 1, 2, 0.5, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 0.5],
        ghost: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 0.5],
        dragon: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0.5],
        dark: [1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 0.5],
        steel: [1, 0.5, 0.5, 0.5, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0.5]
    };
    var TYPE_CHART_INVERSE = {
        normal: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 2],
        fire: [1, 2, 2, 1, 0.5, 0.5, 1, 1, 1, 1, 1, 0.5, 2, 1, 2, 1, 0.5],
        water: [1, 0.5, 2, 1, 2, 1, 1, 1, 0.5, 1, 1, 1, 0.5, 1, 2, 1, 1],
        electric: [1, 1, 0.5, 2, 2, 1, 1, 1, 2, 0.5, 1, 1, 1, 1, 2, 1, 1],
        grass: [1, 2, 0.5, 1, 2, 1, 1, 2, 0.5, 2, 1, 2, 0.5, 1, 2, 1, 2],
        ice: [1, 2, 2, 1, 0.5, 2, 1, 1, 0.5, 0.5, 1, 1, 1, 1, 0.5, 1, 2],
        fighting: [0.5, 1, 1, 1, 1, 0.5, 1, 2, 1, 2, 2, 2, 0.5, 2, 1, 0.5, 0.5],
        poison: [1, 1, 1, 1, 0.5, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 2],
        ground: [1, 0.5, 1, 0.5, 2, 1, 1, 0.5, 1, 2, 1, 2, 0.5, 1, 1, 1, 0.5],
        flying: [1, 1, 1, 2, 0.5, 1, 0.5, 1, 1, 1, 1, 0.5, 2, 1, 1, 1, 2],
        psychic: [1, 1, 1, 1, 1, 1, 0.5, 0.5, 1, 1, 2, 1, 1, 1, 1, 2, 2],
        bug: [1, 2, 1, 1, 0.5, 1, 2, 2, 1, 2, 0.5, 1, 1, 2, 1, 0.5, 2],
        rock: [1, 0.5, 1, 1, 1, 0.5, 2, 1, 2, 0.5, 1, 0.5, 1, 1, 1, 1, 2],
        ghost: [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 1, 1, 0.5, 1, 2, 2],
        dragon: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 1, 2],
        dark: [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0.5, 1, 1, 0.5, 1, 2, 2],
        steel: [1, 2, 2, 2, 1, 0.5, 1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 2]
    };
    var TYPE_CHART_ICE_SE_ON_BUG = {
        normal: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0, 1, 1, 0.5],
        fire: [1, 0.5, 0.5, 1, 2, 2, 1, 1, 1, 1, 1, 2, 0.5, 1, 0.5, 1, 2],
        water: [1, 2, 0.5, 1, 0.5, 1, 1, 1, 2, 1, 1, 1, 2, 1, 0.5, 1, 1],
        electric: [1, 1, 2, 0.5, 0.5, 1, 1, 1, 0, 2, 1, 1, 1, 1, 0.5, 1, 1],
        grass: [1, 0.5, 2, 1, 0.5, 1, 1, 0.5, 2, 0.5, 1, 0.5, 2, 1, 0.5, 1, 0.5],
        ice: [1, 0.5, 0.5, 1, 2, 0.5, 1, 1, 2, 2, 1, 2, 1, 1, 2, 1, 0.5],
        fighting: [2, 1, 1, 1, 1, 2, 1, 0.5, 1, 0.5, 0.5, 0.5, 2, 0, 1, 2, 2],
        poison: [1, 1, 1, 1, 2, 1, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 0],
        ground: [1, 2, 1, 2, 0.5, 1, 1, 2, 1, 0, 1, 0.5, 2, 1, 1, 1, 2],
        flying: [1, 1, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 0.5],
        psychic: [1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0.5, 1, 1, 1, 1, 0, 0.5],
        bug: [1, 0.5, 1, 1, 2, 1, 0.5, 0.5, 1, 0.5, 2, 1, 1, 0.5, 1, 2, 0.5],
        rock: [1, 2, 1, 1, 1, 2, 0.5, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 0.5],
        ghost: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 0.5],
        dragon: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0.5],
        dark: [1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 0.5],
        steel: [1, 0.5, 0.5, 0.5, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0.5]
    };
    var TYPE_CHART_INVERSE_ICE_SE_ON_BUG = {
        normal: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 2],
        fire: [1, 2, 2, 1, 0.5, 0.5, 1, 1, 1, 1, 1, 0.5, 2, 1, 2, 1, 0.5],
        water: [1, 0.5, 2, 1, 2, 1, 1, 1, 0.5, 1, 1, 1, 0.5, 1, 2, 1, 1],
        electric: [1, 1, 0.5, 2, 2, 1, 1, 1, 2, 0.5, 1, 1, 1, 1, 2, 1, 1],
        grass: [1, 2, 0.5, 1, 2, 1, 1, 2, 0.5, 2, 1, 2, 0.5, 1, 2, 1, 2],
        ice: [1, 2, 2, 1, 0.5, 2, 1, 1, 0.5, 0.5, 1, 0.5, 1, 1, 0.5, 1, 2],
        fighting: [0.5, 1, 1, 1, 1, 0.5, 1, 2, 1, 2, 2, 2, 0.5, 2, 1, 0.5, 0.5],
        poison: [1, 1, 1, 1, 0.5, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 2],
        ground: [1, 0.5, 1, 0.5, 2, 1, 1, 0.5, 1, 2, 1, 2, 0.5, 1, 1, 1, 0.5],
        flying: [1, 1, 1, 2, 0.5, 1, 0.5, 1, 1, 1, 1, 0.5, 2, 1, 1, 1, 2],
        psychic: [1, 1, 1, 1, 1, 1, 0.5, 0.5, 1, 1, 2, 1, 1, 1, 1, 2, 2],
        bug: [1, 2, 1, 1, 0.5, 1, 2, 2, 1, 2, 0.5, 1, 1, 2, 1, 0.5, 2],
        rock: [1, 0.5, 1, 1, 1, 0.5, 2, 1, 2, 0.5, 1, 0.5, 1, 1, 1, 1, 2],
        ghost: [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 1, 1, 0.5, 1, 2, 2],
        dragon: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 1, 2],
        dark: [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0.5, 1, 1, 0.5, 1, 2, 2],
        steel: [1, 2, 2, 2, 1, 0.5, 1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 2]
    };
    
    routines.getSingleTypeEffectiveness = function(moveType, defType, fInverse) {
//        console.log("MOVE TYPE:" + moveType);
//        console.log("DEF TYPE:" + defType);
        var chart = TYPE_CHART;
        if(fInverse) {
            chart = TYPE_CHART_INVERSE;
        }
        if(aprilfools) {
            chart = TYPE_CHART_ICE_SE_ON_BUG;
            if(fInverse) {
                chart = TYPE_CHART_INVERSE_ICE_SE_ON_BUG;
            }
        }
        return chart[moveType][TYPE_CODE[defType]];
    };
    
    routines.getSingleEffectiveness = function(moveType, defType, attacker, defender, defIsHovering, fInverse) {
        if (defType === 'flying' && ( 
                defender.isRoosting || 
                !defIsHovering && moveType === 'ground') ) {
            //if is roosting, flying type is gone, so ignore the flying type
            //flying type defender will take neutral damage from the ground move, because defender is not hovering
            return 1;
        }
        
        if (defIsHovering && moveType === 'ground') {
            //hovering pokemon takes no damage from ground type moves
            return 0;
        }
        
        var ghostRevealed = (defender.ghostRevealed || attacker.ability.name === 'Scrappy');

        switch(moveType) {
            case 'normal':
            case 'fighting':
                if(defType === "ghost" && ghostRevealed)
                    return 1;
                break;
            case 'psychic':
                if (defType === 'dark' && defender.darkRevealed)
                    return 1;
                break;
        }
        return routines.getSingleTypeEffectiveness(moveType, defType, fInverse);
    };
    
    routines.getModifiedStat = function(stat, tryBoost) {
        var boost = Math.min(6, Math.max(-6, tryBoost));
        return boost > 0 ? Math.floor(stat * (2 + boost) / 2)
                : boost < 0 ? Math.floor(stat * 2 / (2 - boost))
                : stat;
    };

    routines.getAccEvaFactor = function(tryBoost) {
        var boost = Math.min(6, Math.max(-6, tryBoost));
        return gameData.ACCURACY[6 + boost];
    };
    
    routines.getEffectiveWeather = function(pokemon, duelWeather) {
        if (pokemon.ability.name === "Air Lock" || pokemon.ability.name === "Cloud Nine")
            return "none";
        else
            return duelWeather;
    };
    
    routines.compareSpeeds = function(target, targetTeam, opposing, opposingTeam, match) {
        var targetSpeed = routines.getDuelSpeed(target, targetTeam, 'none', match);
        var opposingSpeed = routines.getDuelSpeed(opposing, opposingTeam, 'none', match);
        if ( targetSpeed > opposingSpeed )
            return 1;
        else if ( targetSpeed < opposingSpeed )
            return -1;
        else
            return 0;
    };
    
    routines.getDuelSpeed = function(pkmn, pkmnTeam, weather, match) {
        //add cherrim flower gift and whatever else
        var boost = pkmn.stages.spd;
        var speed;
        // unaware and mold breaker do not affect speed
        if (pkmn.ability.name === 'Simple')
            speed = routines.getModifiedStat(pkmn.stats.spd, 2 * boost);
        else
            speed = routines.getModifiedStat(pkmn.stats.spd, boost);
        
//        console.log(pkmn.name);
//        console.log(pkmn.effectiveItem());
//        console.log(pkmn.effectiveItem().name);
        
        switch(pkmn.effectiveItem().name) {
            case "Quick Powder":
                if (pkmn.transformedName === "Ditto")
                    speed *= 2;
                break;
            case "Choice Scarf":
                speed = Math.floor(speed * 1.5);
                break;
            case "Macho Brace":
            case "Iron Ball":
            case "Power Weight":
            case "Power Bracer":
            case "Power Belt":
            case "Power Lens":
            case "Power Band":
            case "Power Anklet":
                speed = Math.floor(speed / 2);
                break;
        }
        
        if (!pkmn.hasEffectiveItem() && pkmn.ability.name === "Unburden") {
            speed *= 2;
        }
        
        if ((pkmn.ability.name === "Chlorophyll" && weather === 'sun') ||
                (pkmn.ability.name === "Sand Rush" && weather === "sandstorm") ||
                (pkmn.ability.name === "Swift Swim" && weather === 'rain')) {
            speed *= 2;
        }
        if (pkmn.ability.name === 'Quick Feet') {
            if (pkmn.hasMajorStatus())
            speed = Math.floor(speed * 1.5);
        } else {
            if(pkmn.isParalyzed)
                speed /= 4;
        }
        
        if ( match.teamFields[pkmnTeam].tailwind )
            speed *= 2;
        return speed;
    };


    routines.setDuelOutspeed = function(match, att, attackerDuel, def, defenderDuel) {
        var isFaster = attackerDuel.speed > defenderDuel.speed;
        var isSlower = attackerDuel.speed < defenderDuel.speed;
        var isSpeedTied = attackerDuel.speed === defenderDuel.speed;

        var attStall = att.ability.name === 'Stall';
        var attLF = att.item.name === 'Lagging Tail' || att.item.name === 'Full Incense';
        
        var defStall = def.ability.name === 'Stall';
        var defLF = def.item.name === 'Lagging Tail' || def.item.name === 'Full Incense';


        if (attStall && defStall) {
            // the slower one goes first
            isFaster = isSlower; //switch assignments this way to be logically consistent in event of a speed tie
            isSlower = isFaster;
        } else if (attLF && defLF) {
            // the slower one goes first
            isFaster = isSlower;
            isSlower = isFaster;
        } else if (attStall && defLF) {
            // the Stall Pokemon goes first
            isFaster = true;
            isSlower = false;
            isSpeedTied = false;
        } else if (defStall && attLF) {
            // the Stall Pokemon goes first
            isFaster = false;
            isSlower = true;
            isSpeedTied = false;
        } else if (attStall || attLF) {
            // Pokemon with stall / lagging tail / full insence completely ignore trick room 
            //http://www.smogon.com/dp/articles/move_priority
            isSlower = true;
            isFaster = false;
            isSpeedTied = false;
        } else if (defStall || defLF) {
            // Pokemon with stall / lagging tail / full insence completely ignore trick room 
            //http://www.smogon.com/dp/articles/move_priority
            isSlower = false;
            isFaster = true;
            isSpeedTied = false;
        } else if (match.field.trickroom) {
            isFaster = isSlower;
            isSlower = !isFaster;
        }

        attackerDuel.isFaster = isFaster;
        attackerDuel.isSlower = isSlower;
        attackerDuel.isSpeedTied = isSpeedTied;
        
        defenderDuel.isFaster = !isFaster;
        defenderDuel.isSlower = !isSlower;
        defenderDuel.isSpeedTied = isSpeedTied;
    };
    routines.assignChangedTypes = function(attacker, weather) {
        if (attacker.transformedName === "Castform") {
            
            /*
             * castform can be non-normal iff castform still has forecast,
             * and no air lock / cloud nine is in effect (already accounted for
             * by the weather paramenter)
             */
            if(attacker.ability.name === "Forecast") {
                if (weather === 'sun') {
                    attacker.type1 = "fire";
                } else if (weather === 'rain') {
                    attacker.type1 = "water";
                } else if (weather === "hail") {
                    attacker.type1 = "ice";
                } else {
                    attacker.type1 = "normal";
                }
            } else {
                attacker.type1 = "normal";
            }
        } else if (attacker.transformedName === "Arceus") {
            if(attacker.ability.name === "Multitype") {
                if (attacker.item.name.indexOf(" Plate") !== -1) {
                    attacker.type1 = attacker.item.boostType;
                } else {
                    attacker.type1 = "normal";
                }
            } else {
                attacker.type1 = "normal";
            }
        }
    };
    
    function lsBit(iv) {
        return iv & 1;
    }
    
    function ls2Bit(iv) {
        return (iv >>> 1) & 1;
    }
    
    routines.calcHPType = function(pkmn) {
        var ivs = pkmn['ivs'];
        var typeId = Math.floor(15 * (lsBit(ivs['hp']) + 2 * lsBit(ivs["atk"]) + 4 * lsBit(ivs["def"]) + 
                8 * lsBit(ivs["spe"]) + 16 * lsBit(ivs["spA"]) + 32 * lsBit(ivs["spD"])) / 63);
        var typeName = HP_TYPE_NAMES[typeId];
        return typeName;
    };
    
    routines.calcHPPower = function(pkmn) {
        var ivs = pkmn['ivs'];
        var movePower = Math.floor(40 * (ls2Bit(ivs['hp']) + 2 * ls2Bit(ivs["atk"]) + 4 * ls2Bit(ivs["def"]) + 
                8 * ls2Bit(ivs["spe"]) + 16 * ls2Bit(ivs["spA"]) + 32 * ls2Bit(ivs["spD"])) / 63 + 30);
        return movePower;
    };
    
    routines.countPunishmentBoosts = function(pkmn) {
        var total = 0;
        //punishment considers only first 5 stages- atk through spd
        for(var i = 0; i < 5; i++) {
            var boost = pkmn.stages[gameData.STAGE_NAMES[i]];
            total += boost > 0 ? boost : 0;
        }
        return total;
    };
   
    routines.activate_first_matchup_effects = function(blue, red) {
        routines.activateStatDrops(blue, red);
        routines.activateStatDrops(red, blue);
        routines.activateTrace(blue, red);
        routines.activateTrace(red, blue);
    };

    routines.activateStatDrops = function(source, target) {
        if (source.ability.name === "Intimidate") {
            if (["Clear Body", "White Smoke", "Hyper Cutter"].indexOf(target.ability.name) !== -1)
                ; //no effect
            else
                target.decStage('atk');
        } else if (source.ability.name === "Download") {
            if (target.stats.sdf <= target.stats.def)
                source.incStage('sat');
            else
                source.incStage('atk');
        }
    };
    
    routines.activateTrace = function(attacker, defender) {
        if (attacker.ability.name === 'Trace') {
            switch (defender.ability.name) {
                case "Trace":
                case "Multitype":
                case "Forecast":
                    // can't trace these
                    break;
                default:
                    attacker.ability = defender.ability;
            }
        }
    };
   
    return routines;
});