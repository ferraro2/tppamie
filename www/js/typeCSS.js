define([], function() {
    var TYPE_BASE_SHADE = {
        normal: 'black',
        fire: 'black',
        water: 'white',
        electric: 'black',
        grass: 'black',
        ice: 'black',
        fighting: 'black',
        poison: 'black',
        ground: 'black',
        flying: 'black',
        psychic: 'white',
        bug: 'black',
        rock: 'white',
        ghost: 'black',
        dragon: 'white',
        dark: 'white',
        steel: 'black'
    };

    var TYPE_BASE_HUE = {
        normal: '#FFD39B',
        fire: '#ff3030',
        water: '#0042ff',
        electric: '#fff800',
        grass: '#73ed32',
        ice: '#21e0ff',
        fighting: '#cd3700',
        poison: '#ff69b4',
        ground: '#d87865',
        flying: '#40ffd8',
        psychic: '#9400d3',
        bug: '#aaff00',
        rock: '#62472b',
        ghost: '#ffffff',
        dragon: '#4d379b',
        dark: '#2b2b2b',
        steel: '#d0e0ff'
    };
    
    return {
        "getShade": function(type) {
            return TYPE_BASE_SHADE[type];
        }, "getHue": function(type) {
            return TYPE_BASE_HUE[type];
        }
    };
});