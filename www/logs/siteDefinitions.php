<?php
    /*
     * Cast results from string to the appropriate value, eg. int or bool
     * Depending on the server side setup, supposedly this might not be necessary
     */
    $CAST_MYSQL_RESULTS = True;

    /*
     * Error reporting should be already set by php.ini
     */
    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    define("DEBUG", 1);
    
    define("LOCAL", 1);
    if (LOCAL) {
        define("SITE", "http://localhost/logs/");
        
    } else {
        define("SITE", "http://www.tppvisuals.com/logs/");

        define("SPHINX_USER", "dhason");
    }

    include 'credentials.php';

    /*
     * Number of results, and
     * jump id offset (if jump id is specified, this says how many messages before the jump can be shown)
     * E.g. with LIMIT 200 and JUMP_OFFSET 50, if you click on an individual message, it'll take you to a page showing
     * the 50 messages immediately prior to the individual message, and the 150 immediately messages after it.
     */
    define("LIMIT", 350);
    define("JUMP_OFFSET", 130);
?>