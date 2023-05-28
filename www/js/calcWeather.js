define(["utils", "calcRoutines"], function(utils, calc) {
    "use strict";
    
    function setRedWeather(ib, ir, effect, match) {
        for (var b = ib; b < 3; b++)
            match.setWeather(b, ir, effect);
//        for (var b = ib; b < 3; b++)
//            for (var r = ir; r < 3; r++)
//                match.setWeather(b, r, effect);
    };

    function setBlueWeather(ib, ir, effect, match) {
        for (var r = ir; r < 3; r++)
                match.setWeather(ib, r, effect);
//        for (var b = ib; b < 3; b++)
//            for (var r = ir; r < 3; r++)
//                match.setWeather(b, r, effect);
    };
    
    function setAllRedWeather(ib, ir, effect, match) {
        for (var b = ib; b < 3; b++)
            match.setWeather(b, ir, effect);
        for (var b = ib; b < 3; b++)
            for (var r = ir; r < 3; r++)
                match.setWeather(b, r, effect);
    };

    function setAllBlueWeather(ib, ir, effect, match) {
        for (var r = ir; r < 3; r++)
                match.setWeather(ib, r, effect);
        for (var b = ib; b < 3; b++)
            for (var r = ir; r < 3; r++)
                match.setWeather(b, r, effect);
    };


    function weatherWarAll(ib, ir, match) {
        var bluePkmn = match.teams[0][ib];
        var redPkmn = match.teams[1][ir];
        var blueWeather = bluePkmn.ability.BRINGS_WEATHER;
        var redWeather = redPkmn.ability.BRINGS_WEATHER;
        if (blueWeather && redWeather) {
//            console.log("AA");
            var cmp = calc.compareSpeeds(bluePkmn, 0, redPkmn, 1, match);
            if (cmp === 1) {
                setAllRedWeather(ib, ir, redWeather, match);
            } else if (cmp === -1) {
                setAllBlueWeather(ib, ir, blueWeather, match);
            } else {
//                console.log("DD");
                setAllRedWeather(ib, ir, "fog", match);
                setAllBlueWeather(ib, ir, "fog", match);
            }
        } else if (blueWeather) {
            setAllBlueWeather(ib, ir, blueWeather, match);
        } else if (redWeather) {
            setAllRedWeather(ib, ir, redWeather, match);
        }
    };

    function weatherWar(ib, ir, match) {
        var bluePkmn = match.teams[0][ib];
        var redPkmn = match.teams[1][ir];
        var blueWeather = bluePkmn.ability.BRINGS_WEATHER;
        var redWeather = redPkmn.ability.BRINGS_WEATHER;
        if (blueWeather && redWeather) {
//            console.log("AA2");
            var cmp = calc.compareSpeeds(bluePkmn, 0, redPkmn, 1, match);
            if (cmp === 1) {
                setRedWeather(ib, ir, redWeather, match);
            } else if (cmp === -1) {
                setBlueWeather(ib, ir, blueWeather, match);
            } else {
//                console.log("DD2");
                setBlueWeather(ib, ir, 'fog', match);
                setRedWeather(ib, ir, 'fog', match);
            }
        } else if (blueWeather) {
            setBlueWeather(ib, ir, blueWeather, match);
        } else if (redWeather) {
            setRedWeather(ib, ir, redWeather, match);
        }
    };

    function calcWeather(match) {
        for (var ib = 0; ib < 3; ib++) {
            for (var ir = 0; ir < 3; ir++) {
                match.setWeather(ib, ir, "none");
            }
        }
        // 0 vs 0
        weatherWarAll(0, 0, match);
        
        // 0 v 1, 1 v 0
        var blueWeather = match.teams[0][1].ability.BRINGS_WEATHER;
        if (blueWeather)
            setBlueWeather(1, 0, blueWeather, match);
        
        var redWeather = match.teams[1][1].ability.BRINGS_WEATHER;
        if (redWeather)
            setRedWeather(0, 1, redWeather, match);

        //1v1
        weatherWar(1, 1, match);

        //0v2, 2v0
        var blueWeather = match.teams[0][2].ability.BRINGS_WEATHER;
        if (blueWeather)
            setBlueWeather(2, 0, blueWeather, match);
        var redWeather = match.teams[1][2].ability.BRINGS_WEATHER;
        if (redWeather)
            setRedWeather(0, 2, redWeather, match);

        //1v2, 2v1
        if (match.teams[0][2].ability.BRINGS_WEATHER && match.teams[1][1].ability.BRINGS_WEATHER)
            weatherWar(2, 1, match);
        if (match.teams[0][1].ability.BRINGS_WEATHER && match.teams[1][2].ability.BRINGS_WEATHER)
            weatherWar(1, 2, match);
        
        //2v2
        if (match.teams[0][2].ability.BRINGS_WEATHER && match.teams[1][2].ability.BRINGS_WEATHER)
            weatherWar(2, 2, match);
    };
    
    
    
    return calcWeather;
});