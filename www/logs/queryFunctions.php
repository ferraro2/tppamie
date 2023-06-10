<?php

/***********************************************************
 ***********************************************************
 *      GENERAL UTILITY FUNCTIONS
 ***********************************************************
 ***********************************************************/

/*
* Escaping function, used for display
*/
function h($str) {
   return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
}


/***********************************************************
 ***********************************************************
 *      MYSQL PDO FUNCTIONS
 ***********************************************************
 ***********************************************************/

/*
 * Get the time range for the query: min_tstamp and max_tstamp
 * (no jump id)
 */
function getMysqlRange($pdo, $tstamp_range, $tstamp_sort, $msg_flags_filter) {
    /*
        * get min and max timestamps for the query
        */
       $tstamp_query = "SELECT MIN(tstamp) as min_t, MAX(tstamp) as max_t "
               ."FROM (SELECT tstamp FROM messages WHERE "
               . $msg_flags_filter . " AND "
               . $tstamp_range 
               . $tstamp_sort
               . " LIMIT " . LIMIT . ") t";

//       echo "<br>$tstamp_query<br>";
       $tstamp_results = $pdo->prepare($tstamp_query);
       $tstamp_results->execute( array() );

       $tstamp_obj = $tstamp_results->fetchObject();
       
       /*
        * Success if neither min_t and max_t are null
        */
       if ($tstamp_obj->min_t && $tstamp_obj->max_t) {
           return array(True, $tstamp_obj->min_t, $tstamp_obj->max_t);
       } else {
           return array(False, null, null);
       }
}

/*
 * Get the time range for the query: min_tstamp and max_tstamp
 * Use provided jump id
 */
function getMysqlJumpRange($pdo, $jump_id, $msg_flags_filter) {
    /* 
     * get tstamp of the jump id
     */
    $jump_tstamp_query = "SELECT tstamp as jump_time "
            ."FROM (SELECT tstamp FROM messages "
            . "WHERE msg_id = $jump_id AND " 
            . $msg_flags_filter
            . "LIMIT 1) t";
//    echo $jump_tstamp_query;
    $jump_tstamp_results = $pdo->prepare($jump_tstamp_query);
    $jump_tstamp_results->execute( array() );
    $jump_tstamp_obj = $jump_tstamp_results->fetchObject();
    if ($jump_tstamp_obj) {
        $had_results = True;
        $jump_tstamp = $jump_tstamp_obj->jump_time;
        /*
         * use jump tstamp to generate min/max timstamps for the query
         */


        $min_tstamp_query = "SELECT MIN(low_stamp_range) as min_t "
            ."FROM (SELECT tstamp as low_stamp_range FROM messages "
            . "WHERE tstamp <= '$jump_tstamp' AND " . $msg_flags_filter
            . " ORDER BY tstamp desc LIMIT " . JUMP_OFFSET . ") t1";

        $max_tstamp_query = "SELECT MAX(high_stamp_range) as max_t "
            ."FROM (SELECT tstamp as high_stamp_range FROM messages "
            . "WHERE tstamp >= '$jump_tstamp' AND " . $msg_flags_filter
            . " ORDER BY tstamp asc LIMIT " . (LIMIT - JUMP_OFFSET) . ") t2";

        $min_tstamp_results = $pdo->prepare($min_tstamp_query);
        $min_tstamp_results->execute( array() );
        $min_tstamp_obj = $min_tstamp_results->fetchObject();
        $min_tstamp = $min_tstamp_obj->min_t;

        $max_tstamp_results = $pdo->prepare($max_tstamp_query);
        $max_tstamp_results->execute( array() );
        $max_tstamp_obj = $max_tstamp_results->fetchObject();
        $max_tstamp = $max_tstamp_obj->max_t;

        return array($had_results, $min_tstamp, $max_tstamp);
    } else {
        return array(False, null, null);
    }
}



/*
 * Get Mysql results in the tstamp range
 */
