define(['jquery', 'logger'], 
    function($, logger) {
    "use strict";
    
    var settings = {};
    settings.ignoreAbilitiesAndItems = false;
    // gray-colored negative/positive markings
    settings.disableMoveMarkings = false;
    settings.disableStageButtons = false;
    settings.disableMoveClicking = false;
    settings.disableWeather = false;
    
    settings.autoPkmnUpdate = true;
    
    // custom settings for mobile visitors
    if (window.location.href.indexOf('m.tppvisuals.com') !== -1) {
        settings.animatedSprites = false;
        $("#js-animated-sprites").prop("checked", false);
    } else {
        settings.animatedSprites = true;
    }
    
    settings.layout = 'diamond';
    settings.bets = false;
    
    return settings;
});