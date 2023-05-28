define(["gameData", "utils"], function(gameData, utils) {
    "use strict";

    var BLANK_ATTACK = {"effective": "normal",
                    "accuracy": 100,
                    "min": 0,
                    "max": 0,
                    "mark": "",
                    "type": "" };

    function Duel() {
        var self = this;
        /* Every pokemon has four attacks that will be cleared before
         * damage calculation by Pokemon.prototype.clearAttacks()
         * 
         * This prevents odd behavior/crashing from clicking 
         * random attacks on pokemon such as ditto
         */
        self.attacks = [];
        for( var i = 0; i < 4; i++ ) {
            self.attacks.push( {} );
        }


        self.speed = 0;

        //for counter, mirror coat, metal burst
        //for avalanche, revenge, payback
        self.lastAttackHitBy = false;
        self.lastMoveHitBy = false;

        //for avalanche, revenge
        self.tookDamageThisTurn = false;

        //for payback, avalance, and revenge
        self.usedMoveThisTurn = false;

        //for bide
        self.bideMinDamage = 0;
        self.bideMaxDamage = 0;
    }
    
    Duel.prototype.clearAttacks = function() {
        var self = this;
        for( var i = 0; i < 4; i++ ) {
            self.attacks[i] = self.getBlankAttack();
        }
    };
    
    Duel.prototype.getBlankAttack = function() {
        return utils.deepCopy(BLANK_ATTACK);
    };
    
    Duel.prototype.getAttack = function(attackIndex) {
        var self = this;
        return self.attacks[attackIndex];
    };

    return Duel;
});