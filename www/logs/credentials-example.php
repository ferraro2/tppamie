<?php

    define("LOCAL", 1);
    define("DEBUG", 1);
    
    if (LOCAL) {
        define("MYSQL_USER", "root");
        define("MYSQL_PASS", "mysql");
        define("SITE", "http://localhost/logs/");
    } else {
        define("MYSQL_USER", "");
        define("MYSQL_PASS", "");
        define("SITE", "https://www.tppamie.com/logs/");
    }
?>