function getMysqlResults($pdo, $tstamp_range_filter, $msg_flags_filter, 
        $display_tstamp_sort) {
    $mysql_query = "SELECT username, md.color as color, moder, sub, turbo, "
            . " m.msg_id, tstamp, is_action, emote_locs, msg, video_id, "
            .  "video_offset_seconds "
            . " FROM users u join messages m using(user_id) "
            . " join msg_data md using(msg_id) "
            . " WHERE "
            . $msg_flags_filter . " AND "
            . $tstamp_range_filter
            . $display_tstamp_sort;

//    echo "<br>$mysql_query<br>";

    $mysql_results = $pdo->prepare($mysql_query);
    $mysql_results->execute( array() );

    $results = [];
    while ($qresult = $mysql_results->fetchObject()) {
        $results[$qresult->msg_id] = $qresult;
    }
    
    return $results;
}


/*
 * Return bool indicating whether results 
 *  exist before tstamp provided
 */
function mysqlPrevResultsExist($pdo, $tstamp, $msg_flags_filter) {
    $prev_query = "SELECT msg_id, tstamp FROM messages "
            ."WHERE tstamp < '$tstamp' AND {$msg_flags_filter} LIMIT 1";
    ##echo "<br>$prev_query<br>";
    $prev_results = $pdo->prepare($prev_query);
    $prev_results->execute( array() );
    return $prev_results->fetchObject() == True;
}

/*
 * Return bool indicating whether results 
 *  exist after tstamp provided
 */
function mysqlNextResultsExist($pdo, $tstamp, $msg_flags_filter) {
    $next_query = "SELECT msg_id, tstamp FROM messages "
            ."WHERE tstamp > '$tstamp' AND {$msg_flags_filter} LIMIT 1";
    ##echo "<br>$prev_query<br>";
    $next_results = $pdo->prepare($next_query);
    $next_results->execute( array() );
    return $next_results->fetchObject() == True;
}




/***********************************************************
 ***********************************************************
 *      PRIMARY NO-QUERY MYSQL ROUTINE
 ***********************************************************
 ***********************************************************/

function mysqlQuery($config, $jump_id, $inner_tstamp_range_filter, 
        $inner_tstamp_sort, $msg_flags_filter, $display_tstamp_sort) {
    try {
        $pdo_command = sprintf("mysql:host=%s;dbname=%s;charset=utf8mb4", $config['hostname'], $config['database']);
        $pdo = new PDO($pdo_command, $config['username'], $config['password']);
        // set the PDO error mode to exception
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        /*
         * Get the time range for the query: min_tstamp and max_tstamp
         * 
         * Set had_results flag accordingly
         */
        if ($jump_id !== 0) {
            /*
             * jump id was provided
             */
            $time_pre = microtime(true);
            list($had_results, $min_tstamp, $max_tstamp) = 
                    getMysqlJumpRange($pdo, $jump_id, $msg_flags_filter);
            $time_post = microtime(true);    
            #echo "<br>getTimeRangeWithJump took " . ($time_post - $time_pre) * 1000 . " ms<br>";
        } else {
            /*
             * no jump id provided
             */
            $time_pre = microtime(true);
            list($had_results, $min_tstamp, $max_tstamp) = 
                    getMysqlRange($pdo, $inner_tstamp_range_filter, 
                            $inner_tstamp_sort, $msg_flags_filter);
            $time_post = microtime(true);
            #echo "<br>getTimeRange took " . ($time_post - $time_pre) * 1000 . " ms<br>";
        }
        
        if ($had_results) {
            $time_pre = microtime(true);

            $mysql_results_tstamp_range_filter = " '$min_tstamp' <= tstamp "
                    . " AND tstamp <= '$max_tstamp' ";

            /*
             * get all results in the dual-inclusive tstamp range
             */
            $results = getMysqlResults(
                    $pdo,  $mysql_results_tstamp_range_filter, 
                    $msg_flags_filter, $display_tstamp_sort);
            $time_post = microtime(true);
            #echo "<br>getMysqlResults took " . ($time_post - $time_pre) * 1000 . " ms<br>";
            
            /*
             * get flags indicating whether previous / next results exist
             */
            $prev_results_exist = mysqlPrevResultsExist(
                    $pdo, $min_tstamp, $msg_flags_filter);
            $next_results_exist = mysqlNextResultsExist(
                    $pdo, $max_tstamp, $msg_flags_filter);
            
            
            /* close mysql connection */
            $pdo = null;
            return array($had_results, true, $min_tstamp, $max_tstamp, 
                $results, $prev_results_exist, $next_results_exist);
        } else {
            /* close mysql connection */
            $pdo = null;
            return array(false, true, null, null, array(), false, false);
        }
     } catch(PDOException $e) {
        if (DEBUG) {
            echo "mysqlQuery() Connection failed: " . $e->getMessage();
        }
        /* close mysql connection */
        $pdo = null;
        return array(false, false, null, null, array(), false, false);
     }
}



