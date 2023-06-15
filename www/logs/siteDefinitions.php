<?php
    /*
     * Cast results from string to the appropriate value, eg. int or bool
     * Depending on the server side setup, supposedly this might not be necessary
     */
    $CAST_MYSQL_RESULTS = True;

    include 'credentials.php';

    if (LOCAL) {
        error_reporting(E_ALL);
        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        ini_set('html_errors', 1);
        ini_set('log_errors', 1);
        define("DEBUG", 1);
    } else {
        error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
        ini_set('display_errors', 0);
        ini_set('display_startup_errors', 0);
        ini_set('html_errors', 1);
        ini_set('log_errors', 1);
        define("DEBUG", 0);
    }

    /*
     * Number of results, and
     * jump id offset (if jump id is specified, this says how many messages before the jump can be shown)
     * E.g. with LIMIT 200 and JUMP_OFFSET 50, if you click on an individual message, it'll take you to a page showing
     * the 50 messages immediately prior to the individual message, and the 150 immediately messages after it.
     */
    define("LIMIT", 350);
    define("JUMP_OFFSET", 130);
?>