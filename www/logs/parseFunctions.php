<?php
    /***********************************************************
     ***********************************************************
     *      QUERY PARSING FUNCTIONS
     ***********************************************************
     ***********************************************************/

//    function parseFlagStrParamAndAppendToQueryStr(
//            $param_name, $default, & $query_list) {
//        list($value, $query) = parseFlagStrParam($param_name, $default);
//        array_push($query_list, $query);
//        return $value;
//    }


    

    /*
     * Returns the value of the parameter, as a lightly sanitized string.
     */
    function getDateParam($param_name) {
//        var_dump($_SERVER);
//        echo "<br><br>";
//        var_dump($_GET);
//        echo "<br>param '$param_name' set:" . isset($_GET[$param_name]). "<br>";
//        echo "<br>param '$param_name' type:" . gettype($_GET[$param_name]) . "<br>";
        $date = !isset($_GET[$param_name]) || gettype($_GET[$param_name]) !== 'string'
               ? ''
               : preg_replace(DATE_SANITIZE, " ", $_GET[$param_name]);
        
//        echo "<br>param '$param_name':$date<br>";
        $decoded_date = htmlDecodeDate($date);
//        echo "<br>param '$param_name':$date<br>";
//        exit();
        return $decoded_date;
     }

    function getMysqlDate($param_name) {
        $date = getDateParam($param_name);
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
     * Return url query stripped of date params, for prev / next links
     * 
     * If $flagsOnly:
     * Further trim the query of msg/user/id params, leaving only the 
     * checkbox flags.
     * Used for jump/header links
     */
    function getTrimmedQuery($query_flags, $flagsOnly=False) {
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
           unset($query_arr['id']);
       }
       
       return http_build_query($query_arr);
    } 
?>