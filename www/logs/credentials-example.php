<?php
   if (LOCAL) {
        define("MYSQL_USER", "root");
        define("MYSQL_PASS", "mysql");
        
    } else {
        define("MYSQL_USER", "");
        define("MYSQL_PASS", "");
    }
?>