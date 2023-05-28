define(['gameData', 'logger', 'calcRoutines'],
    function(gameData, logger, calc) {
    "use strict";
    
    //duelWeather is the effective weather present, ie. the one calculation will use
    function calcDuel(match, t0Pkmn, t1Pkmn, t0PkmnDuel, t1PkmnDuel, duelWeather, fInverse) {
        duelWeather = calc.getEffectiveWeather( t0Pkmn, 
            calc.getEffectiveWeather(t1Pkmn, duelWeather) );
        calc.assignChangedTypes(t0Pkmn, duelWeather);
        calc.assignChangedTypes(t1Pkmn, duelWeather);
        //calc duel speeds given weather, etc
        t0PkmnDuel.speed = Math.floor(calc.getDuelSpeed(t0Pkmn, 0, duelWeather, match));
        t1PkmnDuel.speed = Math.floor(calc.getDuelSpeed(t1Pkmn, 1, duelWeather, match));
        //set duel outspeeds given match attributes and duel speeds
        calc.setDuelOutspeed(match, t0Pkmn, t0PkmnDuel, t1Pkmn, t1PkmnDuel);
        
        t0Pkmn.moves.forEach(function(move, i) {
            calcMove(move, i, match, t0PkmnDuel.attacks[i], t0Pkmn, t0PkmnDuel, t1Pkmn, t1PkmnDuel, 0, 1, duelWeather, t0Pkmn.pp[i], fInverse);
        });
        t1Pkmn.moves.forEach(function(move, i) {
            calcMove(move, i, match, t1PkmnDuel.attacks[i], t1Pkmn, t1PkmnDuel, t0Pkmn, t0PkmnDuel, 1, 0, duelWeather, t1Pkmn.pp[i], fInverse);
        });
    }
    ///////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////
    //////////////////	   BEGIN ATTACK      //////////////////////
    ///////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////
    function calcMove(move, moveIndex, match, attack, 
            attacker, attackerDuel, defender, defenderDuel, attackerTeam, defenderTeam, duelWeather, pp, fInverse) {
//        logger.debug(attacker);     
//        logger.debug("Attack for " + attacker.name + " on " + defender.name + ", move " + move.name);
//        //attack.min = 30;
//        logger.debug('CALC BEGIN');
//        logger.debug(move.power);
        
        var movePower = move.power;
        var movePowerMin = -1;
        var movePowerMax = -1;
        
        var isFaster = attackerDuel.isFaster;
        var isSlower = attackerDuel.isSlower;
        var isSpeedTied = attackerDuel.isSpeedTied;
        
        // safe to use here, since this code won't change the pokemon's items
        var attItem = attacker.effectiveItem();
        var defItem = defender.effectiveItem();
        
        /*
         * may not be initialized at start of battle?
         * 
         * used for mirror coat, reflect, metal burst
         * payback, avalanche, and revenge
         */
        var lastAttackHitBy = attackerDuel.lastAttackHitBy;
        var lastMoveHitBy = attackerDuel.lastMoveHitBy;
        var tookDamageThisTurn = attackerDuel.tookDamageThisTurn;
        var usedMoveThisTurn = attackerDuel.usedMoveThisTurn;
        switch(move.name) {
            case 'Mirror Coat':
            case 'Counter':
            case 'Metal Burst':
            case 'Payback':
            case 'Avalanche':
            case 'Revenge':
            case 'Roost':
                attacker.recordDuelTurnByTurnInfo = true;
                break;
        }
     
        attack.type = move.type;
        
        var isSpecial = move.category === "special";
        var isPhysical = move.category === "physical";
        var doesContact = (move.category === 'physical' && ! move.abnormalContact ||
                    move.category === 'special' && move.abnormalContact);

        //mold breaker only affects the mold breaker's attacks, despite the defender's ability
        var defAbility = defender.ability.name;
        if (attacker.ability.name === "Mold Breaker")
            defAbility = "";

        var defenderIsHovering = defItem.name !== "Iron Ball" && !match.field.gravity
            && (defender.ability.name === "Levitate" || defender.magnetRising
             || (!defender.isRoosting
             && (defender.type1 === 'flying' || defender.type2 === 'flying')));

        var defIsHovering = defItem.name !== "Iron Ball" && !match.field.gravity
            && (defAbility === "Levitate" || defender.magnetRising
             || (!defender.isRoosting
             && (defender.type1 === 'flying' || defender.type2 === 'flying')));

        var attackerIsHovering = attItem.name !== "Iron Ball" && !match.field.gravity
            && (attacker.ability.name === "Levitate" || attacker.magnetRising
             || (!attacker.isRoosting
             && (attacker.type1 === 'flying' || attacker.type2 === 'flying')));

        ////////////////////////////////
        /////////   ACCURACY   /////////
        ////////////////////////////////
        //no guard bypasses all other accuracy calculations
        //no guard unaffected by mold breaker
        if (attacker.ability.name === 'No Guard' || defender.ability.name === 'No Guard')
            attack.accuracy = 0;
        else if (move.OHKO) {
            attack.accuracy = 30;
        } else if (move.ALWAYS_HIT) {
            attack.accuracy = 0;
        } else {
            var accBoost = attacker.stages.acc;
            var evaBoost = defender.stages.eva;

            //mold breaker only affects the mold breaker's attacks
            if (attacker.ability.name === 'Unaware')
                evaBoost = 0;
            else if (defAbility === 'Simple') //else if since unaware attacker ignores simple defender
                evaBoost *= 2;

            if (defAbility === 'Unaware')
                accBoost = 0;
            else if (attacker.ability.name === 'Simple')  //else if since unaware defender ignores simple attacker
                accBoost *= 2;

            if(match.field.gravity)
                evaBoost -= 2;

            attack.accuracy = Math.floor(move.accuracy * calc.getAccEvaFactor(accBoost - evaBoost));
            if (isPhysical && attacker.ability.name === 'Hustle')
                attack.accuracy = Math.floor(attack.accuracy * .8);
            else if (attacker.ability.name === 'Compound Eyes')
                attack.accuracy = Math.floor(attack.accuracy * 1.3);
            //zoom lens not considered
            if (attItem.name === 'Wide Lens')
                attack.accuracy = Math.floor(attack.accuracy * 1.1);

            if(defAbility === 'Tangled Feet' && defender.isConfused) {
                attack.accuracy = Math.floor(attack.accuracy / 1.2);
            }

            // raises eva 10%
            if(defItem.name === 'Bright Powder')
                attack.accuracy = Math.floor(attack.accuracy / 1.1);
            
            if(defItem.name === 'Lax Incense')
                attack.accuracy = Math.floor(attack.accuracy * .9);

            //keen eye does not prevent effective decrease in accuracy from abilities or weather

            // evasion is increased by 20% in gen 4
            if (defAbility === 'Sand Veil' && duelWeather === 'sandstorm' ||
                    defAbility === 'Snow Cloak' && duelWeather === 'hail')
                attack.accuracy = Math.floor(attack.accuracy * 1 / 1.20);

            //"deep fog" seems like 60%, and anectodal online comments suggested that as well,
            //but I could find no authoritative source
            if (duelWeather === 'fog') {
                attack.accuracy = Math.floor(attack.accuracy * .6);
            } else if (duelWeather === 'hail' && move.name === 'Blizzard') {
                attack.accuracy = 100;
            } else if (duelWeather === 'sun' && move.name === 'Thunder') {
                attack.accuracy = 50;
            } else if (duelWeather === 'rain' && move.name === 'Thunder') {
                attack.accuracy = 100;
            }

            attack.accuracy = Math.min(100, attack.accuracy);
        }

        ////////////////////////////////
        //MOVES THAT CAN CHANGE TYPE  //
        ////////////////////////////////
        //calc their power here as well
        if (move.name === "Weather Ball") {
            if (duelWeather === "sun") {
                attack.type = "fire";
                movePower *= 2;
            } else if (duelWeather === "rain") {
                attack.type = "water";
                movePower *= 2;
            } else if (duelWeather === "hail") {
                attack.type = "ice";
                movePower *= 2;
            } else if (duelWeather === "sandstorm") {
                attack.type = "rock";
                movePower *= 2;
            } else if (duelWeather === "fog") {
                attack.type = "normal";
                movePower *= 2;
            } else {
                attack.type = "normal";
            }
        } else if (move.name === "Judgment") {
            logger.debug(attItem);
            if (attItem.name.indexOf(" Plate") !== -1)
                attack.type = attItem.boostType;
            else
                attack.type = 'normal';
        } else if (move.name === "Natural Gift") {
            if (attItem.naturalGiftType) {
                attack.type = attItem.naturalGiftType;
                movePower = attItem.naturalGiftPower;
                attack.power = movePower;
            } else {
                attack.effective = 'not';
                attack.power = 0;
                return;
            }
        } else if (move.name === 'Hidden Power') {
            attack.type = calc.calcHPType(attacker);
            movePower = calc.calcHPPower(attacker);
            attack.power = movePower;
            
        } else if (attacker.ability.name === "Normalize") {
            //else if because the above moves are not affected by normalize
            attack.type = "normal";
        }

        

        // CALCULATE SUPER / NORMAL / WEAK / NOT EFFECTIVE
        var effectiveMult;
        var typeEffectiveMult1 = 1;
        var typeEffectiveMult2 = 1;
                
        var typeEffectiveMult1 = calc.getSingleEffectiveness(attack.type, defender.type1, attacker, defender, defIsHovering, fInverse);
        if (defender.type2) {
            typeEffectiveMult2 = calc.getSingleEffectiveness(attack.type, defender.type2, attacker, defender, defIsHovering, fInverse);
        }
        effectiveMult = typeEffectiveMult1 * typeEffectiveMult2;

        if(match.field.gravity && move.AIRBORNE) {
            effectiveMult = 0;
        }

        ////////////////////////////////
        //  NEGATIVELY MARKED MOVES  ///
        ////////////////////////////////
        //not affected by mold breaker
        // contact moves vs. static, flame body, etc. are done at the very end of this function
        // payback, me first, avalacne, etc. are checked in the status and damage sections
        switch (defender.ability.name) {
            case 'Heatproof':
                if (move.name === 'Will-O-Wisp') {
                    attack.mark = 'negative';
                }
                break;
            case 'Pressure':
                if(pp < 8) {
                    // too many insignificant marks, I think
//                    attack.mark = 'negative';
                }
                break;
            case 'Magic Guard':
                if (move.STATUS_PSN || move.STATUS_BRN || move.name === "Leech Seed" || move.name === 'Nightmare') {
                    attack.mark = 'negative';
                }
                break;
            case 'Poison Heal':
                if (move.STATUS_PSN) {
                    attack.mark = 'negative';
                }
                break;
            case 'Liquid Ooze':
                if (move.LIQUID_OOZE_AFFECTED)
                    attack.mark = 'negative';
                break;
            case 'Quick Feet':
            case 'Guts':
                if (move.STATUS_MAJOR) {
                    if(!move.STATUS_SLP || 
                            (defender.hasMove('Sleep Talk') ||
                            defender.hasMove('Snore'))) {
                        attack.mark = 'negative';
                    }
                }
                break;
            case 'Tangled Feet':
                if (move.DAMAGING_CONFUSE || move.STATUS_CONFUSE)
                    attack.mark = 'negative';
                break;
            case 'Flower Gift':
            case 'Chlorophyll':
            case 'Leaf Guard':
            case 'Solar Power':
                if (move.name === 'Sunny Day')
                    attack.mark = 'negative';
                break;
            case 'Hydration':
            case 'Swift Swim':
            case 'Rain Dish':
                if (move.name === 'Rain Dance')
                    attack.mark = 'negative';
                break;
            case 'Steadfast':
                if (move.DAMAGING_POSSIBLE_FLINCH &&
                        isFaster)
                    attack.mark = 'negative';
                break;
            case 'Early Bird':
                if (move.STATUS_SLP)
                    attack.mark = 'negative';
                break;
            case 'Shed Skin':
                if (move.STATUS_MAJOR)
                    attack.mark = 'negative';
                break;
            case 'No Guard':
                // this should be something like move.SEMI_INVULNERABLE bc things like skull bash sky attack etc shouldn't trigger this
                if(move.TWO_TURN) {
                    attack.mark = 'negative';
                }
                break;
            case 'Synchronize':
                if (move.STATUS_MAJOR) {
                    if(move.STATUS_BRN && (attacker.type1 === 'fire' || attacker.type2 === 'fire')) {
                        ;
                    } else if(move.STATUS_PSN && (
                            attacker.type1 === 'poison' || attacker.type2 === 'poison'
                            || attacker.type1 === 'steel' || attacker.type2 === 'steel')) {
                        ;
                    } else if (move.STATUS_SLP) {
                        ;
                    } else {
                        attack.mark = 'negative';
                    }
                }
                break;
            case 'Multitype':
                if (move.name === 'Gastro Acid')
                    attack.mark = 'negative';
                break;
        }

        //affected by mold breaker
        switch (defAbility) {
            case 'Marvel Scale':
                if (move.STATUS_MAJOR)
                    attack.mark = 'negative';
                break;
            case 'Inner Focus':
                if (move.DAMAGING_POSSIBLE_FLINCH &&
                        (isFaster || move.priority > 0))
                    attack.mark = 'negative';
                break;
            case 'Sand Veil':
                if (move.name === 'Sandstorm')
                    attack.mark = 'negative';
                break;
            case 'Snow Cloak':
                if (move.name === 'Hail')
                    attack.mark = 'negative';
                break;
            case 'Own Tempo':
                if (move.DAMAGING_CONFUSE)
                    attack.mark = 'negative';
                break;
            case 'Shield Dust':
                if (move.DAMAGING_LIKELY_SECONDARY_EFFECT)
                    attack.mark = 'negative';
                break;
            case 'Unaware':
                if (move.STATUS_BOOST_MAIN_5)
                    attack.mark = 'negative';
                break;
        }

        switch (move.name) {
            case 'Attract':
                if (defItem.name === 'Mental Herb') {
                    attack.mark = 'negative';
                }
                break;
            case 'Pluck':
            case 'Bug Bite':
                if (defender.item.name.indexOf(' Berry' ) !== -1) {
                    attack.mark = 'positive';
                }
                break;
            case 'Mud Sport':
                if (defender.hasDamagingMoveType('electric')) {
                    attack.mark = 'positive';
                }
                break;
            case 'Water Sport':
                if (defender.hasDamagingMoveType('fire')) {
                    attack.mark = 'positive';
                }
                break;
            case 'Sunny Day':
                if (defender.ability.name === 'Dry Skin')
                    attack.mark = 'positive';
                else if (attacker.ability.name === 'Dry Skin')
                    attack.mark = 'negative';
                break;
            case 'Rain Dance':
                if (defender.ability.name === 'Dry Skin')
                    attack.mark = 'negative';
                else if (attacker.ability.name === 'Dry Skin')
                    attack.mark = 'positive';
                break;
            case 'Sandstorm':
                if (defender.type1 === 'ground' || defender.type2 === 'ground' ||
                        defender.type1 === 'steel' || defender.type2 === 'steel')
                    attack.mark = 'negative';
                break;
            case 'Hail':
                if (defender.type1 === 'ice' || defender.type2 === 'ice')
                    attack.mark = 'negative';
                break;
            case 'Roost':
                if((attacker.type1 === 'flying' || attacker.type2 === 'flying') &&
                        defender.hasDamagingMoveType('ground')) {
                    attack.mark = 'negative';
                }
                break;
            case 'Self-Destruct':
            case 'Explosion':
            case 'Memento':
            case 'Lunar Dance':
            case 'Healing Wish':
                break;
            case 'Perish Song':
                //BROKEN CODE NOW
//                if (attacker.teamIndex === gameData.TEAM_SIZE - 1) {
//                    attack.mark = 'negative';                  
//                }
                break;
            case 'Psycho Shift':
                if (attacker.hasMajorStatus()) {
                    if(attacker.isBurned && (defender.type1 === 'fire' || defender.type2 === 'fire')) {
                        ;
                    } else if(attacker.isPoisoned && (defender.type1 === 'poison' || defender.type2 === 'poison')) {
                        ;
                    } else {
                        attack.mark = 'positive';
                    }
                }
                break;
            case 'Gravity':
                if (defender.hasAirborneMove() ||
                        ( defenderIsHovering && attacker.hasDamagingMoveType('ground')) )
                    attack.mark = 'positive';
                
                break;
            case 'Rollout':
                if(attacker.rolloutCount < 4)
                    attack.mark = 'positive';
                break;
            case 'Fury Cutter':
                if(attacker.furyCutterCount < 4)
                    attack.mark = 'positive';
                break;
            case 'Ice Ball':
                if(attacker.iceBallCount < 4)
                    attack.mark = 'positive';
                break;
            case 'Reversal':
            case 'Flail':
                attack.mark = 'positive';
                break;
            
            case 'Assurance':
                if(isSlower || defender.hasMoveWithGreaterPriority(0)) {
                   attack.mark = 'positive';
                }
                break;
            case 'Confuse Ray':
                if( (isSlower || defender.hasMoveWithGreaterPriority(0)) && attacker.hasMove('Assurance') ) {
                   attack.mark = 'positive';
                }
                break;
        }
        
        //second pass
        switch(move.name) {
            case 'Rain Dance':
            case 'Hail':
            case 'Sandstorm':   
            if(defender.hasMove('Solar Beam')) {
                attack.mark = 'positive';
            }
            break;
        }
        
        if (move.STATUS_BOOST_MAIN_5 || (
                move.name === 'Curse' &&
                (attacker.type1 !== 'ghost' && attacker.type2 !== 'ghost'))) {
            if (defender.hasMove('Punishment')) {
                attack.mark = 'negative';
            }
        }
        
        // this is not in the ability switch statement so it can override
        // attack marks set by the move.name switch statement
        if (move.WEATHER_CREATING && defender.ability.name ==='Dry Skin') {
            if (duelWeather === 'rain' && move.name !== 'Rain Dance')
                attack.mark = 'positive';
            else if (duelWeather === 'sun' && move.name !== 'Sunny Day')
                attack.mark = 'negative';
        }
        
        if(doesContact) {
            switch(defender.ability.name) {
                case 'Static':
                case 'Effect Spore':
                    if (attacker.ability.name === 'Guts' || 
                            (attacker.ability.name === 'Synchronize')) {
                        attack.mark = 'positive';
                    } else {
                        attack.mark = 'negative';
                    }
                    break;
                case 'Flame Body':
                    if (attacker.type1 !== 'fire' && attacker.type2 !== 'fire') {
                        if (attacker.ability.name === 'Guts') {
                            attack.mark = 'positive';
                        } else {
                            attack.mark = 'negative';
                        }
                    }
                    break;
                case 'Poison Point':
                    if (attacker.type1 !== 'poison' && attacker.type2 !== 'poison') {
                        if (attacker.ability.name === 'Guts') {
                            attack.mark = 'positive';
                        } else {
                            attack.mark = 'negative';
                        }
                    }
                    break;
                case 'Aftermath':
                    attack.mark = 'negative';
                    break;
                case 'Cute Charm':
                    if ((attacker.gender === 'f' && defender.gender === 'm' ||
                            attacker.gender === 'm' && defender.gender === 'f'))
                        attack.mark = 'negative';
                    break;
                case 'Rough Skin':
                    attack.mark = 'negative';
                    break;
            }
        }
        
        if(move.RECOIL && isFaster) {
            if(defender.hasMove('Assurance'))
                attack.mark = 'negative';
        }
        
        if (move.STATUS_MAJOR) {
            if (defender.hasMove('Psycho Shift') || defender.ability.name === 'Hydration') {
                attack.mark = 'negative';
            }
        }
        
        if (attacker.hasMajorStatus()) {
            if (attacker.ability.name === 'Hydration' && move.name === 'Rain Dance') {
                attack.mark = 'positive';
            }
        }
        
        switch(defender.effectiveItem().name) {
            case 'Cheri Berry':
                if (move.STATUS_PRZ) {
                    attack.mark = 'negative';
                }
                break;
            case 'Chesto Berry':
                if (move.STATUS_SLP) {
                    attack.mark = 'negative';
                }
                break;
            case 'Pecha Berry':
                if (move.STATUS_PSN) {
                    attack.mark = 'negative';
                }
                break;
            case 'Rawst Berry':
                if (move.STATUS_BRN) {
                    attack.mark = 'negative';
                }
                break;
            case 'Leppa Berry':
                if (move.name === 'Grudge') {
                    attack.mark = 'negative';
                }
                break;
            case 'Persim Berry':
                if (move.STATUS_CONFUSE) {
                    attack.mark = 'negative';
                }
                break;
            case 'Lum Berry':
                if (move.STATUS_MAJOR) {
                    attack.mark = 'negative';
                }
                break;
        }
        
        ////////////////////////////////
        ///////  STATUS MOVES  /////////
        ////////////////////////////////

        //Regarding attacking (non-status!) moves:
        //there are no 100% psn attacking moves
        //there are attacking sound, prz, and confusion moves
        //zap cannon and dynamic punches are 'sort of' special cases

        //for most moves, 'effectiveMult' is ignored here.
        //the following moves are exceptions: Thunder Wave, Stealth rock
        //attack.effective is what gets returned.
        if (move.category === "status") {

            attack.effective = 'normal';
            attack.max = attack.min = 0;
            
            
            //for status moves,
            //attack.effective only changed to 'not' after this point

            //affected by mold breaker
            switch(defAbility) {
                case 'Limber':
                    if (move.STATUS_PRZ) 
                        attack.effective = 'not';
                    break;
                case 'Insomnia':
                case 'Vital Spirit':
                    if (move.STATUS_SLP)
                        attack.effective = 'not';
                    break;
                case 'Immunity': 
                    if(move.STATUS_PSN)
                        attack.effective = 'not';
                    break;
                case 'Soundproof':
                    if(move.STATUS_SOUND)
                        attack.effective = 'not';
                break;
                case 'Own Tempo':
                    if(move.name === 'Swagger')
                        attack.mark = 'negative';
                    if(move.STATUS_CONFUSE_ONLY)
                        attack.effective = 'not';
                    break;
                case 'Clear Body':
                case 'White Smoke':
                    if(move.STATUS_LOWER_STAGE)
                        attack.effective = 'not';
                break;
                case 'Keen Eye':
                    if(move.STATUS_LOWER_ACC)
                        attack.effective = 'not';
                    break;
                case 'Hyper Cutter':
                    if(move.name === 'Tickle' || move.name === 'Memento')
                        attack.mark = 'negative';
                    else if(move.STATUS_LOWER_ATK)
                        attack.effective = 'not';
                    break;
                case 'Suction Cups':
                    if(move.name === 'Roar' || move.name === 'Whirlwind')
                        attack.effective = 'not';
                    break;
                case 'Leaf Guard':
                    if(duelWeather === 'sun' && move.STATUS_MAJOR)
                        attack.effective = 'not';
                    break;
                case 'Water Veil':
                    if(move.STATUS_BRN) 
                        attack.effective = 'not';
                break;
            }       
            //mold breaker only affects the mold breaker's attacks
            if (defender.ability.name === 'No Guard' &&
                    (move.STATUS_LOWER_ACC || move.name === 'Sweet Scent')) {
                attack.effective = 'not';
            }

            //leaf guard does not affect rest gen 4
            if ((attacker.ability.name === 'Insomnia' || attacker.ability.name === 'Vital Spirit')
                    && move.name === 'Rest') {
                attack.effective = 'not';
            }

            if ((defender.type1 === 'poison' || defender.type1 === 'steel' ||
                    defender.type2 === 'poison' || defender.type2 === 'steel') &&
                    move.STATUS_PSN) {
                attack.effective = 'not';
            }

            if (move.WEATHER_CREATING) {
                if (defAbility === 'Cloud Nine' || defAbility === 'Air Lock')
                    attack.mark = 'negative';
            }
            
            switch (move.name) {
                case "Trick":
                case "Switcheroo":
                case "Covet":
                case "Thief":
                case "Knock Off":
//                     too many edge cases for a 'not' effectiveness
                    if (defAbility === "Sticky Hold") {
                        attack.mark = 'negative';
                    }
                    break;
                case "Imprison":
                    attacker.moves.forEach(function(attMove) {
                        defender.moves.forEach(function(defMove) {
                            if (attMove.name === defMove.name) {
                                attack.mark = 'positive';
                            }
                        });
                    });
                    break;
                case "Thunder Wave":
                    if (effectiveMult === 0 ||
                            (defAbility === 'Volt Absorb' || defAbility === 'Motor Drive') &&
                            attack.type === 'electric')
                        attack.effective = 'not';
                    break;
                case "Leech Seed":
                    if (defender.type1 === 'grass' || defender.type2 === 'grass') {
                        attack.effective = "not";
                    } else if (defender.ability.name !== 'Magic Guard' && defender.ability.name !== 'Liquid Ooze') {
                        attack.min = attack.max = Math.floor(defender.stats.hp / 8);
                        if (attack.min === 0)   //for shedinja
                            attack.min = attack.max = 1;
                        attack.showDamage = true;
                    }
                    break;
                case "Toxic Spikes":
                case "Spikes":
                    if (defIsHovering)
                        attack.effective = "not";
                    break;
                case 'Attract':
                case 'Captivate':
                    if (! (attacker.gender === 'f' && defender.gender === 'm' ||
                            attacker.gender === 'm' && defender.gender === 'f'))
                        attack.effective = 'not';
                    break;
                case 'Will-O-Wisp':
                    if (defender.type1 === 'fire' || defender.type2 === 'fire') {
                        attack.effective = "not";
                    }
                    break;
                case 'Me First':
                    if(isSpeedTied) {
                        attack.mark = 'negative';
                    } else if(isSlower) {
                        if (defender.hasMoveWithLessPriority(0))
                            attack.mark = 'negative';
                        else
                            attack.effective = 'not';
                    }
                    break;
                case 'Pain Split':
                    var minHPAfterUse = Math.floor( (defender.minHPLeft + attacker.minHPLeft) / 2 );
                    if (minHPAfterUse > defender.stats.hp)
                        minHPAfterUse = defender.stats.hp;
                    var maxHPAfterUse = Math.floor( (defender.maxHPLeft + attacker.maxHPLeft) / 2 );
                    if (maxHPAfterUse > defender.stats.hp)
                        maxHPAfterUse = defender.stats.hp;
                    attack.max = defender.minHPLeft - minHPAfterUse;
                    attack.min = defender.maxHPLeft - maxHPAfterUse;
                    attack.showDamage = true;
                    return;
                    break;
                case 'Transform':
                    if (defender.isTransformed) {
                        attack.effective = 'not';
                    }
                    break;
                case 'Stealth Rock':
                    attack.min = attack.max = Math.floor(effectiveMult * defender.stats.hp / 8);
                    if (attack.min === 0)   //for shedinja
                        attack.min = attack.max = 1;
                    attack.showDamage = true;
                    break;
            }

            return;
        }

        
        ////////////////////////////////
        ////   NON-STATUS MOVES   //////
        ////////////////////////////////
        if (move.category === 'status')
            alert("ERROR: status should not have reached this point");

        //Most status moves ignore and overwrite 'effectiveMult'
        //Some status moves do consider some of the below cases.
        //Those cases are re-tested for status moves in the above section.
        
        switch(defAbility) {
            case 'Wonder Guard':
                if (effectiveMult <= 1 && move.name !== 'Fire Fang')
                    effectiveMult = 0;
                break;
            case 'Flash Fire':
                if (attack.type === 'fire')
                    effectiveMult = 0;
                break;
            case 'Dry Skin':
            case 'Water Absorb':
                if(attack.type === 'water')
                    effectiveMult = 0;
                break;
            case 'Motor Drive':
            case 'Volt Absorb':
                if(attack.type === 'electric')
                    effectiveMult = 0;    
                break;
            case 'Soundproof':
                if(move.ATTACKING_SOUND)
                    effectiveMult = 0;
                break;
        }

        //"Non-physical and non-special" and "fixed-damage" moves calculated here and return immediately
        //Wonder guard does affect OHKO moves and Seismic Toss / Night Shade 
        if (move.OHKO) {
            attack.effective = effectiveMult !== 0 ? "normal" : "not";
            if (defAbility === 'Sturdy')
                attack.effective = 'not';
            attack.min = attack.max = defender.stats.hp;
            return;
        }
        
        
        // reduce Counter, Mirror Coat and Metal burst damage for multi-hit moves
        // only the last hit is reflected in these cases
        var lastReflectedMin = 0;
        var lastReflectedMax = 0;
        if (lastAttackHitBy) {
            if (lastMoveHitBy.FIVE_HITS) {
                lastReflectedMin = Math.floor(lastAttackHitBy.min / 5);
                lastReflectedMax = Math.floor(lastAttackHitBy.max / 5);
            }
            else if (lastMoveHitBy.TWO_HITS) {
                lastReflectedMin = Math.floor(lastAttackHitBy.min / 2);
                lastReflectedMax = Math.floor(lastAttackHitBy.max / 2);
            }
            else if (lastMoveHitBy.name === 'Triple Kick') {
                lastReflectedMin = Math.floor(lastAttackHitBy.min);
                lastReflectedMax = Math.floor(lastAttackHitBy.max / 2);
            } else {
                lastReflectedMin = lastAttackHitBy.min;
                lastReflectedMax = lastAttackHitBy.max;
            }
        }
        
        switch (move.name) {
            case 'Bide':
                attack.min = attackerDuel.bideMinDamage;
                attack.max = attackerDuel.bideMaxDamage;
                //hits ghost types, but not wonder guard
                if (defAbility === 'Wonder Guard')
                    attack.effective = effectiveMult !== 0 ? "normal" : "not";
                else
                    attack.effective = 'normal';
                
                if(attack.max === 0)
                    attack.mark = 'positive';
                return;
                break;
            case "Mirror Coat":
                if (effectiveMult === 0 || !defender.hasPossibleSpecialMove()) { 
                    attack.effective = 'not'; 
                } else if (lastMoveHitBy && lastMoveHitBy.category === 'special') {
                    attack.effective = 'normal';
                    attack.min = 2 * lastReflectedMin;
                    attack.max = 2 * lastReflectedMax;
                } else {
                    attack.mark = 'positive';
                }
                return;
                break;
            case "Counter":
                if (effectiveMult === 0 || !defender.hasPossiblePhysicalMove()) { 
                    attack.effective = 'not'; 
                } else if (lastMoveHitBy && lastMoveHitBy.category === 'physical') {
                    attack.effective = 'normal';
                    attack.min = 2 * lastReflectedMin;
                    attack.max = 2 * lastReflectedMax;
                } else {
                    attack.mark = 'positive';
                }
                return;
                break;
            case 'Metal Burst':
                if (effectiveMult === 0) { attack.effective = 'not'; return; }
                attack.effective = 'normal';
                
                //double the damage if we were just damaged by a faster move
                if( lastMoveHitBy &&
                        (isSlower && lastMoveHitBy.priority >= 0 || 
                        isFaster && lastMoveHitBy.priority > 0) ) {
                    attack.min = Math.floor(lastReflectedMin * 1.5);
                    attack.max = Math.floor(lastReflectedMax * 1.5);
                } else if (isFaster) {
                    //probably won't work, warn the user
                    attack.mark = 'negative';
                } else if (isSlower) {
                    //probaby works
                    attack.mark = 'positive';
                } else {
                    //speed tie... it could work, but not necessarily
                    //warn the user
                    attack.mark = 'negative';
                }
                return;
                break;
            case "Seismic Toss":
            case "Night Shade":
                attack.effective = effectiveMult !== 0 ? "normal" : "not";
                attack.min = 100;
                attack.max = 100;
                return;
                break;
            case "Sonic Boom":
                attack.effective = effectiveMult !== 0 ? "normal" : "not";
                attack.min = 20;
                attack.max = 20;
                return;
                break;
            case "Dragon Rage":
                attack.effective = effectiveMult !== 0 ? "normal" : "not";
                attack.min = 40;
                attack.max = 40;
                return;
                break;
            case "Super Fang":
                attack.effective = effectiveMult !== 0 ? "normal" : "not";
                attack.max = Math.max(1, Math.ceil(defender.maxHPLeft / 2));
                attack.min = Math.max(1, Math.ceil(defender.minHPLeft / 2));
                return;
                break;
            case "Endeavor":
                attack.effective = effectiveMult !== 0 ? "normal" : "not";
                attack.max = defender.minHPLeft > attacker.minHPLeft ? defender.minHPLeft - attacker.minHPLeft : 0;
                attack.min = defender.maxHPLeft > attacker.maxHPLeft ? defender.maxHPLeft - attacker.maxHPLeft : 0;
                //var temp = defender.maxHPLeft + defender.minHPLeft - attacker.minHPLeft - attacker.maxHPLeft;
                //attack.min = attack.max = Math.max(0, temp / 2);
                return;
                break;
            case "Psywave":
                attack.effective = effectiveMult !== 0 ? "normal" : "not";
                attack.min = 50;
                attack.max = 150;
                return;
                break;
        }
        

        //only physical and special attacks beyond this point
        //only base power-bearing moves beyond this point
        //such base power bearing moves are affected normally by super / normal / weak / none effectiveness multipliers
        if (!isPhysical && !isSpecial)
            alert("ERROR: non-phsyical and non-special should not have reached this point");

        //for ice se on bug
        //doesn't work properly in some cases
        //attack.effective is now used for logic with berries, so changing this is bad now
//        var funEffective = effectiveMult;
//        if (move.type === 'ice' && (defender.type1 === 'bug' || defender.type2 === 'bug') ) {
//            //funEffective *= 2;
//        }

        
        if (move.TYPELESS) {
           attack.effective = 'normal';
       } else {
            if (effectiveMult > 1) {
                attack.effective = "super";
                if(defItem.name === 'Enigma Berry') {
                    attack.mark = 'negative';
                }
            } else if (effectiveMult === 1) {
                attack.effective = "normal";
            } else if (effectiveMult > 0) {
                attack.effective = "weak";
            } else {
                attack.effective = "not";
                return;
            }
        }
        ////////////////////////////////
        ////////// BASE POWER //////////
        ////////////////////////////////

        //moves that may return
        switch (move.name) {
            case 'Explosion':
            case 'Self-Destruct':
                if (defAbility === 'Damp') {
                    attack.effective = 'not';
                    return;
                }
                break;
        }
        
        switch (move.name) {
            /*
            case 'Bug Bite':
            case 'Pluck':
                if (defender.item.name.indexOf(" Berry") !== -1) {
                    // this isn't true!!!! VEEKUN SwiftRage
                    movePower *= 2;
                    attack.mark = 'negative';
                }
                break;*/
            case 'Smelling Salts':
                if (defender.isParalyzed) {
                    movePower *= 2;
                } else if(! defender.hasMajorStatus()) {
                    attack.mark = 'positive';
                }
                break;
            case 'Wring Out':
            case 'Crush Grip':
                movePowerMax = 1 + Math.floor(120 * defender.maxHPLeft / defender.stats.hp);
                movePowerMin = 1 + Math.floor(120 * defender.minHPLeft / defender.stats.hp);
                break;
            case "Eruption":
            case "Water Spout":
                movePowerMax = Math.max(1, Math.floor(movePower * attacker.maxHPLeft / attacker.stats.hp));
                movePowerMin = Math.max(1, Math.floor(movePower * attacker.minHPLeft / attacker.stats.hp));
                break;
            case 'Facade':
                if (attacker.isParalyzed || attacker.isBurned || attacker.isPoisoned)
                    movePower *= 2;
                break;
            case "Flail":
            case "Reversal":
                var p = Math.floor(48 * attacker.minHPLeft / attacker.stats.hp);
                movePowerMax = p <= 1 ? 200 : p <= 4 ? 150 : p <= 9 ? 100 : p <= 16 ? 80 : p <= 32 ? 40 : 20;

                var p = Math.floor(48 * attacker.maxHPLeft / attacker.stats.hp);
                movePowerMin = p <= 1 ? 200 : p <= 4 ? 150 : p <= 9 ? 100 : p <= 16 ? 80 : p <= 32 ? 40 : 20;
                break;
            case "Fling":
                if ( attacker.hasItem() && attItem.flingPower) {
                    movePower = attItem.flingPower;
                } else {
                    attack.effective = 'not';
                    return;
                }
                break;
            case "Brine":
                if (defender.maxHPLeft <= defender.stats.hp / 2) {
                    movePower *= 2;
                } else if (defender.minHPLeft <= defender.stats.hp / 2) {
                    movePowerMin = movePower;
                    movePowerMax = movePower * 2;
                    attack.mark = 'positive';
                } else {
                    attack.mark = 'positive';
                }
                break;
            case "Grass Knot":
            case "Low Kick":
                var w = defender.weight;
                movePower = w >= 200 ? 120 : w >= 100 ? 100 : w >= 50 ? 80 : w >= 25 ? 60 : w >= 10 ? 40 : 20;
                break;
            case "Gyro Ball":
                movePower = Math.min(150, Math.floor(25 * defenderDuel.speed / attackerDuel.speed));
                break;
            case "Punishment":
                var boostCount = calc.countPunishmentBoosts(defender);
                movePower = 60;
                if (boostCount > 0) {
                    movePower = Math.min(200, movePower + 20 * boostCount);
                }
                break;
            case "Magnitude":
                movePowerMin = 10;
                movePowerMax = 150;
                if(defender.hasMove('Dig'))
                    attack.mark = 'positive';
                break; 
                break;
            case "Spit Up":
                //power is shown because obviously it can't be used until stockpiles are done
                //more information to the user is better when possible
                if (attacker.stockpiles === 2)
                    movePower = 200;
                else if (attacker.stockpiles === 3)
                    movePower = 300;
                else
                    movePower = 100;
                break;
            case 'Return':
                movePower = Math.floor(attacker.happiness / 2.5);
                if (movePower === 0)
                    movePower = 1;
                attack.power = movePower;
                break;
            case 'Frustration':
                movePower = Math.floor((255 - attacker.happiness) / 2.5);
                if (movePower === 0)
                    movePower = 1;
                attack.power = movePower;
                break;
            case 'Triple Kick':
                movePowerMin = 20;
                movePowerMax = 20;
                break;
            case 'Present':
                movePowerMin = 40;
                movePowerMax = 120;
                break;
            case 'Trump Card':
                var pp = attacker.trumpPPRemaining;
                if (pp === 0) {
                    attack.effective = 'not';
                    attack.power = 0;
                    return;
                } else {
                    var ppAfterUse;
                    if (defender.ability.name === "Pressure") {
                        ppAfterUse = pp - 2;
                    } else {
                        ppAfterUse = pp - 1;
                    }
                    
                    if (ppAfterUse >= 4) {
                        movePower = 40;
                    } else if (ppAfterUse === 3) {
                        movePower = 50;
                    } else if (ppAfterUse === 2) {
                        movePower = 60;
                    } else if (ppAfterUse === 1) {
                        movePower = 80;
                    } else {
                        movePower = 200;
                    }
                    
                    if (pp > 1) {
                        attack.mark = "positive";
                    } else {
                        attack.mark = "";
                    }
                }
                break;
            case 'Wake-Up Slap':
                if (attacker.isAsleep)
                    movePower *= 2;
                break;
            case 'Payback':
                //double the damage if we were just damaged by a faster move
                if (isSlower && ! defender.hasMoveWithLessPriority(0)) {
                    //always slower
                    movePower *= 2;
                } else if (isFaster && !defender.hasMoveWithGreaterPriority(0)) {
                    //always faster
                    ;
                } else if (lastMoveHitBy && 
                        (defenderDuel.usedMoveThisTurn && 
                        (isSlower && lastMoveHitBy.priority === 0 || 
                            lastMoveHitBy.priority > 0))) {
                    // was just hit by a faster move
                    movePower *= 2;
                } else {
                    //we might be faster, depending on what move opponent uses
                    //or speed tie
                    attack.mark = 'positive';
                }
                break;
            case 'Avalanche':
            case 'Revenge':
                //double the damage if we were just damaged by a faster move
                if (attackerDuel.tookDamageThisTurn && 
                        (lastMoveHitBy.priority > -4 || 
                            lastMoveHitBy.priority === -4 && isSlower))
                    movePower *= 2;
                else
                    attack.mark = 'positive';
                break;
            case 'Rollout':
                movePower = movePower * Math.pow(2, attacker.rolloutCount);
                break;
            case 'Ice Ball':
                movePower = movePower * Math.pow(2, attacker.iceBallCount);
                break;
            case 'Fury Cutter':
                movePower = movePower * Math.pow(2, attacker.furyCutterCount);
                break;
            case 'Surf':
                if(defender.hasMove('Dive'))
                    attack.mark = 'positive';
                break;
            case 'Dive':
                if(defender.hasMove('Surf'))
                    attack.mark = 'negative';
                break;
            case 'Dig':
                if(defender.hasOneOfMoves(['Magnitude', 'Earthquake']))
                    attack.mark = 'negative';
                break;
            //magnitude also does a damage roll calc
            //it's a bit further up in this switch
            case 'Earthquake':
                if(defender.hasMove('Dig'))
                    attack.mark = 'positive';
                break;
            case 'Fly':
            case 'Bounce':
                if(defender.hasOneOfMoves(['Gust', 'Thunder', 'Twister', 'Sky Uppercut']))
                    attack.mark = 'negative';
                break;
            case 'Gust':
            case 'Twister':
            case 'Thunder':
                if(defender.hasMove('Fly') || defender.hasMove('Bounce'))
                    attack.mark = 'positive';
                break;
            case 'Icy Wind':
            case 'Mud Shot':
            case 'Rock Tomb':
                if(defAbility === 'Clear Body' || defAbility === 'White Smoke' || defAbility === 'Shield Dust') {
                    attack.noSecondaryEffect = true;
                    attack.mark = 'negative';
                }
                break;
            case 'Mud Slap':
                if(defAbility === 'Clear Body' || defAbility === 'White Smoke' || defAbility === 'Keen Eye') {
                    attack.noSecondaryEffect = true;
                    attack.mark = 'negative';
                }
                break;
        }
        
        //movePower is no longer used beyond this point, to keep things simpler
        if (movePowerMin === -1 && movePowerMax === -1)
            movePowerMin = movePowerMax = movePower;
        else if (movePowerMin === -1 || movePowerMax === -1)
            alert("movePowerMin/Max was not set correctly");

        //movePower is no longer used beyond this point
        if (attacker.ability.name === "Rivalry") {
            if ((attacker.gender === 'm' && defender.gender === 'm') ||
                    (attacker.gender === 'f' && defender.gender === 'f')) {
                movePowerMin = Math.floor(movePowerMin * 1.25);
                movePowerMax = Math.floor(movePowerMax * 1.25);
            } else if ((attacker.gender === 'm' && defender.gender === 'f') ||
                    (attacker.gender === 'f' && defender.gender === 'm')) {
                movePowerMin = Math.floor(movePowerMin * .75);
                movePowerMax = Math.floor(movePowerMax * .75);
            }
        }

        if (attacker.ability.name === "Technician") {
            if (movePowerMin <= 60)
                movePowerMin = Math.floor(movePowerMin * 1.5);
            if (movePowerMax <= 60)
                movePowerMax = Math.floor(movePowerMax * 1.5);
        }

        if (attacker.hasItem()) {
            if ((attItem.name === "Muscle Band" && isPhysical) || (attItem.name === "Wise Glasses" && !isPhysical)) {
                movePowerMin = Math.floor(movePowerMin * 1.1);
                movePowerMax = Math.floor(movePowerMax * 1.1);
            } else if (attItem.boostType === attack.type ||
                    (((attItem.name === "Adamant Orb" && attacker.name === "Dialga") ||
                            (attItem.name === "Lustrous Orb" && attacker.name === "Palkia") ||
                            (attItem.name === "Griseous Orb" && attacker.name === "Giratina-O")) &&
                            (attack.type === attacker.type1 || attack.type === attacker.type2))) {
                movePowerMin = Math.floor(movePowerMin * 1.2);
                movePowerMax = Math.floor(movePowerMax * 1.2);
            }
        } 
           

        if ((attacker.ability.name === "Reckless" && move.RECOIL) ||
                (attacker.ability.name === "Iron Fist" && move.PUNCH)) {
            movePowerMin = Math.floor(movePowerMin * 1.2);
            movePowerMax = Math.floor(movePowerMax * 1.2);
        }

        var pinchBoost = false;
        switch(attacker.ability.name) {
            case 'Overgrow':
                if (attack.type === 'grass') {
                    pinchBoost = true;
                }
                break;
            case 'Blaze':
                if (attack.type === 'fire') {
                    pinchBoost = true;
                }
                break;
            case 'Torrent':
                if (attack.type === 'water') {
                    pinchBoost = true;
                }
                break;
            case 'Swarm':
                if (attack.type === 'bug') {
                    pinchBoost = true;
                }
                break;
        }

        if (pinchBoost) {
            if (attacker.minHPLeft <= attacker.stats.hp / 3) {
                movePowerMax = Math.floor(movePowerMax * 1.5);
            }
            
            if (attacker.maxHPLeft <= attacker.stats.hp / 3) {
                movePowerMin = Math.floor(movePowerMin * 1.5);
            } else {
                attack.mark = 'positive';
            }
        }

        if ((defAbility === "Thick Fat" && (attack.type === "fire" || attack.type === "ice")) ||
                (defAbility === "Heatproof" && attack.type === "fire")) {
            movePowerMin = Math.floor(movePowerMin * 0.5);
            movePowerMax = Math.floor(movePowerMax * 0.5);
        }
        
        if (defAbility === "Dry Skin" && attack.type === "fire") {
            //no boost if you have mold breaker lol
            movePowerMin = Math.floor(movePowerMin * 1.25);
            movePowerMax = Math.floor(movePowerMax * 1.25);
        }

        ////////////////////////////////
        ////////// (SP)ATTACK //////////
        ////////////////////////////////
        var attackPower;


        if (isPhysical) {
            attackPower = attacker.stats.atk;
            if (defAbility === 'Unaware')
                ;
            else if (attacker.ability.name === "Simple") //else if since an unaware defender blocks a simple attacker
                attackPower = calc.getModifiedStat(attackPower, 2 * attacker.stages.atk);
            else
                attackPower = calc.getModifiedStat(attackPower, attacker.stages.atk);
        } else {
            attackPower = attacker.stats.sat;
            if (defAbility === 'Unaware')
                ;
            else if (attacker.ability.name === "Simple")
                attackPower = calc.getModifiedStat(attackPower, 2 * attacker.stages.sat);
            else
                attackPower = calc.getModifiedStat(attackPower, attacker.stages.sat);
        }

        //mold breaker only affects the mold breaker's attacks
        if (isPhysical && (attacker.ability.name === "Pure Power" || attacker.ability.name === "Huge Power")) {
            attackPower *= 2;
        } else if (duelWeather === "sun" && (isPhysical ? attacker.ability.name === "Flower Gift" : attacker.ability.name === "Solar Power")) {
            attackPower = Math.floor(attackPower * 1.5);
        } else if (isPhysical && (
                ( attacker.ability.name === 'Guts' && attacker.hasMajorStatus() ) ||
                 attacker.ability.name === "Hustle" )) {
            attackPower = Math.floor(attackPower * 1.5);
        }

        if (attItem.name) {
            if ((isPhysical ? attItem.name === "Choice Band" : attItem.name === "Choice Specs") ||
                    (attItem.name === "Soul Dew" && (attacker.name === "Latios" || attacker.name === "Latias") && !isPhysical)) {
                attackPower = Math.floor(attackPower * 1.5);
            } else if ( (attItem.name === "Light Ball" && attacker.name === "Pikachu") ||
                    (attItem.name === "Thick Club" && (attacker.name === "Cubone" || attacker.name === "Marowak") && isPhysical) ||
                    (attItem.name === "Deep Sea Tooth" && attacker.name === "Clamperl" && !isPhysical)) {
                attackPower *= 2;
            }
        }

        if ((move.name === 'Rollout' || move.name === 'Ice Ball') && attacker.curled)
            attackPower *= 2;

        if (attacker.isCharged && attack.type === 'electric')
            attackPower *= 2;

        ////////////////////////////////
        ///////// (SP)DEFENSE //////////
        ////////////////////////////////
        var defense;
        if (isPhysical) {
            defense = defender.stats.def;
            if (attacker.ability.name === 'Unaware') //unaware attacking a non-mold breaker[sic?]
                ;
            else if (defAbility === "Simple") //else if since an unaware attacker breaks through a simple defender
                defense = calc.getModifiedStat(defense, 2 * defender.stages.def);
            else
                defense = calc.getModifiedStat(defense, defender.stages.def);
        } else {
            defense = defender.stats.sdf;
            if (attacker.ability.name === 'Unaware')
                ;
            else if (defAbility === "Simple")
                defense = calc.getModifiedStat(defense, 2 * defender.stages.sdf);
            else
                defense = calc.getModifiedStat(defense, defender.stages.sdf);
        }

        if (defAbility === "Marvel Scale" && defender.hasMajorStatus() && isPhysical) {
            defense = Math.floor(defense * 1.5);
        } else if (defAbility === "Flower Gift" && duelWeather === "sun" && !isPhysical) {
            defense = Math.floor(defense * 1.5);
        }

        if ((defItem.name === "Soul Dew" && (defender.name === "Latios" || defender.name === "Latias") && !isPhysical) ||
                (defItem.name === "Metal Powder" && defender.name === "Ditto")) {
            defense = Math.floor(defense * 1.5);
        } else if (defItem.name === "Deep Sea Scale" && defender.name === "Clamperl" && !isPhysical) {
            defense *= 2;
        }

        if (duelWeather === "sandstorm" && (defender.type1 === "rock" || defender.type2 === "rock") && !isPhysical) {
            defense = Math.floor(defense * 1.5);
        }

        if (move.name === "Explosion" || move.name === "Self-Destruct") {
            defense = Math.floor(defense * 0.5);
        }

        if (defense < 1) {
            defense = 1;
        }

        ////////////////////////////////
        //////////// DAMAGE ////////////
        ////////////////////////////////

        var baseDamageMax = Math.floor(Math.floor(Math.floor(2 * attacker.level / 5 + 2) * movePowerMax * attackPower / 50) / defense);
        var baseDamageMin = Math.floor(Math.floor(Math.floor(2 * attacker.level / 5 + 2) * movePowerMin * attackPower / 50) / defense);

        if (attacker.isBurned && isPhysical && attacker.ability.name !== "Guts") {
            baseDamageMin = Math.floor(baseDamageMin * 0.5);
            baseDamageMax = Math.floor(baseDamageMax * 0.5);
        }

        var reflectUp = match.teamFields[defenderTeam].reflect;
        var screenUp = match.teamFields[defenderTeam].screen;
        
        if (isPhysical && reflectUp) {
            baseDamageMin = Math.floor(baseDamageMin / 2);
            baseDamageMax = Math.floor(baseDamageMax / 2);
        } else if (!isPhysical && screenUp) {
            baseDamageMin = Math.floor(baseDamageMin / 2);
            baseDamageMax = Math.floor(baseDamageMax / 2);
        }

        if ((duelWeather === "sun" && attack.type === "fire") || 
                (duelWeather === "rain" && attack.type === "water")) {
            baseDamageMin = Math.floor(baseDamageMin * 1.5);
            baseDamageMax = Math.floor(baseDamageMax * 1.5);
        } else if ((duelWeather === "sun" && attack.type === "water") || 
                (duelWeather === "rain" && attack.type === "fire") ||
                (["rain", "sandstorm", "hail"].indexOf(duelWeather) !== -1 && move.name === "Solar Beam")) {
            baseDamageMin = Math.floor(baseDamageMin * 0.5);
            baseDamageMax = Math.floor(baseDamageMax * 0.5);
        }

        /*
         if (attacker.ability.name === "Flash Fire (activated)" && attack.type === "fire") {
         baseDamageMin = Math.floor(baseDamageMin * 1.5);
         description.attackerAbility = "Flash Fire";
         }*/

        baseDamageMin += 2;
        baseDamageMax += 2;

        if (attItem.name === "Life Orb") {
            baseDamageMin = Math.floor(baseDamageMin * 1.3);
            baseDamageMax = Math.floor(baseDamageMax * 1.3);
        } else if( attItem.name === 'Metronome' &&
                attacker.lastUsedMove && attacker.lastUsedMove.name === move.name ) {
            var count = attacker.consecutiveMoveCount;
            var boost = count > 10 ? 1 : count * .1;
            baseDamageMin = Math.floor( baseDamageMin * (1 + boost) );
            baseDamageMax = Math.floor( baseDamageMax * (1 + boost) );
        }
        
        if( attacker.meFirstMoveIndex !== null && 
               attacker.meFirstMoveIndex === moveIndex ) {
            console.log("me first boost");
            baseDamageMin = Math.floor(baseDamageMin * 1.5);
            baseDamageMax = Math.floor(baseDamageMax * 1.5);
        }

        // the random factor is applied between the LO mod and the STAB mod, so don't apply anything below this until we're inside the loop
        var stabMod = 1;

        if (attack.type === attacker.type1 || attack.type === attacker.type2) {
            if (attacker.ability.name === "Adaptability") {
                stabMod = 2;
            } else {
                stabMod = 1.5;
            }
        }

        var filterMod = 1;
        if ((defAbility === "Filter" || defAbility === "Solid Rock") && attack.effective === "super") {
            filterMod = 0.75;
        }
        var ebeltMod = 1;
        if (attItem.name === "Expert Belt" && attack.effective === "super") {
            ebeltMod = 1.2;
        }
        var tintedMod = 1;
        if (attacker.ability.name === "Tinted Lens" && attack.effective === "weak") {
            tintedMod = 2;
        }
        var berryMod = 1;
        if (defItem.berryResistType === attack.type 
                && (attack.effective === "super" || attack.type === "normal")) {
            attack.mark = 'positive';
            berryMod = 0.5;
        }

        var totalDamage = [];
        totalDamage[0] = Math.floor(baseDamageMin * (85) / 100);
        totalDamage[1] = Math.floor(baseDamageMax * (100) / 100);
        for (var i = 0; i < 2; i++) {
            if (!move.TYPELESS) {
                totalDamage[i] = Math.floor(totalDamage[i] * stabMod);
                totalDamage[i] = Math.floor(totalDamage[i] * typeEffectiveMult1);
                totalDamage[i] = Math.floor(totalDamage[i] * typeEffectiveMult2);
                totalDamage[i] = Math.floor(totalDamage[i] * filterMod);
                totalDamage[i] = Math.floor(totalDamage[i] * ebeltMod);
                totalDamage[i] = Math.floor(totalDamage[i] * tintedMod);
                totalDamage[i] = Math.floor(totalDamage[i] * berryMod);
            }
            totalDamage[i] = Math.max(1, totalDamage[i]);
        }

        attack.min = totalDamage[0];
        attack.max = totalDamage[1];

        if (move.FIVE_HITS) {
            if (attacker.ability.name === 'Skill Link') {
                attack.min *= 5;
                attack.max *= 5;
            } else {
                attack.min *= 2;
                attack.max *= 5;
            }
        }
        else if (move.TWO_HITS) {
            attack.min *= 2;
            attack.max *= 2;
        } else if(move.name === 'Triple Kick') {
            if (defender.name === 'Kyogre') {
//                logger.debug("MOVEPOWERMAX:" + movePowerMax);
//                logger.debug("MAX: " + attack.max);
            }
            attack.max *= 3;
            //attack.max = 148;
        }
      
    }

    ///////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////
    //////////////////		 END ATTACK      //////////////////////
    ///////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////
    
    return calcDuel;
});