/***********************************************************
 ***********************************************************
 *      PRIMARY SPHINX ROUTINE
 ***********************************************************
 ***********************************************************/
function sphinxQuery($hostname, $sphinx_match_query, $inner_ordered_range) {

    /*
     * only one prepared parameter here- unfortunately, Sphinx doesn't like 
     * to accept prepared parameters for tstamp, limit, etc. values.  :(
     */

    try {
       echo "establishing new pdo<br>";
       $pdo = new PDO("mysql:host=localhost;port=9306;charset=utf8mb4", 'me', 'none');
       // set the PDO error mode to exception
       echo "setting attribute<br>";
       $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
       echo "running subroutine<br>";
        list($had_results, $msg_ids, $min_tstamp_unix, $max_tstamp_unix) =
           getSphinxRange($pdo, $sphinx_match_query, $inner_ordered_range);
        
        if ($had_results) {
            $meta = sphinxGetMeta($pdo);
            /*
             * get flags indicating whether previous / next results exist
             */
            $prev_results_exist = sphinxPrevResultsExist($pdo, $sphinx_match_query, $min_tstamp_unix);
            $next_results_exist = sphinxNextResultsExist($pdo, $sphinx_match_query, $max_tstamp_unix);
            
            /* close the sphinx connection */
            $pdo = null;
            return [$had_results, true, $min_tstamp_unix, $max_tstamp_unix,
                 $msg_ids, $meta, $prev_results_exist, $next_results_exist];
        } else {
            /* close the sphinx connection */
            $pdo = null;
            return [false, true, 0, 0, null, null, false, false];
        }
        
    } catch(PDOException $e) {
        if (DEBUG) {
            echo "SphinxQuery() Connection failed: " . $e->getMessage();
        }
        /* close the sphinx connection */
        $pdo = null;
        return [false, false, 0, 0, null, null, false, false];
    }
    
}


/***********************************************************
 ***********************************************************
 *      SPHINX MATCH QUERY PREPARATION
 ***********************************************************
 ***********************************************************/

/*
* @param ($q)  query string
* @param ($u)  users string
* @return      a sphinx-readable query for the relevant query and users, entirely
*  contained within a set of parenthesis
*/
function createQuery($q, $u) {
    if ($q === '' && $u === '') {
        // both fields are empty
        return '';
    }

    $ret = '';
    if ($q !== '') {
        //add message query
        $ret .= "(@msg " . alter_OR_precedence($q) .  " ) ";
    }

    if ($u !== '') {
        //add users query
        $u_match = preg_replace("/[ ]/", " | ", $u);
        $ret .= " (@username $u_match)";
    }

    if ($q !== '' && $u!= '') {
        // if both queries are present, surround them in parenthesis
        return " ( $ret ) ";
    } else {
        //otherwise, the query ok for returning
        return $ret;
    }
}

/*
* Split query on keyword 'OR', and encase each piece in parenthesis
* 
* This causes 'OR' to have lower precedence than the implicit AND.
* 
* Queries containing 'OR' must NOT contain parenthesis, or the query could be nonsensical
*/
function alter_OR_precedence($q) {
    $ret = '';
    $c = 0;
    foreach (explode(" OR ", $q) as $or_piece) {
        if ($c++ !== 0) {
            $ret .= ' | ';
        }
        $ret .= "($or_piece)";
    }
    return $ret;
}

function getMatchQuery($q1, $q2, $q3, $u1, $u2, $u3) {
// add escaping for the '@' character
    $qu1 = createQuery(preg_replace("/@/", "\\@", $q1), $u1);
    $qu2 = createQuery(preg_replace("/@/", "\\@", $q2), $u2);
    $qu3 = createQuery(preg_replace("/@/", "\\@", $q3), $u3);

    // push non-empty queries into an array...
    $qu_matches = [];
    $qu1 === '' || array_push($qu_matches, $qu1);
    $qu2 === '' || array_push($qu_matches, $qu2);
    $qu3 === '' || array_push($qu_matches, $qu3);

    /*
     * ...and join them appropriately
     * Recall each query is contained within one set of parenthesis, so the high
     * precedence of the '|' operater causes no trouble here
     */
    return implode(" | ", $qu_matches);
}

