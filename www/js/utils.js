define([], function() {
    "use strict";
    var routines = {};
    
    
    // closure for math utils
    (function() {
        /**
         * Decimal adjustment of a number.
         *
         * @param {String}  type  The type of adjustment.
         * @param {Number}  value The number.
         * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
         * @returns {Number} The adjusted value.
         */
        function decimalAdjust(type, value, exp) {
          // If the exp is undefined or zero...
          if (typeof exp === 'undefined' || +exp === 0) {
            return Math[type](value);
          }
          value = +value;
          exp = +exp;
          // If the value is not a number or the exp is not an integer...
          if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
            return NaN;
          }
          // If the value is negative...
          if (value < 0) {
            return -decimalAdjust(type, -value, exp);
          }
          // Shift
          value = value.toString().split('e');
          value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
          // Shift back
          value = value.toString().split('e');
          return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
        }

        // Decimal round
        if (!Math.round10) {
          Math.round10 = function(value, exp) {
            return decimalAdjust('round', value, exp);
          };
        }
        // Decimal floor
        if (!Math.floor10) {
          Math.floor10 = function(value, exp) {
            return decimalAdjust('floor', value, exp);
          };
        }
        // Decimal ceil
        if (!Math.ceil10) {
          Math.ceil10 = function(value, exp) {
            return decimalAdjust('ceil', value, exp);
          };
        }
     })();

    routines.getEmote = function(name) {
        return "<div class='emoteContainer'><img src='/img/emotes-named/0.8/" + name + ".png' /></div>";
    };
    
    routines.alertError = function(msg) {
        if (!msg) {
            msg = "An error occured.  Please see console for details.";
        }
        alert(msg);
    };
    
    routines.logError = function(obj) {
        console.log(obj);
    };
    
    // returns random 32 bit integer
    routines.checksum = function(s) {
        var hash = 0,
        strlen = s.length,
        i,
        c;
        if (strlen === 0) {
            return hash;
        }
        for (i = 0; i < strlen; i++) {
            c = s.charCodeAt(i);
            hash = ((hash << 5) - hash) + c;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    };
    
    
    routines.randWithSeed = function(str) {
        var num = routines.checksum(str);
        for( var i = 0; i < 5; i++ ) {
            num = routines.checksum(num.toString());
        }
        return num;
    };
    
    routines.isNumber = function(obj) { 
        return !isNaN(parseFloat(obj));
    };
    
    routines.deepCopy = function(obj) {
        return JSON.parse(JSON.stringify(obj));  
    };
    
    return routines;
});