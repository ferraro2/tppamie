define(['gameData', 'logger', 'settings'], 
    function(gameData, logger, settings) {
    "use strict";
    
    var clickRoutines = {};
    
    /**
     * 
     * @param {Pokemon} pkmn
     * @param {str} indicator
     */
    clickRoutines.damageOrHealPkmn = function(pkmn, indicator) {
        var percDamage = indicator === 'damage' ? 1 : -1;
        var damage = Math.floor(pkmn.stats.hp * .0625 * percDamage);
        pkmn.minDamageTaken += damage;
        pkmn.maxDamageTaken += damage;

        pkmn.verifyAndDeductDamage();
    };

    /*
     * In several of these calculations, including recoil and drain and likely others,
     * small errors arise due to innate complexities in simulating two different rolls 
     * simultaneously over multiple turns.
     * 
     * Do not change anything here without completely understanding these complexities.
     * 
     * Ex: recoil.  Pkmn A attacks B twice with Brave Bird doing 53-63%.  
     *      After first hit recoil %age is calc'd from 53-63% of B's hp.  
     *      Max recoil is calc'd from max possible dmg done to pkmn B (63%)
     *      Now what about second hit? if max recoil is again calc'd from max possible dmg, that is 100 - 53 = 47%
     *      Now max recoil sum is 63% + 47% = 110% which is wrong.  Min similarly
     *      
     *      Now consider scenario-
     *          PKMN B already took 53-63% dmg from Pkmn C
     *          Pkmn A switches in and attacks once with Brave Bird to finish off B
     *          Now on this second hit max recoil must be calc'd from max possible dmg, 100 - 53 = 47% 
     */
    clickRoutines.executeMove = function(match, attackerSixPkmnIndex, defenderSixPkmnIndex, moveIndex) {
        if(settings.disableMoveClicking)
            return;
        var attackerTeam = attackerSixPkmnIndex < 3 ? 0 : 1;
        var defenderTeam = defenderSixPkmnIndex < 3 ? 0 : 1;
        var attackerTeamIndex = attackerSixPkmnIndex - attackerTeam * 3;
        var defenderTeamIndex = defenderSixPkmnIndex - defenderTeam * 3;
        var attacker = match.teams[attackerTeam][attackerTeamIndex];
        var defender = match.teams[defenderTeam][defenderTeamIndex];
        
        var t0PkmnTeamIndex = attackerTeam === 0 ? attackerTeamIndex : defenderTeamIndex;
        var t1PkmnTeamIndex = attackerTeam === 1 ? attackerTeamIndex : defenderTeamIndex;
        var attackerDuel = match.getDuel(t0PkmnTeamIndex, t1PkmnTeamIndex, attackerTeam);
        var defenderDuel = match.getDuel(t0PkmnTeamIndex, t1PkmnTeamIndex, defenderTeam);
        
        var move = attacker.moves[moveIndex];
        // for pokemon with less than 4 moves
        if(!move)
            return;
        
        logger.info(attacker.name + ' used ' + move.name + ' vs ' + defender.name + '.');

        var attack = attackerDuel.getAttack(moveIndex);
        
        var duelWeather = match.getWeather(t0PkmnTeamIndex, t1PkmnTeamIndex);
        
        var defAbility = defender.ability.name;
        if (attacker.ability.name === "Mold Breaker")
            defAbility = "";
        
        //EFFECTS THAT OCCUR REGARDLESS OF THE MOVE SELECTED
        if (attacker.isCharged) {
            //the sdf boost is permanent in PBR
            attacker.isCharged = false;
        }
        if (attacker.ability.name === 'Speed Boost') {
            attacker.incStage('spd');
        }
        
        //MOVES THAT HAVE EFFECTS EVEN IF THE FOE IS IMMUNE
        switch(move.name) {
            case 'Spit Up':
                for (var i = attacker.stockpiles; i > 0; i--) {
                    attacker.decStage('def');
                    attacker.decStage('sdf');
                }
                attacker.stockpiles = 0;
                break;
            //brick break affects reflect even when used on ghost types in gen 4
            case 'Brick Break':
                match.teamFields[defenderTeam].reflect = false;
                match.teamFields[defenderTeam].screen = false;
                break;
        }

        if (attack.effective === 'not')
            return;

       
        //DAMAGING MOVES
        if (move.category === 'physical' || move.category === 'special') {

            var recoil = 0;
            //these are used for drain and recoil 
            var defenderDamageWithMinRolls = attack.min < defender.maxHPLeft ? attack.min : defender.maxHPLeft;
            var defenderDamageWithMaxRolls = attack.max < defender.minHPLeft ? attack.max : defender.minHPLeft;

            defenderDuel.lastDamageType = move.type;
            if (defender.ability.name === 'Color Change') {
                defender.type1 = move.type;
                defender.type2 = '';
            }
            
            // rough skin for contact moves
            if (defender.ability.name === 'Rough Skin' &&
                    (move.category === 'physical' && ! move.abnormalContact ||
                    move.category === 'special' && move.abnormalContact)) {
                attacker.minDamageTaken += Math.floor(attacker.stats.hp / 8);
                attacker.maxDamageTaken += Math.floor(attacker.stats.hp / 8);
            }
            
            //DAMAGING MOVE SECONDARY EFFECTS
            switch (move.name) {
                case 'Trump Card':
                    var ppAfterUse = attacker.trumpPPRemaining;
                    if (defender.ability.name === "Pressure") {
                        ppAfterUse -= 2;
                    } else {
                        ppAfterUse -= 1;
                    }
                    if (ppAfterUse < 0) {
                        ppAfterUse = 0;
                    }
                    attacker.trumpPPRemaining = ppAfterUse;
                    break;
                case 'Bug Bite':
                case 'Pluck':
                if (defender.item.name.indexOf(" Berry") !== -1) {
                    defender.removeItem();
                }
                break;
                case 'Fling':
                    if (attacker.effectiveItem().flingEffectId) {
                        switch(attacker.effectiveItem().flingEffectId) {
                            case 1:
                                if (!defender.hasMajorStatus())
                                    defender.isPoisoned = true;
                                break;
                            case 2:
                                if (!defender.hasMajorStatus())
                                    defender.isBurned = true;
                                break;
                            case 3:
                                break;
                            case 4:
                                break;
                            case 5:
                                if (!defender.hasMajorStatus())
                                    defender.isParalyzed = true;
                                break;
                            case 6:
                                if (!defender.hasMajorStatus())
                                    defender.isPoisoned = true;
                                break;
                            case 7:
                                break;
                        }
                    }
                    
                    attacker.removeItem();
                    break;
                case 'Natural Gift':
                    attacker.removeItem();
                    break;
                case 'Hammer Arm':
                    attacker.decStage('spd');
                    break;
                case 'Smelling Salts':
                    if (defender.isParalyzed) {
                        defender.isParalyzed = false;
                    }
                    break;
                case 'Rollout':
                    if (attacker.rolloutCount < 4)
                        attacker.rolloutCount++;
                    else
                        attacker.rolloutCount = 0;
                    break;
                case 'Ice Ball':
                    if (attacker.iceBallCount < 4)
                        attacker.iceBallCount++;
                    else
                        attacker.iceBallCount = 0;
                    break;
                case 'Fury Cutter':
                    if (attacker.furyCutterCount < 4)
                        attacker.furyCutterCount++;
                    else
                        attacker.furyCutterCount = 0;
                    break;
                case 'Bide':
                    attackerDuel.bideMinDamage = 0;
                    attackerDuel.bideMaxDamage = 0;
                    break;
                case 'Thief':
                case 'Covet':
                    if (attacker.hasItem() || (
                        (attacker.ability.name !== 'Mold Breaker' &&
                        defender.ability.name === 'Sticky Hold') ||
                        defender.item.name === 'Griseous Orb' ||
                        (defender.name.indexOf("Arceus") !== -1 && defender.item.name.indexOf(' Plate') !== -1)))
                        // can't steal
                        ;
                    else {
                        attacker.item = defender.item;
                        defender.removeItem();
                    }
                    break;
                case 'Knock Off':
                    if ((attacker.ability.name !== 'Mold Breaker' &&
                        defender.ability.name === 'Sticky Hold') ||
                        defender.item.name === 'Griseous Orb' ||
                        (defender.name.indexOf("Arceus") !== -1 && defender.item.name.indexOf(' Plate') !== -1))
                        ;
                    else {
                        defender.removeItem();
                    }
                    break;
                case 'Double-Edge':
                case 'Volt Tackle':
                case 'Flare Blitz':
                case 'Brave Bird':
                case 'Wood Hammer':
                    recoil = 1 / 3;
                    break;
                case 'Take Down':
                case 'Submission':
                    recoil = 1 / 4;
                    break;
                case 'Head Smash':
                    recoil = 1 / 2;
                    break;
                case 'Absorb':
                case 'Mega Drain':
                case 'Dream Eater':
                case 'Leech Life':
                case 'Giga Drain':
                case 'Drain Punch':
                    //drain on a foe with 90-110 damage may at minimum leech 0 or 1 hp,
                    //since the foe could be almost dead.  This calculation leeches minimum of 0 in that case
                    var drainWithMinRolls = Math.floor(defenderDamageWithMinRolls / 2);
                    var drainWithMaxRolls = Math.floor(defenderDamageWithMaxRolls / 2);
                    if (attacker.effectiveItem().name === 'Big Root') {
                        drainWithMinRolls = Math.floor(drainWithMinRolls * 1.3);
                        drainWithMaxRolls = Math.floor(drainWithMaxRolls * 1.3);
                    }
                    
                    if (defender.ability.name === 'Liquid Ooze' && move.LIQUID_OOZE_AFFECTED) {
                        attacker.minDamageTaken += drainWithMinRolls;
                        attacker.maxDamageTaken += drainWithMaxRolls;
                    } else {
                        //the larger absorption goes to the minDamageTaken
                        attacker.minDamageTaken -= drainWithMaxRolls;
                        attacker.maxDamageTaken -= drainWithMinRolls;
                    }
                    
                    
                //if the foe is near death, 
                //attacker's minDamageTaken can end up greater than maxDamageTaken
                if(attacker.minDamageTaken > attacker.maxDamageTaken) {
                    var tempDamage = attacker.maxDamageTaken;
                    attacker.maxDamageTaken = attacker.minDamageTaken;
                    attacker.minDamageTaken = tempDamage;
                }
                break;

                case 'Charge Beam':
                    attacker.incStage('sat');
                    break;

                case 'Superpower':
                    attacker.decStage('atk');
                    attacker.decStage('def');
                    break;
                case 'Close Combat':
                    if (attacker.effectiveItem().name === 'White Herb') {
                        attacker.removeItem();
                    } else {
                        attacker.decStage('def');
                        attacker.decStage('sdf');
                    }
                    break;
                case 'Draco Meteor':
                case 'Leaf Storm':
                case 'Overheat':
                case 'Psycho Boost':
                    attacker.decStage('sat');
                    attacker.decStage('sat');
                    break;

                case 'Icy Wind':
                case 'Rock Tomb':
                case 'Mud Shot':
                    if (! attack.noSecondaryEffect)
                        defender.decStage('spd');
                    break;
                case 'Mud-Slap':
                    if (! attack.noSecondaryEffect)
                        defender.decStage('acc');
                    break;
            }

            if (recoil !== 0 && attacker.ability.name !== 'Rock Head') {
                attacker.minDamageTaken += Math.floor(defenderDamageWithMinRolls * recoil);
                attacker.maxDamageTaken += Math.floor(defenderDamageWithMaxRolls * recoil);
                
                //if the foe is near death, 
                //attacker's minDamageTaken can end up greater than maxDamageTaken
                if(attacker.minDamageTaken > attacker.maxDamageTaken) {
                    var tempDamage = attacker.maxDamageTaken;
                    attacker.maxDamageTaken = attacker.minDamageTaken;
                    attacker.minDamageTaken = tempDamage;
                }
            }
            
            
            
            if (defender.effectiveItem().berryResistType === attack.type 
                && (attack.effective === 'super' || attack.type === "normal")) {
                defender.removeItem();
            }
            
            
        } //end damaging moves
        
        // STATUS MOVES
        else if (move.category === 'status') {
            
            if (!defender.hasMajorStatus()) {
                if (move.STATUS_PRZ) {
                    defender.isParalyzed = !defender.isParalyzed;
                    if (defender.ability.name === 'Synchronize') {
                        attacker.isParalyzed = true;
                    }
                } else if (move.STATUS_BRN) {
                    defender.isBurned = !defender.isBurned;
                    if (defender.ability.name === 'Synchronize') {
                        if (attacker.type1 === 'fire' || attacker.type2 === 'fire') {
                            ;
                        } else {
                            attacker.isBurned = true;
                        }
                    }
                } else if (move.STATUS_PSN) {
                    defender.isPoisoned = !defender.isPoisoned;
                    if (defender.ability.name === 'Synchronize') {
                        if (attacker.type1 === 'poison' || attacker.type2 === 'poison') {
                            ;
                        } else {
                            attacker.isPoisoned = true;
                        }
                    }
                } else if (move.STATUS_SLP) {
                    defender.isAsleep = !defender.isAsleep;
                }
            }
            
            if (move.STATUS_CONFUSE) {
                defender.isConfused = ! defender.isConfused;
            }

            switch (move.name) {
                case "Embargo":
                    defender.underEmbargo = !defender.underEmbargo;
                    break;
                case "Leech Seed":
//                    logger.Debug(defender.ability.name !== 'Magic Guard');
                    if (defender.ability.name !== 'Magic Guard') {
//                        logger.Debug("i");
                        var hpDrained = Math.floor(defender.stats.hp / 8);
                        if (attacker.effectiveItem().name === 'Big Root') {
                            hpDrained *= 1.3;
                        }
                        if (defender.ability.name === 'Liquid Ooze') {
                            hpDrained *= -1;
                        }
                        attacker.minDamageTaken -= hpDrained;
                        attacker.maxDamageTaken -= hpDrained;
//                        logger.Debug(hpDrained);
                    }
                    break;
                case 'Tailwind':
                    match.teamFields[attackerTeam].tailwind = !match.teamFields[attackerTeam].tailwind;
                    break;
                case 'Trick':
                case 'Switcheroo':
                    var attItem = attacker.item;
                    attacker.item = defender.item;
                    defender.item = attItem;
                    break;
                case 'Heart Swap':
                    var tempStages = attacker.stages;
                    attacker.stages = defender.stages;
                    defender.stages = tempStages;
                    break;
                case 'Power Swap':
                    var tempAtk = attacker.stages.atk;
                    var tempSat = attacker.stages.sat;
                    attacker.stages.atk = defender.stages.atk;
                    attacker.stages.sat = defender.stages.sat;
                    defender.stages.atk = tempAtk;
                    defender.stages.sat = tempSat;
                    break;
                case 'Guard Swap':
                    var tempDef = attacker.stages.def;
                    var tempSdf = attacker.stages.sdf;
                    attacker.stages.def = defender.stages.def;
                    attacker.stages.sdf = defender.stages.sdf;
                    defender.stages.def = tempDef;
                    defender.stages.sdf = tempSdf;
                    break;
                case 'Worry Seed':
                    defender.ability = gameData.ABILITY_LIST[15];
                    break;
                case 'Psych Up':
                    attacker.stages.atk = defender.stages.atk;
                    attacker.stages.def = defender.stages.def;
                    attacker.stages.sat = defender.stages.sat;
                    attacker.stages.sdf = defender.stages.sdf;
                    attacker.stages.spd = defender.stages.spd;
                    attacker.stages.acc = defender.stages.acc;
                    attacker.stages.eva = defender.stages.eva;
                    break;
                case 'Haze':
                    attacker.zeroStages();
                    defender.zeroStages();
                    break;
                case 'Foresight':
                case 'Odor Sleuth':
                    defender.ghostRevealed = !defender.ghostRevealed;
                    defender.stages.eva = 0;
                    break;
                case 'Miracle Eye':
                    defender.darkRevealed = !defender.darkRevealed;
                    break;
                case 'Gastro Acid':
                    if (defender.ability.name !== 'Multitype') {
                        if(defender.suppressedAbility) {
                            defender.ability = defender.suppressedAbility;
                            defender.suppressedAbility = null;
                        } else {
                            var suppressedAbility = {};
                            suppressedAbility.account = 2;
                            suppressedAbility.name = defender.ability.name + " (suppressed)";
                            suppressedAbility.desc = defender.ability.desc;
                            defender.suppressedAbility = defender.ability;
                            defender.ability = suppressedAbility;
                        }
                    }
                    break;
                case 'Pain Split':
                    var minHPAfterUse = Math.floor( (defender.minHPLeft + attacker.minHPLeft) / 2 );
                    if (minHPAfterUse > attacker.stats.hp)
                        minHPAfterUse = attacker.stats.hp;
                    var maxHPAfterUse = Math.floor( (defender.maxHPLeft + attacker.maxHPLeft) / 2 );
                    if (maxHPAfterUse > attacker.stats.hp)
                        maxHPAfterUse = attacker.stats.hp;
                    
                    attacker.minDamageTaken = attacker.stats.hp - maxHPAfterUse;
                    attacker.maxDamageTaken = attacker.stats.hp - minHPAfterUse;
                    //damage for defender is already in attack.min & attack.max
                    break;
                case 'Trick Room':
                    match.field.trickroom = !match.field.trickroom;
                    break;
                case 'Mimic':
                case 'Copycat':
                case 'Mirror Move':
                    if (attackerDuel.lastMoveHitBy)
                        attacker.moves[moveIndex] = attackerDuel.lastMoveHitBy;
                    break;
                case 'Me First':
                    if (attackerDuel.lastMoveHitBy)
                        attacker.moves[moveIndex] = attackerDuel.lastMoveHitBy;
                        attacker.meFirstMoveIndex = moveIndex;
                    break;
                case 'Memento':
                    //adding damage to user can remove valuable information from the board
                    //so don't do that
                    if (defAbility !== 'Hyper Cutter') {
                        defender.decStage('atk');
                        defender.decStage('atk');
                    }
                    defender.decStage('sat');
                    defender.decStage('sat');
                    break;
                case 'Refresh':
                    defender.isParalyzed = false;
                    defender.isBurned = false;
                    defender.isPoisoned = false;
                    break;
                case 'Gravity':
                    match.field.gravity = !match.field.gravity;
                    break;
                case 'Transform':
                    attacker.stats.atk = defender.stats.atk;
                    attacker.stats.def = defender.stats.def;
                    attacker.stats.sat = defender.stats.sat;
                    attacker.stats.sdf = defender.stats.sdf;
                    attacker.stats.spd = defender.stats.spd;
                    attacker.stats.acc = defender.stats.acc;

                    attacker.moves = defender.moves;
                    attacker.stages = JSON.parse(JSON.stringify(defender.stages));
                    attacker.ability = defender.ability;
                    attacker.type1 = defender.type1;
                    if ('type2' in defender)
                        attacker.type2 = defender.type2;
                    else
                        attacker.type2 = '';
                    attacker.transformedName = defender.name;
                    attacker.isTransformed = true;
                    attacker.justTransformed();
                    break;
                case 'Magnet Rise':
                    attacker.magnetRising = !attacker.magnetRising;
                    break;
                case 'Skill Swap':
                    if (attacker.ability.name !== 'Multitype' && 
                            defender.ability.name !== 'Multitype' &&
                            attacker.ability.name !== 'Wonder Guard' && 
                            defender.ability.name !== 'Wonder Guard' ) {
                        var tempAtkAbility = attacker.ability;
                        attacker.ability = defender.ability;
                        defender.ability =  tempAtkAbility;
                    }
                    break;
                case 'Role Play':
                    if (defender.ability.name !== 'Multitype' &&
                            defender.ability.name !== 'Wonder Guard') {
                        attacker.ability = defender.ability;
                    }
                    break;
                case 'Power Trick':
                    var newdef = attacker.stats.atk;
                    attacker.stats.atk = attacker.stats.def;
                    attacker.stats.def = newdef;
                    break;
                case 'Sunny Day':
                    match.setWeather( t0PkmnTeamIndex, t1PkmnTeamIndex, duelWeather === 'sun' ? 'none' : 'sun' );
                    break;
                case 'Rain Dance':
                    match.setWeather( t0PkmnTeamIndex, t1PkmnTeamIndex, duelWeather === 'rain' ? 'none' : 'rain' );
                    if (duelWeather !== 'rain' && attacker.hasMajorStatus()) {
                        attacker.clearMajorStatus();
                    }
                    break;
                case 'Sandstorm':
                    match.setWeather( t0PkmnTeamIndex, t1PkmnTeamIndex, duelWeather === 'sandstorm' ? 'none' : 'sandstorm' );
                    break;
                case 'Hail':
                    match.setWeather( t0PkmnTeamIndex, t1PkmnTeamIndex, duelWeather === 'hail' ? 'none' : 'hail' );
                    break;

                case 'Reflect':
                    match.teamFields[attackerTeam].reflect = !match.teamFields[attackerTeam].reflect;
                    break;
                case 'Light Screen':
                    match.teamFields[attackerTeam].screen = !match.teamFields[attackerTeam].screen;
                    break;
                
                case 'Stockpile':
                    if (attacker.stockpiles < 3) {
                        attacker.incStage('def');
                        attacker.incStage('sdf');
                        attacker.stockpiles += 1;
                    }
                    break;

                case 'Swallow':
                    var stockpiles = attacker.stockpiles;
                    var restore = 0;
                    if (stockpiles === 1)
                        restore = 1 / 4;
                    else if (stockpiles === 2)
                        restore = 1 / 2;
                    else if (stockpiles === 3)
                        restore = 1;

                    attacker.minDamageTaken -= Math.floor(attacker.stats.hp * restore);
                    attacker.maxDamageTaken -= Math.floor(attacker.stats.hp * restore);

                    for (var i = stockpiles; i > 0; i--) {
                        attacker.decStage('def');
                        attacker.decStage('sdf');
                    }
                    attacker.stockpiles = 0;
                    break;

                
                case 'Roost':
                case 'Recover':
                case 'Soft-Boiled':
                case 'Milk Drink':
                case 'Slack Off':
                case 'Wish':
                case 'Heal Order':
                    attacker.minDamageTaken -= Math.floor(attacker.stats.hp / 2);
                    attacker.maxDamageTaken -= Math.floor(attacker.stats.hp / 2);
                    break;

                case 'Morning Sun':
                case 'Synthesis':
                case 'Moonlight':
                    var restore = 1 / 2;
                    if (duelWeather === 'sun')
                        restore = 2 / 3;
                    else if (duelWeather !== 'none')
                        restore = 1 / 4;
                    attacker.minDamageTaken -= Math.floor(attacker.stats.hp * restore);
                    attacker.maxDamageTaken -= Math.floor(attacker.stats.hp * restore);
                    break;

                case 'Rest':
                    attacker.minDamageTaken = attacker.maxDamageTaken = 0;
                    break;

                case 'Belly Drum':
                    attacker.stages.atk = 6;
                    attacker.minDamageTaken += Math.floor(attacker.stats.hp / 2);
                    attacker.maxDamageTaken += Math.floor(attacker.stats.hp / 2);
                    break;
                    //boost attacker stages
                case 'Howl':
                case 'Sharpen':
                case 'Meditate':
                    attacker.incStage('atk');
                    break;

                case 'Swords Dance':
                    attacker.incStage('atk');
                    attacker.incStage('atk');
                    break;

                case 'Defense Curl':
                    attacker.incStage('def');
                    attacker.curled = true;
                    break;

                case 'Withdraw':
                case 'Harden':
                    attacker.incStage('def');
                    break;

                case 'Iron Defense':
                case 'Acid Armor':
                case 'Barrier':
                    attacker.incStage('def');
                    attacker.incStage('def');
                    break;

                case 'Growth':
                    attacker.incStage('sat');
                    break;

                case 'Nasty Plot':
                case 'Tail Glow':
                    attacker.incStage('sat');
                    attacker.incStage('sat');
                    break;

                case 'Charge':
                    attacker.incStage('sdf');
                    attacker.isCharged = true;
                    break;
                case 'Amnesia':
                    attacker.incStage('sdf');
                    attacker.incStage('sdf');
                    break;

                case 'Rock Polish':
                case 'Agility':
                    attacker.incStage('spd');
                    attacker.incStage('spd');
                    break;

                case 'Minimize':
                case 'Double Team':
                    attacker.incStage('eva');
                    break;
                    //boost attacker stages- multiple 
                case 'Curse':
                    if (attacker.type1 !== 'ghost' && attacker.type2 !== 'ghost') {
                        attacker.incStage('atk');
                        attacker.incStage('def');
                        attacker.decStage('spd');
                    } else {
                        attacker.minDamageTaken += Math.floor(attacker.stats.hp / 2);
                        attacker.maxDamageTaken += Math.floor(attacker.stats.hp / 2);
                    }
                    break;
                case 'Substitute':
                    attacker.minDamageTaken += Math.floor(attacker.stats.hp / 4);
                    attacker.maxDamageTaken += Math.floor(attacker.stats.hp / 4);
                    break;
                case 'Bulk Up':
                    attacker.incStage('atk');
                    attacker.incStage('def');
                    break;
                case 'Dragon Dance':
                    attacker.incStage('atk');
                    attacker.incStage('spd');
                    break;
                case 'Defend Order':
                case 'Cosmic Power':
                    attacker.incStage('def');
                    attacker.incStage('sdf');
                    break;
                case 'Calm Mind':
                    attacker.incStage('sat');
                    attacker.incStage('sdf');
                    break;

                    //STATUS EFFECTS ON DEFENDER
                    //boost defender stages
                case 'Swagger':
                    defender.incStage('atk');
                    defender.incStage('atk');
                    if (defender.ability.name === 'Own Tempo' && !attacker.ability.name === 'Mold Breaker')
                        defender.isConfused = true;
                    break;
                case 'Flatter':
                    defender.incStage('sat');
                    break;
                    //decrease defender stages
                case 'Growl':
                    defender.decStage('atk');
                    break;
                case 'Charm':
                case 'Feather Dance':
                    defender.decStage('atk');
                    defender.decStage('atk');
                    break;
                case 'Leer':
                case 'Tail Whip':
                    defender.decStage('def');
                    break;
                case 'Screech':
                    defender.decStage('def');
                    defender.decStage('def');
                    break;
                case 'Captivate':
                    defender.decStage('sat');
                    defender.decStage('sat');
                    break;
                case 'Fake Tears':
                case 'Metal Sound':
                    defender.decStage('sdf');
                    defender.decStage('sdf');
                    break;
                case 'String Shot':
                    defender.decStage('spd');
                    break;
                case 'Cotton Spore':
                case 'Scary Face':
                    defender.decStage('spd');
                    defender.decStage('spd');
                    break;
                case 'Sand Attack':
                case 'Flash':
                case 'Kinesis':
                case 'Smokescreen':
                    defender.decStage('acc');
                    break;
                case 'Defog':
                case 'Sweet Scent':
                    defender.decStage('eva');
                    break;

                case 'Tickle':
                    if (defAbility !== 'Hyper Cutter') {
                        defender.decStage('atk');
                    }
                    defender.decStage('def');
                    break;
                case 'Memento':
                    defender.decStage('atk');
                    defender.decStage('atk');
                    defender.decStage('sat');
                    defender.decStage('sat');
                    break;
            }


        }//end status moves
        
        
        if (attackerDuel.bideMinDamage > 0 && move.name !== 'Bide') {
            attackerDuel.bideMinDamage = 0;
            attackerDuel.bideMaxDamage = 0;
        }

        if (move.category !== 'status') {
            defenderDuel.bideMinDamage += attack.min * 2;
            defenderDuel.bideMaxDamage += attack.max * 2;
        }

        /*
         * The turn by turn duel information here should be recorded
         * (on both sides, probably) if one party has:
         * - mirror coat, counter, metal burst
         * - payback, avalance, revenge
         * 
         * This is a bit expensive, so we use recordDuelTurnByTurnInfo to flag the requirement
         * 
         */
        if(attacker.recordDuelTurnByTurnInfo || defender.recordDuelTurnByTurnInfo) {
            defenderDuel.lastAttackHitBy = JSON.parse(JSON.stringify(attack));

            //for payback

            if (defenderDuel.usedMoveThisTurn) {
                attackerDuel.usedMoveThisTurn = false;
                defenderDuel.usedMoveThisTurn = false;
            } else {
                attackerDuel.usedMoveThisTurn = true;
            }

            if (attackerDuel.usedMoveThisTurn) {
                attacker.isRoosting = move.name === 'Roost';
                //for revenge / avalanche
                defenderDuel.tookDamageThisTurn = attack.min > 0;
            } else {
                //for revenge / avalanche
                defenderDuel.tookDamageThisTurn = false;
            }

            attackerDuel.tookDamageThisTurn = false;
            defender.isRoosting = false;
        }
        
        // for metronome boosts
        if( attacker.lastUsedMove && attacker.lastUsedMove.name === move.name ) {
            attacker.consecutiveMoveCount += 1;
        } else {
            attacker.lastUsedMove = move;
            attacker.consecutiveMoveCount = 1;
        }
        //for revenge, avalanche, mimic, copycat, me first, and lots of other moves
        defenderDuel.lastMoveHitBy = move;

        //add in attack damage- both from damaging moves and damaging status moves (eg steath rock)
        
        defender.minDamageTaken += attack.min;
        defender.maxDamageTaken += attack.max;
        

        if(attack.effective === 'super' && defender.effectiveItem().name === 'Enigma Berry') {
            defender.removeItem();
        }
        
        
        // prevent hp left and damage taken from going below zero
        attacker.verifyAndDeductDamage();
        defender.verifyAndDeductDamage();
    };
    
    return clickRoutines;
});