<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>TPP Chat Logs</title>
<link rel="stylesheet" href="/css/logs.css" />
<meta property="og:description" content="Searchable chat logs for Twitch Plays Pokemon."/>
<meta name="description" content="Searchable chat logs for Twitch Plays Pokemon."/>
<meta property="og:image" content="/img/friendball.png" />
<link rel="shortcut icon" href="/img/friendball.png" />
<link rel="icon" sizes='42x42' href="/img/friendball.png" />

</head>

<?php

    /*
    * include constants, etc
    */
    include "siteDefinitions.php";


    echo "
    <body>
        <div class=\"leftBorder\"> </div>
        <div class=\"mainPage\">
        <!----------------------------------------------------------
         ------------------------------------------------------------
         --------    TOP BANNER
         ------------------------------------------------------------
         ------------------------------------------------------------>

        <a class=\"banner\" href=\"" . SITE . "\">
        <!--        <img alt = '' src='../img/chatBanner.png'/>-->
        <img alt = '' src='/img/pokemon/xy/unown-t.gif'/>
        <img alt = '' src='/img/pokemon/xy/unown-p.gif'/>
        <img alt = '' src='/img/pokemon/xy/unown-p.gif'/>
        <img alt = '' class='xflip' src='/img/pokemon/xy/chatot.gif'/>
        <img alt = '' src='/img/pokemon/xy/unown-l.gif'/>
        <img alt = '' src='/img/pokemon/xy/unown-o.gif'/>
        <img alt = '' src='/img/pokemon/xy/unown-g.gif'/>
        <img alt = '' src='/img/pokemon/xy/unown-s.gif'/>
    <!--
        <img style=\"margin:0px -29px;\" alt = '' src='http://img.pokemondb.net/sprites/black-white/normal/unown-t.png'/>
        <img style=\"margin:0px -29px;\" alt = '' src='http://img.pokemondb.net/sprites/black-white/normal/unown-p.png'/>
        <img style=\"margin:0px -29px;\" alt = '' src='http://img.pokemondb.net/sprites/black-white/normal/unown-p.png'/>
        <img style=\"margin:0px -20px;\" alt = '' class='xflip' src='http://img.pokemondb.net/sprites/black-white/normal/chatot.png'/>
        <img style=\"margin:0px -29px;\" alt = '' src='http://img.pokemondb.net/sprites/black-white/normal/unown-l.png'/>
        <img style=\"margin:0px -29px;\" alt = '' src='http://img.pokemondb.net/sprites/black-white/normal/unown-o.png'/>
        <img style=\"margin:0px -29px;\" alt = '' src='http://img.pokemondb.net/sprites/black-white/normal/unown-g.png'/>
        <img style=\"margin:0px -29px;\" alt = '' src='http://img.pokemondb.net/sprites/black-white/normal/unown-s.png'/> -->
    </a>
    ";

    /*
     * Parse user input
     * Include functions useful for parsing
     * 
     * May redirect to a corrected URL
     */
    include 'parse.php';


    /*
     * Execute the query and return results
     */
    include 'query.php';

    /*
     * display the search form
     */
    include 'searchForm.php';

?>
     
    <div id="js-searchResults" class="searchResults">
<?php 

    /*
     * display the query results
     */
    include 'displayResults.php';

    echo "
        </div>
        <div id=\"bottom\"></div>

        <!----------------------------------------------------------
        ------------------------------------------------------------
        --------    PAGE FOOTER
        ------------------------------------------------------------
        ------------------------------------------------------------>
        <a class=\"banner\" href=\"" . SITE . "\" >
            <img src='/img/pokemon/xy/magikarp.gif'/>
            <img src='/img/pokemon/xy/magikarp.gif'/>
            <img src='/img/pokemon/xy-shiny/magikarp.gif'/>
            <img src='/img/pokemon/xy/magikarp.gif'/>
            <img src='/img/pokemon/xy/magikarp.gif'/>
            <img src='/img/pokemon/xy/magikarp.gif'/>
            <img src='/img/pokemon/xy/magikarp.gif'/>
        </a>

    </div>
    <div class=\"leftBorder\"> </div>
    <script data-main=\"/js/logs_main_1.2.0\" src=\"/js/require.js\"></script>
    \"
    "
    
?>
        
</body>
</html>
