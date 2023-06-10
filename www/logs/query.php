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
        
        list($had_results, $query_was_valid, $min_tstamp_mysql, $max_tstamp_mysql, 
                $results, $prev_results_exist, $next_results_exist) = 
                mysqlQuery($mysql_config, $jump_id, $fetch_tstamp_range_filter,
                        $fetch_tstamp_sort, $msg_flags_filter, 
                        $display_tstamp_sort);
        
        /*
         * Write in meta info
         */
        if($had_results) {
            $min_tstamp_DTI = new DateTimeImmutable($min_tstamp_mysql);
            $max_tstamp_DTI = new DateTimeImmutable($max_tstamp_mysql);
            $min_tstamp_url_sub1us = getUrlDateFromNullableDTI(
                    $min_tstamp_DTI->modify("-1 microsecond"));
            $max_tstamp_url_plus1us = getUrlDateFromNullableDTI(
                    $max_tstamp_DTI->modify("+1 microsecond"));
            
            $meta_info = "Browsing All Logs<br>&nbsp&nbsp"
                    . $min_tstamp_DTI->format("M jS Y\, g\:i a") . " - <br>"
                    . $max_tstamp_DTI->format("M jS Y\, g\:i a") . "   ";
//            $meta_info .= $flag_display_sort_asc
//                    ? "<br><span class=\"alert\">Chronological order.</span>"
//                    : "<br><span class=\"alert\">Reverse chronological order.</span>";
        } else {
            $meta_info = "";
            if($from_date) {
                $meta_info .= "Browsing logs after:<br> $from_date_mysql";
            } else if($to_date) {
                $meta_info .= "Browsing logs before $to_date_mysql";
            }
        }
        
        /*
         * Set prev & next link targets
         */
        if ($prev_results_exist) {
            $PREV_BUTTON_CLASS = "resultsLink";
            $PREV_LINK = SITE . "to/"
                    . $min_tstamp_url_sub1us
                    . "/$flags_only_query#";
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
                    . $max_tstamp_url_plus1us
                    . "/$flags_only_query#";
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
        list($had_results, $query_was_valid, $min_tstamp_mysql, $max_tstamp_mysql,
                $msg_ids, $meta, $prev_results_exist, $next_results_exist)
                = sphinxQuery($hostname, $sphinx_match_query, $fetch_tstamp_sort);
        
        /***********************************************************
         *   DUMP RESULTS, PREPARE MYSQL QUERY
         ***********************************************************/

        if ( $had_results ) {
            $min_tstamp_DTI = new DateTimeImmutable($min_tstamp_mysql);
            $max_tstamp_DTI = new DateTimeImmutable($max_tstamp_mysql);
            $min_tstamp_url_sub1us = getUrlDateFromNullableDTI(
                    $min_tstamp_DTI->modify("-1 microsecond"));
            $max_tstamp_url_plus1us = getUrlDateFromNullableDTI(
                    $max_tstamp_DTI->modify("+1 microsecond"));
            
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
               $pdo = new PDO("mysql:host=$hostname;dbname=tpp_chat;charset=utf8mb4", 
                       MYSQL_USER, MYSQL_PASS);
               // set the PDO error mode to exception
               $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                $all_msg_query = "SELECT username, md.color as color, moder, sub, turbo, "
                        . " m.msg_id, tstamp, is_action, emote_locs, msg, video_id, "
                        . " video_offset_seconds, md.display_name as display_name, "
                        . " GROUP_CONCAT(badge_id ORDER BY pos asc) as badge_ids,"
                        . " GROUP_CONCAT(title ORDER BY pos asc) as badge_titles, "
                        . " GROUP_CONCAT(url_id ORDER BY pos asc) as badge_url_ids "
                        . " FROM users u join messages m using(user_id) "
                        . " join msg_data md using(msg_id) "
                        . " left join msg_badges using(msg_id) "
                        . " left join badges using(badge_id)"
                        . " WHERE m.msg_id IN ($BLANK_IN_PARAMS) "
                        . " GROUP BY username, md.color, moder, sub, turbo, md.msg_id, "
                        . " tstamp, is_action, emote_locs, msg, video_id, "
                        . " video_offset_seconds, md.display_name "
                        . " $display_tstamp_sort ";
//                echo "<br>$all_msg_query<br>";
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
                    . "&nbsp&nbsp" . $min_tstamp_DTI.format("M jS Y\, g\:i a") 
                    . " - <br>". $max_tstamp_DTI.format("M jS Y\, g\:i a") . "   ";
                    
//            $meta_info .= $flag_display_sort_asc
//                    ? "<br><span class=\"alert\">Chronological order.</span>"
//                    : "<br><span class=\"alert\">Reverse chronological order.</span>";

        } else {
            //search did not have results
            $meta_info = "";
            if ($query_was_valid) {
                /* print some meta info about the query */
                if($from_date_mysql !== '') {
                    $meta_info .= "Searched after:<br> $from_date_mysql";
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
            $PREV_BUTTON_CLASS = "resultsLink";
            $PREV_LINK = SITE . "to/"
                    . $min_tstamp_url_sub1us
                    . "/$flags_only_query";
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
        
        if($next_results_exist) {
            $NEXT_LINK = SITE . "from/"
                    . $max_tstamp_url_plus1us
                    . "/$flags_only_query";
//            $NEXT_LINK .= $flag_display_sort_asc ? "#top" : "&sort=latest#bottom";
            
            $NEXT_BUTTON_CLASS = "resultsLink";
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
    }
?>