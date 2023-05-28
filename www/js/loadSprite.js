define(['gameData', 'utils', 'settings'], function(gameData, utils, settings) {
    "use strict";
    
    
    function loadPkmnSprite(pkmn, i, matchHashStr) {
        /********************************************
        ***********     LOAD SPRITES      ***********
        ********************************************/
        var layout = settings.layout;
        var imgSource;
        var name = pkmn.name;
        var id = pkmn.id;
        var form = pkmn.form;
        var lowerName = name.toLowerCase();
        var spriteSet = '';
        //change this to toggle occasional anime sprites
        var animeSpritesOn = true;
//        console.log("Loading sprite for " + name);

        var animeIndex = -1;
        
        
        var idStr = i.toString();
        var longIdStr = idStr + idStr + idStr + idStr + idStr + idStr + idStr;
        var rand1 = Math.abs( utils.randWithSeed( matchHashStr + name.toUpperCase() + longIdStr ) );
        var rand2 = Math.abs( utils.randWithSeed( matchHashStr + lowerName + longIdStr ) );
        
        // occasionally select a pokemon position for anime sprite replacement
        if (rand1 % 7 === 1) {
            animeIndex = rand2 % 6;
        }
        
        var useMoemon = rand1 % 10 < 2;
        
        // 1 will be the default form
        // only considered by xy spriteset
        var activeSprite = 1;
//         only pick alt gif for pokemon with basic form
        if( form === 0 && !pkmn.shiny && gameData.ALT_GIF_SPRITES.ACTIVE[lowerName] ) {
//            console.log(pkmn.name + " has form === 0 " + (form === 0) + " and !shiny " + !pkmn.shiny);
            var activeSprites = utils.deepCopy(gameData.ALT_GIF_SPRITES.ACTIVE[lowerName]);
//            console.log(pkmn.name + " has active sprites: " + activeSprites);
            var activeSpriteIndex;
            if( pkmn.blankMatch ) {
//                console.log("Blank match- generating random index for active sprite");
                activeSpriteIndex = Math.floor( Math.random() * activeSprites.length );
            } else {
                var len = activeSprites.length;
                for( var j = 0; j < len * 3; j++ ) {
                    activeSprites.push(1);
                }
                activeSpriteIndex = rand2 % activeSprites.length;
            }
            
//            console.log("Picking index " + activeSpriteIndex + " in list " + activeSprites);
            activeSprite = activeSprites[activeSpriteIndex];
//            console.log("Result is: " + activeSprite);
        }

        if (!pkmn.blankMatch && animeSpritesOn && animeIndex === i) {
            spriteSet = 'anime';
        } else if(settings.animatedSprites) {
            spriteSet = 'xy';
        } else {
//            spriteSet = 'smogonFools';
//            spriteSet = 'gen5';
            spriteSet = 'sugimori';
        }
        
        
        
        // if a pokemon in unsupported by a sprite set, send it elsewhere
        switch(spriteSet) {
            case 'gen5':       
                if (id === '201' && 
                        (pkmn.formName === 'int' || pkmn.formName === 'ex')) {
                    spriteSet = 'sugimori';
                }
                break;
        }
        
        // just under half of the time
        if (useMoemon) {
            // force particular sprite sets for these pokemon
            switch(name) {
                case 'Koffing':
                case 'Togepi':
                case 'Rotom':
                case 'Pikachu':
                case 'Litten':
                    spriteSet = 'fun';
                    break;

                case 'Butterfree':
                case 'Beedrill':
                case 'Absol':
                case 'Octillery':
                case 'Machamp':
                case 'Mankey':
                case 'Medicham':
                case 'Ninetales':
                case 'Gyarados':
                case 'Ekans':
                case 'Sneasel':
                    spriteSet = 'moemon';
                    break;
            }
        }
        
        // all the time
        switch(name) {
            case 'Litten':
                spriteSet = 'fun';
                break;
        }
        
        // get the source url for the desired image
        switch(spriteSet) {
            case 'xy':
                imgSource = getXYSource(pkmn, name, lowerName, id, activeSprite, rand1);
                break;
            case 'sugimori':
                imgSource = getSugimoriSource(pkmn, name, lowerName, id);
                break;
            case 'gen5':
                imgSource = getGen5Source(pkmn, name, lowerName, id);
                break;
            case 'smogFools':
                imgSource = getSmogonFoolsSource(pkmn, name, lowerName, id);
                break;
            case 'fun':
                imgSource = getFunSource(pkmn, name, lowerName, id);
                break;
            case 'moemon':
                imgSource = getMoemonSource(pkmn, name, lowerName, id);
                break;
            case 'anime':
                imgSource = getAnimeSource(pkmn, name, lowerName, id);
                break;
        }

        var xoffsets = [-53, -182, -312];
        var yoffsets = [-712, -583, -455];
        
        if(layout === 'grid') {
            xoffsets = [-360 , -360, -360];
            yoffsets = [-672, -500, -318];
        }

        var imgId = layout + '-' + spriteSet + '-' + i + '-' + id + '-' + form + '-' + activeSprite;
        if (document.getElementById(imgId) === null) {
            var myImage = new Image();
            myImage.pkmnMatchIndex = i;
            myImage.pkmnSpriteSet = spriteSet;
            myImage.pkmnName = name;
            myImage.pkmnID = id;
            myImage.pkmnImgId = imgId;
            myImage.pkmnactiveSprite = activeSprite;

            myImage.onload = function () {
                var matchIndex = this.pkmnMatchIndex;
                var spriteSet = this.pkmnSpriteSet;
                var id = this.pkmnID;
                var activeSprite = this.pkmnactiveSprite;
                
                this.id = this.pkmnImgId;
                
                var imgHeight = this.height * .8;
                var imgWidth = this.width * .8;
                
                if (spriteSet === 'anime') {
                    imgHeight = 127 * .8;
                    imgWidth = 90 * .8;
                }
                
                //set x offset
                var xOffset;

                xOffset = Math.floor(-imgWidth / .8 / 2 + (matchIndex < 3 ? xoffsets[matchIndex] : -xoffsets[matchIndex - 3]));
                //fliers flap their wings way below their body, so move them down
                //how does this work so well lol
                var moveDown = Math.round(imgHeight - 100 > 0 ? (imgHeight - 92) / 2 : 0);
                //anchor small and large images to a floor where their feet rest
                var anchorToFloor = Math.round(imgHeight - 77);
                var yOffset = Math.round((matchIndex < 3 ? yoffsets[matchIndex] : yoffsets[matchIndex - 3]) - anchorToFloor + moveDown);

                //console.log("image " + this.src + " loaded.");
                
                var styleStr = '';
                
                // calucation to get proper offsets for pokemon locations in anime image
                 if (spriteSet === 'anime') {
                    //only unown have ids of zero
                    if (id === 0)
                        id = 201;
                    
                    //redirect kingdra to seadra
                    if (id === 230)
                        id = 117;
                    
                    //arceus is further down
                    if (id === 493)
                        id += 24;
                        
                    //kingdra missing
                    if (id > 230)
                        id -= 1;
                    
                    
                    //unown takes up many slots
                    if (id > 201)
                        id += 9;
                    
                    //since pokemon ids start at 1 instead of 0
                    id -= 1;
                    
                    //console.log(id);
                    
                    var row = Math.floor(id / 25);
                    var col = id % 25;
                    var rowOff = row * 127;
                    var colOff = col * 90;
                    //console.log(this.pkmnName + "\nrow: " + row + "rowOff: " + rowOff + "\ncol: " + col + "colOff: " + colOff); 
                    styleStr = "height: 127px; width: 90px; background: url(\"/img/pokemon/anime/all.png\") -" + colOff + "px -" + rowOff + "px; ";
                }
                
                styleStr += "position: absolute; ";
                var trans = "transform: ";
                var transMS = "-ms-transform: ";
                var transWebkit = "-webkit-transform: ";

                var flipX = ' ';

                /* flip sprites on the left */
                if (matchIndex < 3 && (id !== 201)) {
                    flipX = 'scaleX(-1)';
                }

                /* flip Granbull */
                switch(this.pkmnName) {
                    case 'Granbull':
                        if (matchIndex >= 3)
                            flipX = 'scaleX(-1)';
                        else
                            flipX = ' ';
                        break;
                }

                
                var scale = '';
                switch(spriteSet) {
                    case 'xy':
                        scale = 'scale(.8,.8) ';
                        if( activeSprite !== 1) {
                            if( this.pkmnName === 'Hitmontop' ) {
                                yOffset += 25;
                            } else {
                                yOffset -= 25;
                            }
                        }
                        switch(this.pkmnName) {
                            case 'Hitmontop':
                            //case 'Koffing':
                                flipX += 'scaleY(-1)';
                                break;
                            
//                            case 'Magikarp':
//                            case 'Mr. Mime':
//                            case 'Kirlia':
//                            case 'Psyduck':
//                            case 'Rotom':
//                            case 'Sableye':
//                            case 'Spinda':
//                            case 'Vaporeon':
//                            case 'Wailord':
                                // these pokemon with alternate animations require adjustment to their y offset
//                                yOffset -= 25;
//                                break;
        //                    case 'Shinx':
        //                    case 'Luxio':
        //                    case 'Luxray':
        //                        scale= ' ';
        //                        break;
                        }
                        break;
                    case 'gen5':
                        break;
                    case 'smogFools':
                        imgSource = getSmogonFoolsSource(pkmn, name, lowerName, id);
                        break;
                    case 'sugimori':
                        break;
                }   /* end switch over sprite sets */

                if (spriteSet === 'xy' && false) {   
                    trans += 'translate3d(' + xOffset + 'px, ' + yOffset + 'px, 1px) ';
                    transMS += 'translate3d(' + xOffset + 'px, ' + yOffset + 'px, 1px) ';
                    transWebkit += 'translate3d(' + xOffset + 'px, ' + yOffset + 'px, 1px) ';
                } else {
                    trans += 'translate(' + xOffset + 'px, ' + yOffset + 'px) ';
                    transMS += 'translate(' + xOffset + 'px, ' + yOffset + 'px) ';
                    transWebkit += 'translate(' + xOffset + 'px, ' + yOffset + 'px) ';
                }

                styleStr += trans + scale + flipX + ';';
                styleStr += transMS + scale + flipX + ';';
                styleStr += transWebkit + scale + flipX + ';';

                //this.style = styleStr;

                $("#container" + matchIndex).empty();
                $("#container" + matchIndex).append(this);
                $('#' + this.id).attr("style", styleStr);
            };
            myImage.src = imgSource;
        }
    }
    
    function getXYSource(pkmn, name, lowerName, id, activeSprite, rand1) {
        //tpp uses 'shellos' and 'shellos-east'
        //pkaraiso uses 'shellos' and 'shellos-east'
        //so the default lowerName is fine
        
        var baseUrl = "/img/pokemon/xy/";
        if (pkmn.shiny) {
            baseUrl = "/img/pokemon/xy-shiny/";
        }
        
        var srcName = lowerName;
        if (pkmn.form !== 0) {
            srcName += '-' + pkmn.formName;
        }
        
        if (lowerName === 'arceus' && pkmn.type1 !== 'normal') {
            srcName += '-' + pkmn.type1;
        }
        switch(name) {
            case "Farfetch'd":
                srcName = "farfetchd";
                break;
            case 'Mr. Mime':
                srcName = "mr._mime";
                break;
            case 'Mime Jr.':
                srcName = "mime_jr";
                break;
            case 'Flareon':
                //imgSource = baseUrl + "lampent.gif";
                break;
//            case 'Charizard':
//                imgSource = baseUrl + "fletchinder.gif";
//                break;
//            case 'Shinx':
//            case 'Luxio':
//            case 'Luxray':
//                imgSource = "/img/pokemon/fun/egg.gif";
//                break;
//            case 'Groudon':
//                imgSource = baseUrl + "groudon-primal.gif";
//                break;
//            case 'Kyogre':
//                imgSource = baseUrl + "kyogre-primal.gif";
//                break;
//            case 'Pikachu':
//            case 'Wobbuffet':
//            case 'Buttefree':
//            case 'Houndoom':
//            case 'Milotic':
//                imgSource = baseUrl + srcName + "-f.gif";
//                break;
        }
        
        // add alternate sprite to some pkmn
        
        if ( pkmn.setName.toLowerCase().indexOf("mega") !== -1 && 
                ( lowerName === 'charizard' || gameData.ALT_GIF_SPRITES.MEGA[lowerName]) ) {
            srcName += "-mega";
            if( lowerName === 'charizard' ) {
                if( rand1 % 100 < 50 )
                    srcName += 'x';
                else
                    srcName += 'y';
            }
        } else if ( pkmn.gender === "f" && gameData.ALT_GIF_SPRITES.FEMALE[lowerName] ) {
//            console.log("FEMALE " + lowerName);
            srcName += "-f";
        } else if( activeSprite !== 1 ) {
            srcName += '-' + activeSprite;
        }
        
        
        var imgSource = baseUrl + srcName + ".gif";

        
//        switch(name) {
//            case 'Vaporeon':
//                imgSource = imgSource.substring(0, imgSource.length - 4) + '-4.gif';
//                break;
//            case 'Kirlia':
//            case 'Sableye':
//                imgSource = imgSource.substring(0, imgSource.length - 4) + '-3.gif';
//                break;
//            case 'Magikarp':
//            case 'Psyduck':
//            case 'Spinda':
//            case 'Mr. Mime':
//            case 'Rotom':
//            case 'Wailord':
//                imgSource = imgSource.substring(0, imgSource.length - 4) + '-2.gif';
//                break;
//            case 'Venusaur':
//            case 'Blaziken':
//                imgSource = imgSource.substring(0, imgSource.length - 4) + '-mega.gif';
//                break;
//        }
        return imgSource;
    }
    
    function getSugimoriSource(pkmn, name, lowerName, id) {
//        var intId = parseInt(id);
//        var intLen = ("" + intId).length;
//        var sugimoriId = intId + '-' + id.substring(intLen);
        var baseUrl = "/img/pokemon/sugimori-custom-1/";
        var imgSource = baseUrl + id + ".png";
        switch(name) {
//                case 'Shinx':
//            case 'Luxio':
//            case 'Luxray':
//                imgSource = base + "403.png";
//                break;               
//            case 'Charizard':
//                imgSource = baseUrl + "662.png";
//                break;
        }
        return imgSource;
    }
    function getFunSource(pkmn, name, lowerName, id) {
        var imgSource;
        imgSource = "/img/pokemon/fun/" + lowerName + ".png";
        return imgSource;
    }
    
    
    function getMoemonSource(pkmn, name, lowerName, id) {
        var imgSource;
        imgSource = "/img/pokemon/moemon/" + lowerName + ".png";
        return imgSource;
    }
    
    function getAnimeSource(pkmn, name, lowerName, id) {
        var imgSource;
        imgSource = "/img/pokemon/trans.png";
        return imgSource;
    }
    
    function getGen5Source(pkmn, name, lowerName, id) {     
        //tpp uses 'shellos' and 'shellos-east'
        //pokemondb uses 'shellos-west' and 'shellos-east'
        var baseUrl = "http://img.pokemondb.net/sprites/black-white/normal/";
        var imgSource = baseUrl + lowerName + ".png";
        switch(name) {
            case 'Mr. Mime':
                imgSource = baseUrl + "mr-mime.png";
                break;
            case 'Mime Jr.':
                imgSource = baseUrl + "mime-jr.png";
                break;
            case 'Shellos':
                imgSource = baseUrl + "shellos-west.png";
                break;
            case 'Gastrodon':
                imgSource = baseUrl + "gastrodon-west.png";
                break;
            case 'Nidoran-male':
                imgSource = baseUrl + "nidoran-m.png";
                break;
            case 'Nidoran-female':
                imgSource = baseUrl + "nidoran-f.png";
                break;
//            case 'Charizard':
//                imgSource = baseUrl + "fletchinder.png";
//                break;
            case 'Unown-?':
                imgSource = baseUrl + "int.png";
                break;
            case 'Unown-?':
                imgSource = baseUrl + "ex.png";
                break;
        }
        if (pkmn.shiny) {
            imgSource = "http://img.pokemondb.net/sprites/black-white/shiny/" + lowerName.substring(0, lowerName.length - 6) + ".png";
        }
        return imgSource;   
    }    
    
    function getSmogonFoolsSource(pkmn, name, lowerName, id) {
        imgSource = "/img/pokemon/smogFools/" + lowerName + ".png";
        switch(name) {
            case "Farfetch'd":
                imgSource = "/img/pokemon/smogFools/farfetchd.png";
                break;
            case 'Mr. Mime':
                imgSource = "/img/pokemon/smogFools/mrmime.png";
                break;
            case 'Mime Jr.':
                imgSource = "/img/pokemon/smogFools/mimejr.png";
                break;
//                case 'Shinx':
//            case 'Luxio':
//            case 'Luxray':
//                imgSource = "/img/pokemon/smogFools/shinx.png";
//                break;               
        }
        return imgSource;
    }
    
    
    
   return loadPkmnSprite; 
});