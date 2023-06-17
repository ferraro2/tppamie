<?php
    /***********************************************************
     ***********************************************************
     *      QUERY PARSING FUNCTIONS
     ***********************************************************
     ***********************************************************/

    define("DATE_SANITIZE", "/[^a-zA-Z0-9\-_:\s\\/,\+\.]/");
    define("USER_SANITIZE", "/[^a-zA-Z0-9_ !]/");
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
        $date_str = !isset($_GET[$param_name]) || gettype($_GET[$param_name]) !== 'string'
               ? ''
               : preg_replace(DATE_SANITIZE, " ", $_GET[$param_name]);
        // Translate "2016" to "2016-01-01"
        if (substr($date_str, 0, 2) === "20" 
                && strlen($date_str) === 4) {
            $date_str .= "-01-01";
        }
//        echo "<br>param '$param_name':$date<br>";
        $date_mysql = mysqlDateFromUrlDate($date_str);
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
    
    function getNullableDTIFromSphinxDate($sphinx_date) {
//        echo "<br>";
//        echo strval($sphinx);
//        echo "<br>";
        // dunno if this conversion is needed
        if ($sphinx_date === 0) {
            return null;
        }
        $nicer_sphinx = '20' . 
                substr($sphinx_date, 0, 2) . '-' . 
                substr($sphinx_date, 2, 2) . '-' . 
                substr($sphinx_date, 4, 2) . ' ' . 
                substr($sphinx_date, 6, 2) . ':' . 
                substr($sphinx_date, 8, 2) . ':' . 
                substr($sphinx_date, 10, 2) . '.' . 
                substr($sphinx_date, 12, 6);
//        echo "<$nicer_sphinx>";
        return new DateTimeImmutable($nicer_sphinx);
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
    
    function getMysqlDateNoUSFromNullableDTI($dti) {
        if ($dti == null) {
            return "";
        }
        return $dti->format("Y-m-d H\:i\:s");
    }
    
    function getSphinxDateFromNullableDTI($dti) {
        if ($dti == null) {
            return "";
        }
        return intval($dti->format("ymdHisu"));
    }

    function getParsedUrl() {
       $url = "http://".$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']; 
       return parse_url($url);
    }
    
    // node url might be user-provided
    function mysqlDateFromUrlDate($date) {
        return preg_replace("/\+/", " ", preg_replace("/_/", "/", $date));
    }
    
    function urlDateFromMysqlDate($date) {
        return preg_replace("/ /", "+", $date);
    }
    
    function getReverseDisplaySortUrl($query_flags) {
       $url = SITE;
       $query = $_SERVER['QUERY_STRING'];
       parse_str($query, $query_arr);
//       echo var_dump($query);
//       echo "<br>";
//       echo $url;
       
        foreach(array("from", "to", "id") as $param_name) {
            if (isset($query_arr[$param_name])) {
                $url .= "$param_name/" . 
                        urlDateFromMysqlDate($query_arr[$param_name]). "/";
            } 
            unset($query_arr[$param_name]);
        }
       unset($query_arr['date']);
       
       // unset all flags, 
       // and set them again for those not equal to their default value
       foreach (get_object_vars($query_flags) as $query_flag) {
           // flip sort flag
           if($query_flag->name == 'sort') {
               $val = !$query_flag->val;  
           } else {
               $val = $query_flag->val;
           }
           
           if ($val === $query_flag->default) {
               unset($query_arr[$query_flag->name]);
           } else {
            $query_arr[$query_flag->name] = $val;
           }
       }
       
       $result_query = http_build_query($query_arr);
       return $url . ($result_query !== '' ? "?$result_query" : "");
        
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
    function getRedactedQuery($query_flags, $options_only=False,
            $reverse_sort=False) {
       $query = $_SERVER['QUERY_STRING'];
       parse_str($query, $query_arr);
       //var_dump($query_arr);
       unset($query_arr['date']);
       unset($query_arr['from']);
       unset($query_arr['to']);
       unset($query_arr['id']);
       unset($query_arr['dir']);
       
       // unset all flags, 
       // and set them again for those not equal to their default value
       foreach (get_object_vars($query_flags) as $query_flag) {
           // reverse sort if requested
           if($reverse_sort && $query_flag->name == 'sort') {
               $val = $query_flag->val == '1' ? '0' : '1';
           } else {
               $val = $query_flag->val;
           }
           
           if ($val === $query_flag->default) {
               unset($query_arr[$query_flag->name]);
           } else {
            $query_arr[$query_flag->name] = $val;
           }
       }
       
       if ($options_only) {
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
?>