<?php

    /*
     * PDO and display functions
     */
    include 'queryFunctions.php';
    
    /*
        ---------------------------------
                NO QUERY
        ---------------------------------

        Get results:
                $inner_ordered_range

        Set prev/next links
                (none)

        ---------------------------------
                YES QUERY
        ---------------------------------

        Get result IDs (sphinx):
                $inner_ordered_range

        Get results (mysql)"
                $outer_sort

        Set prev/next links
                $outer_sort_asc 
     */
    
    /***********************************************************
     ***********************************************************
     *      QUERY NOT PRESENT - MYSQL ONLY
     ***********************************************************
     ***********************************************************/
    if (!$query_present) {
        
        /*
         * Open mysql connection
         */

        $mysql_config = [
            "username" => MYSQL_USER,   
            "password" => MYSQL_PASS, 
            "hostname" => "localhost", 
            "database" => "tpp_chat", 
        ];
        
        list($had_results, $valid_query, $min_tstamp, $max_tstamp, 
                $results, $prev_results_exist, $next_results_exist) = 
                mysqlQuery($mysql_config, $jump_id, $inner_tstamp_range_filter,
                        $inner_tstamp_sort, $msg_flags_filter, 
                        $display_tstamp_sort);
        
        /*
         * Write in meta info
         */
        if($had_results) {
            $min_tstamp_unix = strtotime($min_tstamp);
            $max_tstamp_unix = strtotime($max_tstamp);
            $max_tstamp_inc = date("Y-m-d H\:i\:s", $max_tstamp_unix + 1);
            
            $meta_info = "Browsing All Logs<br>&nbsp&nbsp"
                    . date("M jS Y\, g\:i a", $min_tstamp_unix) . " - <br>"
                    . date("M jS Y\, g\:i a", $max_tstamp_unix) . "   ";
//            $meta_info .= $flag_display_sort_asc
//                    ? "<br><span class=\"alert\">Chronological order.</span>"
//                    : "<br><span class=\"alert\">Reverse chronological order.</span>";
        } else {
            $meta_info = "";
            if($from_date !== '') {
                $meta_info .= "Browsing logs after:<br> $from_date";
            } else if($to_date !== '') {
                $meta_info .= "Browsing logs before $to_date";
            }
        }
        
        /*
         * Set prev & next link targets
         */
        if ($prev_results_exist) {
            $PREV_BUTTON_CLASS = "resultsLink";
            $PREV_LINK = SITE . "to/"
                    . htmlEncodeMysqlDate($min_tstamp)
                    . "/$options_only_query#";
            if ($flag_display_sort_asc) {
                $PREV_LINK_TOP = $PREV_LINK . "bottom";
                $PREV_LINK_BOTTOM = $PREV_LINK . "bottom";
            } else {
                $PREV_LINK_TOP = $PREV_LINK . "top";
                $PREV_LINK_BOTTOM = $PREV_LINK . "top";
            }

            
        } else {
            $PREV_BUTTON_CLASS = "noResultsLink";
            $PREV_LINK_TOP = "";
            $PREV_LINK_BOTTOM = "";
        }

        if ($next_results_exist) {
            $NEXT_BUTTON_CLASS = "resultsLink";
            $NEXT_LINK = SITE . "from/"
                    . htmlEncodeMysqlDate($max_tstamp_inc) 
                    . "/$options_only_query#";
            if ($flag_display_sort_asc) {
                $NEXT_LINK_TOP = $NEXT_LINK . "top";
                $NEXT_LINK_BOTTOM = $NEXT_LINK . "top";
            } else {
                $NEXT_LINK_TOP = $NEXT_LINK . "bottom";
                $NEXT_LINK_BOTTOM = $NEXT_LINK . "bottom";
            }
        } else {
            $NEXT_BUTTON_CLASS = "noResultsLink";
            $NEXT_LINK_TOP = "";
            $NEXT_LINK_BOTTOM = "";
        }
        
        /*
         * End: QUERY NOT PRESENT - MYSQL ONLY
         */
    }

     /***********************************************************
     ***********************************************************
     *      SEARCH - QUERY IS PRESENT
     ***********************************************************
     ***********************************************************/
    
    else {
        /*
         * get Match query from params
         */
        $sphinx_match_query = getMatchQuery($q1, $q2, $q3, $u1, $u2, $u3);
        //$sphinx_match_query = "(@msg (\\@z33k33))";
        //echo "Sphinx Match Query: $sphinx_match_query<br>";
        /*
        * sphinx doesn't take a username or password, just the hostname
        */
        $hostname = "localhost"; 
        list($had_results, $valid_query, $min_tstamp_unix, $max_tstamp_unix,
                $msg_ids, $meta, $prev_results_exist, $next_results_exist)
                = sphinxQuery($hostname, $sphinx_match_query, $inner_tstamp_sort);
        
        /***********************************************************
         *   DUMP RESULTS, PREPARE MYSQL QUERY
         ***********************************************************/

        
        
        if ( $had_results ) {
            $min_tstamp = date("Y-m-d H\:i\:s", $min_tstamp_unix);
            $max_tstamp = date("Y-m-d H\:i\:s", $max_tstamp_unix);
            $max_tstamp_inc = date("Y-m-d H\:i\:s", $max_tstamp_unix + 1);
            
            // extract and cast some meta fields
            $search_duration = floatval($meta['time']);
            $total_found = (int)($meta['total_found']);
            $total = (int) $meta['total'];

            
            /*
             * Else, query mysql with the results
             * 
             * Our prepared statement will look something like:
             * <... m.msg_id IN (?, ?, ?, ?, ...) ...>
             * with hundreds of parameters, one for each msg_id
             */
            $BLANK_IN_PARAMS = implode(',', array_fill(0, count($msg_ids), '?'));


            /***********************************************************
             ***********************************************************
             *      CONNECT TO MYSQL
             ***********************************************************
             ***********************************************************/

           $hostname = "localhost"; 

           try {
               $pdo = new PDO("mysql:host=$hostname;dbname=tpp_chat;charset=utf8mb4", MYSQL_USER, MYSQL_PASS);
               // set the PDO error mode to exception
               $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                /* Here, we are using a MySQL IN clause to pull the movie_id, title, and synopsis from the DB for display. */
                $all_msg_query = "SELECT username, md.color as color, moder, sub, turbo, "
                        . "m.msg_id, tstamp, has_unwhitelisted_chars, is_action, emote_locs, msg, video_id, "
                        . "video_offset_seconds "
                        . "FROM users as u, messages as m, msg_data as md "
                        . "WHERE u.user_id = m.user_id AND m.msg_id = md.msg_id "
                        . "AND has_unwhitelisted_chars = 1 "
                        . "AND m.msg_id IN ($BLANK_IN_PARAMS) "
                        . "ORDER BY tstamp $str_display_sort_asc ";
                $all_msg_result = $pdo->prepare($all_msg_query);
                $all_msg_result->execute( $msg_ids );

                $pdo = null;
            } catch(PDOException $e) {
                if (DEBUG) {
                    echo "Connection failed: " . $e->getMessage();
                }
            }

            /**********************************************************
             *      DUMP RESULTS
             ***********************************************************/

            $results = [];
            #echo "<br>" . var_dump($all_msg_result) . "<br>";
            while ($msg_obj = $all_msg_result->fetchObject()) {
                #echo "ID:".$qresult->msg_id;
                $results[$msg_obj->msg_id] = $msg_obj;
            }

            $total_found_str = number_format($total_found);
            
            $meta_info = "$total_found_str hits ($search_duration seconds)<br>"
                    . "&nbsp&nbsp" . date("M jS Y\, g\:i a", $min_tstamp_unix) . " - <br>"
                    . date("M jS Y\, g\:i a", $max_tstamp_unix) . "   ";
                    
//            $meta_info .= $flag_display_sort_asc
//                    ? "<br><span class=\"alert\">Chronological order.</span>"
//                    : "<br><span class=\"alert\">Reverse chronological order.</span>";

        } else {
            //search did not have results
            $meta_info = "";
            if ($valid_query) {
                /* print some meta info about the query */
                if($from_date !== '') {
                    $meta_info .= "Searched after:<br> $from_date";
                } else if($to_date !== '') {
                    $meta_info .= "Searched before $to_date";
                }
            } else {
                $meta_info .= "<span class=\"warning\">"
                    . "Invalid query.  Remove special characters and submit your query again."
                        ."</span>";
            }
        }
        
        
        if ($prev_results_exist) {
            $PREV_LINK = SITE . "to/"
                    . htmlEncodeMysqlDate($min_tstamp) . "/?$trimmed_query";
            $PREV_LINK .= $flag_display_sort_asc ? "#bottom" : "&sort=latest#top";
            
            $PREV_BUTTON_CLASS = "resultsLink";
        } else {
            $PREV_LINK = "";
            $PREV_BUTTON_CLASS = "noResultsLink";
        }
        
        if($next_results_exist) {
            $NEXT_LINK = SITE . "from/"
                    . htmlEncodeMysqlDate($max_tstamp_inc) . "/?$trimmed_query";
            $NEXT_LINK .= $flag_display_sort_asc ? "#top" : "&sort=latest#bottom";
            
            $NEXT_BUTTON_CLASS = "resultsLink";
        } else {
            $NEXT_LINK = "";
            $NEXT_BUTTON_CLASS = "noResultsLink";
        }
    }
?>