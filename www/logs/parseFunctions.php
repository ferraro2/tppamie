<?php
    /***********************************************************
     ***********************************************************
     *      QUERY PARSING FUNCTIONS
     ***********************************************************
     ***********************************************************/

    /*
     * Returns the value of the parameter, as a lightly sanitized string.
     */
    function getDateParam($name) {
//        var_dump($_SERVER);
//        echo "<br><br>";
//        var_dump($_GET);
//        echo "<br>param '$name' set:" . isset($_GET[$name]). "<br>";
//        echo "<br>param '$name' type:" . gettype($_GET[$name]) . "<br>";
        $date = !isset($_GET[$name]) || gettype($_GET[$name]) !== 'string'
               ? ''
               : preg_replace(DATE_SANITIZE, " ", $_GET[$name]);
        
//        echo "<br>param '$name':$date<br>";
        $decoded_date = htmlDecodeDate($date);
//        echo "<br>param '$name':$date<br>";
//        exit();
        return $decoded_date;
     }

    function getMysqlDate($name) {
        $date = getDateParam($name);
        return getMysqlFormattedDate($date);
    }

    function getMysqlFormattedDate($date) {
       return getFormattedDate("Y-m-d H\:i\:s", $date);
    }

    /*
     * If the date contains a string parsable as a valid date, 
     *  returns (mysql-formatted string, corresponding unix time, date)
     * 
     * Otherwise returns ("", 0, date)
     */
    function getFormattedDate($format, $date) {
       $date_unix = strtotime($date);
       if ($date_unix !== false && $date_unix !== -1) {
           return [date($format, $date_unix), $date_unix, $date];
       } else {
           return ["", 0, $date];
       }
    }

    function getParsedUrl() {
       $url = "http://".$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']; 
       return parse_url($url);
    }

    function htmlDecodeDate($date) {
        return preg_replace("/\+/", " ", $date);
    }
    
    function htmlEncodeMysqlDate($date) {
        return preg_replace("/ /", "+", $date);
    }

    /*
     * Return full Url path, stripped of certain vars
     * 
     * Currently used for prev / next links
     */
    function getTrimmedQuery($optionsOnly=False) {
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
       unset($query_arr['sort']);
       if ($optionsOnly) {
           unset($query_arr['q1']);
           unset($query_arr['q2']);
           unset($query_arr['q3']);
           unset($query_arr['u1']);
           unset($query_arr['u2']);
           unset($query_arr['u3']);
       }
       
       return http_build_query($query_arr);
    } 
?>