/***********************************************************
 ***********************************************************
 *      SPHINX PDO FUNCTIONS
 ***********************************************************
 ***********************************************************/

/*
 * Get the time range for the query: min_tstamp and max_tstamp
 */
function getSphinxRange($pdo, $sphx_match_string, $tstamp_ordered_range) {
    /*
    * Execute the search
    */
    $sphx_match_query = "SELECT id, tstamp FROM"
           . " tppMain, tppDelta1, tppDelta2, tppDelta3, tppDelta4, tppDelta5"
           . " WHERE MATCH(?)"
           . $tstamp_ordered_range
           . " LIMIT " . LIMIT;
    $sphx_match_result = $pdo->prepare($sphx_match_query);
    $sphx_match_result->execute( [$sphx_match_string] );
    
    /*
    * Create array of msg_ids to obtain from mysql
    */
    $msg_ids = [];
    $c = 0;
    while ($sphx_match_obj = $sphx_match_result->fetchObject()) {
       array_push($msg_ids, $sphx_match_obj->id);
       if ($c++ === 0) {
           $first_tstamp_unix = $sphx_match_obj->tstamp;
       }
       $last_tstamp_unix = $sphx_match_obj->tstamp;
    }
    if ($c !== 0) {
        $normal = $first_tstamp_unix <= $last_tstamp_unix;
        $min_tstamp_unix = $normal ? $first_tstamp_unix : $last_tstamp_unix;
        $max_tstamp_unix = $normal ? $last_tstamp_unix : $first_tstamp_unix;
           
        return [True, $msg_ids, $min_tstamp_unix, $max_tstamp_unix];
    } else {
        return [False, null, null, null];
    }
}

function sphinxGetMeta($pdo) {
    $sphx_meta_query = "SHOW META";
    $sphx_meta_result = $pdo->prepare($sphx_meta_query);
    $sphx_meta_result->execute( [] );
    /*
    * store meta info in an array
    */
    $meta = [];
    while ($meta_result_obj = $sphx_meta_result->fetchObject()) {
       $meta[$meta_result_obj->Variable_name] = $meta_result_obj->Value;
    }
    return $meta;
}
/*
 * Return bool indicating whether results 
 *  exist before tstamp provided
 */
function sphinxPrevResultsExist($pdo, $query, $tstamp) {
    $prev_query = "SELECT id FROM"
            . " tppMain, tppDelta1, tppDelta2, tppDelta3, tppDelta4, tppDelta5"
            . " WHERE Match(?)"
            ." AND tstamp < $tstamp LIMIT 1";
    ##echo "<br>$prev_query<br>";
    $prev_results = $pdo->prepare($prev_query);
    $prev_results->execute( array($query) );
    return $prev_results->fetchObject() == True;
}

/*
 * Return bool indicating whether results 
 *  exist aftertstamp provided
 */
function sphinxNextResultsExist($pdo, $query, $tstamp) {
    $next_query = "SELECT id FROM"
            . " tppMain, tppDelta1, tppDelta2, tppDelta3, tppDelta4, tppDelta5"
            . " WHERE Match(?)"
            . " AND tstamp > $tstamp LIMIT 1";
    ##echo "<br>$next_query<br>";
    $next_results = $pdo->prepare($next_query);
    $next_results->execute( array($query) );
    return $next_results->fetchObject() == True;
}









 /*
                     * An old example for connecting to Sphinx via the Sphinx PHP API
                     * 
                     * We are connecting via the pseudo-Mysql interface instead
                     */
                    /* Include the Sphinx PHP API */
                    //require_once('C:/sphinx/api/sphinxapi.php');
                    //$sphx = new SphinxClient();
                    //$sphx->SetSortMode(SPH_SORT_ATTR_DESC, "tstamp");
                    //$sphx->setLimits(0,20);
                    //$res = $sphx->Query('zeekee', 'tpp1');
                    //
                    #$res = $sql_sphx->fetchObject();
?>

