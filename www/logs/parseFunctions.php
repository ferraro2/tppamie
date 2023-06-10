<?php
    /***********************************************************
     ***********************************************************
     *      QUERY PARSING FUNCTIONS
     ***********************************************************
     ***********************************************************/

    define("DATE_SANITIZE", "/[^a-zA-Z0-9\-:\s\\/,\+\.]/");
    define("USER_SANITIZE", "/[^a-zA-Z0-9_ ]/");
    define("ID_SANITIZE", "/[^0-9]/");

    /*
     * Returns the value of the parameter, as a lightly sanitized string.
     */
    function getDateParam($param_name) {
//        var_dump($_SERVER);
//        echo "<br><br>";
//        var_dump($_GET);
//        echo "<br>param '$param_name' set:" . isset($_GET[$param_name]). "<br>";
//        echo "<br>param '$param_name' type:" . gettype($_GET[$param_name]) . "<br>";
        $date_html = !isset($_GET[$param_name]) || gettype($_GET[$param_name]) !== 'string'
               ? ''
               : preg_replace(DATE_SANITIZE, " ", $_GET[$param_name]);
        
//        echo "<br>param '$param_name':$date<br>";
        $date_mysql = mysqlDateFromUrlDate($date_html);
//        echo "<br>param '$param_name':$date<br>";
//        exit();
        return $date_mysql;
     }

    /*
     * If the date contains a string parsable as a valid date, 
     *  returns (mysql-formatted string, sphinx-formatted string, html-formatted string)
     * 
     * Otherwise returns ("", 0, date)
     */
    function getNullableDTIFromDateParam($param_name) {
        $date_mysql = getDateParam($param_name);
        if ($date_mysql == "") {
            return null;
        }
        try {
            return new DateTimeImmutable($date_mysql);
        }catch(Exception $e) {
            return null;
        }
    } 
    
    function getUrlDateFromNullableDTI($dti) {
        if ($dti == null) {
            return "";
        }
        return $dti->format("Y-m-d+H\:i\:s.u");
    }
    
    function getMysqlDateFromNullableDTI($dti) {
        if ($dti == null) {
            return "";
        }
        return $dti->format("Y-m-d H\:i\:s.u");
    }
    
    function getSphinxDateFromNullableDTI($dti) {
        if ($dti == null) {
            return "";
        }
        return $dti->format("Y-m-d H\:i\:s.u");
    }

    function getParsedUrl() {
       $url = "http://".$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']; 
       return parse_url($url);
    }

    function mysqlDateFromUrlDate($date) {
        return preg_replace("/\+/", " ", $date);
    }
    
    function urlDateFromMysqlDate($date) {
        return preg_replace("/ /", "+", $date);
    }

    /*
     * Return url query stripped of date params
     * 
     * used in redirecting *.com/?to=2014-....&... to *.com/to/2014-../?...
     * 
     * If $flagsOnly:
     * Further trim the query of msg/user search params, leaving only the 
     * checkbox flags.
     * Used for jump/header links
     */
    function getReplacementQuery($query_flags, $flagsOnly=False) {
    //        $parsed_url = getParsedUrl();
    //        echo "<br>";
    //        var_dump($parsed_url);
    //        echo "<br>";
    //        $scheme   = isset($parsed_url['scheme']) ? $parsed_url['scheme'] . '://' : '';
    //        $host     = isset($parsed_url['host']) ? $parsed_url['host'] : '';
    //        $port     = isset($parsed_url['port']) ? ':' . $parsed_url['port'] : '';
    //        $user     = isset($parsed_url['user']) ? $parsed_url['user'] : '';
    //        $pass     = isset($parsed_url['pass']) ? ':' . $parsed_url['pass']  : '';
    //        $pass     = ($user || $pass) ? "$pass@" : '';
    //        $path     = isset($parsed_url['path']) ? $parsed_url['path'] : '';
    //        $query    = isset($parsed_url['query']) ? '?' . $parsed_url['query'] : '';
    //        $fragment = isset($parsed_url['fragment']) ? '#' . $parsed_url['fragment'] : '';
    //        
    //        
    //        var_dump($query);
    //        echo "<br>";
       $query = $_SERVER['QUERY_STRING'];
       parse_str($query, $query_arr);
       //var_dump($query_arr);
       unset($query_arr['date']);
       unset($query_arr['from']);
       unset($query_arr['to']);
       unset($query_arr['dateRadio']);
       
       // unset all flags, 
       // and set them again for those not equal to their default value
       foreach (get_object_vars($query_flags) as $query_flag) {
           if ($query_flag->val === $query_flag->default) {
               unset($query_arr[$query_flag->name]);
           } else {
               $query_arr[$query_flag->name] = $query_flag->val;
           }
       }
       
       if ($flagsOnly) {
           unset($query_arr['q1']);
           unset($query_arr['q2']);
           unset($query_arr['q3']);
           unset($query_arr['u1']);
           unset($query_arr['u2']);
           unset($query_arr['u3']);
       }
       $result_query = http_build_query($query_arr);
       return $result_query !== '' ? "?$result_query" : "";
    } 
?>