define(["gameData", "logger", 
    "settings", "utils"], 
    function(gameData, logger, 
        settings, utils) {
    "use strict";

    /**
     * Represents a Pokemon.
     * @constructor
     * @param {Object} extPkmnData
     * @returns {Pokemon_L1.Pokemon}
     */
    function Pokemon(extPkmnData) {
        var self = this;
        //for each attribute in our pkmn copy, refer the same attribute
        //of self to the corresponding attribute of the copy
        Object.keys(extPkmnData).forEach(function(key) {
            self[key] = extPkmnData[key];
        });

        //refer pkmn.ability to the appropriate ability in ABILITY_LIST
        //ability should be read only
        if( self.ability ) {
            self.ability = gameData.ABILITIES[self.ability];
        } else {
            self.ability = gameData.ABILITIES[0];
        }
         
        // assign formName field to pokemon of an alternate form
        if (self.form) {
            var formNames = gameData.FORM_NAMES;
            var strId = "" + self.id;
            var strForm = "" + self.form;
            if (formNames[strId] && formNames[strId][strForm]) {
                self.formName = formNames[strId][strForm];
            } else {
                utils.alertError();
                utils.logError("Could not identify form name for pokemon:");
                utils.logError(self);
            }
        } else {
            self.form = 0;
        }
        
        self.trumpPPRemaining = 5;
        
        //refer self.moves[-] to the appropriate move in MOVE_LIST
        //moves should be read only
        self.moves.forEach(function(moveId, i, moves) {
            if( moveId === 0) {
                logger.error("Pokemon " + self.name + " should not have a move with id 0.");
            } else {
                var move = gameData.MOVES[moveId];
                if( move ) {
                    moves[i] = move;
                    if (move.name === 'Trump Card') {
                        self.trumpPPRemaining = self.pp[i];
                    }
                } else {
                    logger.error("GameData has no real entry for move number " + moveId);
                }
            }
        });
        
       
        
        self.stages = {};
        gameData.STAGE_NAMES.forEach(function(stageName) {
            self.stages[stageName] = 0;
        });
        
        //pretty much just for ditto
        //transformedName will change, name won't change
        self.transformedName = self.name;
        
//        logger.debug("Setting up item for pokemon" + self.name);
//        logger.debug(self.name);
//        logger.debug(self.item);
        if (self.item) {
            var item = gameData.ITEMS["" + self.item];
            if (item) {
                self.item = gameData.ITEMS["" + self.item];
            } else {
                logger.warn("GameData has no entry for item number " + self.item);
                self.item = gameData.ITEMS["0"];
            }
        } else {
            self.item = gameData.ITEMS["0"];
        }
        
        if (typeof self.level === 'undefined') {
            self.level = 100;
        }
        
        self.weight = gameData.PKMN_WEIGHTS[self.id];

//        logger.debug(self.item);
//        logger.debug("Done setting up item for pokemon" + self.name);
        

        self.minDamageTaken = 0;
        self.maxDamageTaken = 0;

        self.minHPLeft = self.stats.hp;
        self.maxHPLeft = self.stats.hp;

        self.ghostRevealed = false;
        self.darkRevealed = false;
        self.magnetRising = false;
        self.isRoosting = false;
        
        self.isCharged = false;

        self.isTransformed = false;
        self.transformedInto = "";

        //def curl rollout boost
        self.curled = false;
        self.rolloutCount = 0;
        self.iceBallCount = 0;
        self.furyCutterCount = 0;
        self.stockpiles = 0;
        
        self.lastUsedMove = gameData.MOVES[0];
        self.consecutiveMoveCount = 0;

        self.isBurned = false;
        self.isParalyzed = false;
        self.isAsleep = false;
        self.isFrozen = false;
        self.isPoisoned = false;
        self.isConfused = false;
        
        self.underEmbargo = false;

        self.meFirstMoveIndex = null;

        //NEW STRUCTURES
        gameData.STAGE_NAMES.forEach(function(stageName) {
           self.stages[stageName] = 0; 
        });
        
        
        var lol = {};
        lol.ability = {"a": "b", "c": 3};
        lol.ability2 = lol.ability;
//        logger.debug(lol);
//        logger.debug(utils.deepCopy(lol));
//        
        
        
        
        /*
         * Copy ability and item values
         * This is an easy way to disable 
         */
//        self.abilityh = 24;
//        logger.debug(self.ability);
        self.ability2 = self.ability;
//        self.abilityp = {};
//        logger.debug(self);
//        logger.debug(utils.deepCopy(self));
        self.item2 = self.item;
        if(settings.ignoreAbilitiesAndItems === true) {
            self.ability = gameData.ABILITIES[0];
            self.item = gameData.ITEMS["0"];
        }
//        logger.debug(utils.deepCopy(self));
    }
    
    Pokemon.prototype.justTransformed = function() {
        var self = this;
        // add whatever else to this
        self.meFirstMoveIndex = null;
    };
    
    var BLANK_PKMN_SPEC = {"name": "Unown", 
        "displayName": "-", "id": 201, 
        "gender": "-", "form": 5, "ability": 25, 
        "stats": {"hp": 999, "atk": 999, "sdf": 999, "spd": 999, "def": 999, "sat": 999}, 
        "moves": [150], 
        "ivs": {"hp": 0, "atk": 0, "spA": 0, "spD": 0, "spe": 0, "def": 0}, 
        "pp": [40, 40, 40, 40], "happiness": 0, 
        "setName": "filler", "type1": "ghost", "type2": "dark"};
    
    Pokemon.getBlankPkmnSpec = function() {
        return utils.deepCopy(BLANK_PKMN_SPEC);
    };

    Pokemon.prototype.effectiveItem = function() {
        var self = this;
        if (self.ability.name === "Klutz" || self.underEmbargo)
            return gameData.ITEMS["0"];
        else
            return self.item;
    };
    
    /*
     * todo: embargo? (eg, affects unburden?)
     */
    Pokemon.prototype.hasEffectiveItem = function() {
        var self = this;
        if (self.ability.name === "Klutz" || self.underEmbargo)
            return false;
        return self.item.name !== "";
    };
    
    Pokemon.prototype.hasItem = function() {
        return this.item.name !== "";
    };
    
    Pokemon.prototype.removeItem = function() {
        this.item = gameData.ITEMS["0"];
    };
    
    Pokemon.prototype.hasMajorStatus = function() {
        return this.isBurned || this.isParalyzed || 
                this.isPoisoned || this.isAsleep ||
                this.isFrozen;
    };
    
    Pokemon.prototype.clearMajorStatus = function() {
        this.isBurned = false;
        this.isParalyzed = false;
        this.isPoisoned = false;
        this.isAsleep = false;
        this.isFrozen = false;
    };
    
    
    
    Pokemon.prototype.incStage = function(stage) {
        var currStage = this.stages[stage];
        this.stages[stage] = currStage === 6 ? 6 : currStage + 1;
    };
    
    Pokemon.prototype.decStage = function(stage) {
        var currStage = this.stages[stage];
        this.stages[stage] = currStage === -6 ? -6 : currStage - 1;
    };

    // consumes white herb if needed
    // not implemented yet, due to slight complexity (function as written won't work)
    Pokemon.prototype.tryDecStage = function(stage) {
        var self = this;
        if (self.effectiveItem().name === 'White Herb') {
            self.removeItem();
            return;
        } else {
            self.decStage(stage);
        }
    };

    // consumes white herb if needed
    // not implemented yet, due to slight complexity (function as written won't work)
    Pokemon.prototype.tryDecStages = function(stageList) {
        var self = this;
        if (self.effectiveItem().name === 'White Herb') {
            self.removeItem();
            return;
        } else {
            stageList.forEach(function(stage) {
                self.decStage(stage);
            }); 
        }
    };
    
    Pokemon.prototype.augmentStage = function(stage, augment) {
        var currStage = this.stages[stage];
        var newValue = currStage + augment;
        if (newValue < -6) {
            newValue = -6;
        } else if (newValue > 6) {
            newValue = 6;
        }
        this.stages[stage] = newValue;
    };
    
    Pokemon.prototype.zeroStages = function() {
        var self = this;
        gameData.STAGE_NAMES.forEach(function(stageName) {
           self.stages[stageName] = 0; 
        });
    };
    
    Pokemon.prototype.hasMove = function(queryName) {
        return this.moves.some(function(move) { 
            return move.name === queryName;
        });
    };
    
    Pokemon.prototype.hasAirborneMove = function() {
        return this.moves.some(function(move) {
            return move.AIRBORNE;
        });
    };
    
    Pokemon.prototype.hasOneOfMoves = function(queryArr) {
        return this.moves.some(function(move) { 
            return queryArr.some(function(queryName) {
                return move.name === queryName;
            });
        });
    };
    
    Pokemon.prototype.hasDamagingMoveType = function(queryType) {
        return this.moves.some(function(move) {
            return move.category !== "status" &&
                move.type === queryType;
        });
    };
    
    //return false for Protect / Detect!!
    Pokemon.prototype.hasMoveWithGreaterPriority = function(priority) {
        return this.moves.some(function(move) {
            if (move.priority <= priority)
                return false;
            
            else {
                return true;
            }
        });
    };
    
    Pokemon.prototype.hasMoveWithLessPriority = function(priority) {
        return this.moves.some(function(move) {
            if (move.priority >= priority)
                return false;
            
            else {
                switch (move.name) {
                case "Trick Room":
                    return false;
                    break;
                }
                return true;
            }
        });
    };
    
    Pokemon.prototype.hasPossibleSpecialMove = function() {
        return this.moves.some(function(move) {
            return move.category === "special" ||
                    move.CAN_BE_SPECIAL;
        });
    };

    Pokemon.prototype.hasPossiblePhysicalMove = function() {
        return this.moves.some(function(move) {
            return move.category === "physical" ||
                    move.CAN_BE_PHYSICAL;
        });
    };
    
    // prevent hp left and damage taken from going below zero
    Pokemon.prototype.verifyAndDeductDamage = function() {
        if (this.minDamageTaken < 0)
            this.minDamageTaken = 0;
        if (this.maxDamageTaken < 0)
            this.maxDamageTaken = 0;

        this.minHPLeft = this.stats.hp - this.maxDamageTaken;
        this.maxHPLeft = this.stats.hp - this.minDamageTaken;

        if (this.minHPLeft < 0)
            this.minHPLeft = 0;
        if (this.maxHPLeft < 0)
            this.maxHPLeft = 0;  
        
        //logger.debug(this.stats.hp + " - " + this.maxDamageTaken + " = " + this.minHPLeft);
        //logger.debug(this.stats.hp + " - " + this.minDamageTaken + " = " + this.maxHPLeft);
    };
    
    
    
    return Pokemon;
});