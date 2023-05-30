<?php


/*
* Parse functions
*/
include 'parseFunctions.php';
    

/***********************************************************
***********************************************************
*      PROCESS INPUT VARS
***********************************************************
***********************************************************/


define("DATE_SANITIZE", "/[^a-zA-Z0-9\-:\s\\/,\+]/");
define("USER_SANITIZE", "/[^a-zA-Z0-9_ ]/");
define("ID_SANITIZE", "/[^0-9]/");

$non_wlist_str = ( isset($_GET['wlist']) && gettype($_GET['wlist']) === 'string' ) ? $_GET['wlist'] : '';
$highlight_me_str = ( isset($_GET['me']) && gettype($_GET['me']) === 'string' ) ? $_GET['me'] : '';

$non_wlist = $non_wlist_str === '1' ? 1 : 0;
$highlight_me = $highlight_me_str === '1' ? 1 : 0;

$options_query = "";
$options_query .= $non_wlist === 1 ? "&wlist=1" : "";
$options_query .= $highlight_me === 1 ? "&me=1" : "";



$non_wlist_check = $non_wlist === 1 ? "checked" : "";
$highlight_me_check = $highlight_me === 1 ? "checked" : "";

/*
* Ensure query and user vars are strings
* The raw values will be passed to prepared statements, and must be 
* escaped when used
*/
$q1 = ( isset($_GET['q1']) && gettype($_GET['q1']) === 'string' ) ? $_GET['q1'] : '';
$q2 = ( isset($_GET['q2']) && gettype($_GET['q2']) === 'string' ) ? $_GET['q2'] : '';
$q3 = ( isset($_GET['q3']) && gettype($_GET['q3']) === 'string' ) ? $_GET['q3'] : '';



$u1 = ( isset($_GET['u1']) && gettype($_GET['u1']) === 'string' ) ? preg_replace(USER_SANITIZE, " ", $_GET['u1']) : '';
$u2 = ( isset($_GET['u2']) && gettype($_GET['u2']) === 'string' ) ? preg_replace(USER_SANITIZE, " ", $_GET['u2']) : '';
$u3 = ( isset($_GET['u3']) && gettype($_GET['u3']) === 'string' ) ? preg_replace(USER_SANITIZE, " ", $_GET['u3']) : '';

/*
* These determine the initial state of the div containing extra query fields
* and its associated button
*/
$extra_fields_set = $q2 !== '' || $q3 !== '' || $u2 !== '' || $u3 !== '';
$query_present = $extra_fields_set || $q1 !== '' || $u1 !== '';

if ($extra_fields_set) {
   $EXTRA_FIELDS_DISPLAY = "display:block;";
   $EXTRA_FIELDS_BUTTON_VALUE = "-";
} else {
   $EXTRA_FIELDS_DISPLAY = "display:none;";
   $EXTRA_FIELDS_BUTTON_VALUE = "+";
}

/*
 * getMysqlDate behavior: 
 * 
 * If the indicated parameter contains a string parsable as a valid date, 
 *  returns (mysql-formatted string, corresponding unix time, param)
 * 
 * Otherwise returns ("", 0, param)
 * 
 * Where param is the parameter, as a lightly sanitized string.
 */
list($user_date, $user_date_unix, $user) = getMysqlDate('date');
if ($user_date !== '') {
    /*
     * if $user_date was a valid date,
     * set from_date to the user date and $to_date to empty string.
     * 
     * If the sphinx logic below decides to interpret $user_date as the $to_date,
     * it will swap the variables $from_date and $to_date to do so.
     */
    list($from_date, $from_unix, $from) = [$user_date, $user_date_unix, getDateParam("from")];
    list($to_date, $to_unix, $to) = ["", 0, getDateParam("to")];
} else {
    list($from_date, $from_unix, $from) = getMysqlDate('from');
    if ($from_date !== '') {
        /* if from_date was a valid date, 
         * force to_date to be the empty string
         * 
         * Setting both from and to is entirely meaningless for these searches
         */
        list($to_date, $to_unix, $to) = ["", 0, getDateParam("to")];
    } else {
        list($to_date, $to_unix, $to) = getMysqlDate('to');
    }
}
/*
* Sort order is determined by a radio button- earliest or latest, or empty string if no button was selected
*/
$sort_str = !isset($_GET['sort']) || gettype($_GET['sort']) !== 'string' ? '' : $_GET['sort'];

//var_dump($user_date);
//echo "<br>";
//var_dump($from_date);
//echo "<br>";
//var_dump($sort_str);
//echo "<br>";


if(!$query_present) {
    /* May swap $from_date and $to_date to better match the request */
    if ($from_date !== '' && $sort_str === 'latest' ||
       $to_date !== '' && $sort_str === 'earliest') {
        list($temp_date, $temp_unix) = [$from_date, $from_unix];
        list($from_date, $from_unix) = [$to_date, $to_unix];
        list($to_date, $to_unix) = [$temp_date, $temp_unix];
    }

    $outer_sort_asc = true;
    if ($from_date !== '') {
        $sort_nonredundant = "earliest";
        $inner_ordered_range = " WHERE tstamp >= '$from_date' ORDER BY tstamp asc ";
    } else if($to_date !== '') {
        $sort_nonredundant = "";
        $inner_ordered_range = " WHERE tstamp < '$to_date' ORDER BY tstamp desc ";
    } else {
        if ($sort_str === 'earliest') {
            $sort_nonredundant = "earliest";
            $inner_ordered_range = " ORDER BY tstamp asc ";
        } else {
            $sort_nonredundant = "";
            $inner_ordered_range = " ORDER BY tstamp desc ";
        }
    }
} else { /* query not present */
    /* May swap $from_date and $to_date to better match the user date request */
    if ($user_date !== '' &&
            ( $from_date !== '' && $sort_str === 'latest'
            || $to_date !== '' && $sort_str === 'earliest') ) {
        list($temp_date, $temp_unix) = [$from_date, $from_unix];
        list($from_date, $from_unix) = [$to_date, $to_unix];
        list($to_date, $to_unix) = [$temp_date, $temp_unix];
    }

    //$outer_sort_asc = $sort_str === "earliest" ? true : false;  /* set descending if none specified */
    //$outer_sort = $outer_sort_asc ? " asc " : " desc ";

    //var_dump($outer_sort);
    //var_dump($sort_str);

    if($from_date !== '') {
        $outer_sort_asc = $sort_str === "latest" ? false : true;  /* set ascending if none specified */
        $outer_sort = $outer_sort_asc ? " asc " : " desc ";
        $sort_nonredundant = "";
        $inner_ordered_range = " AND tstamp >= $from_unix ORDER BY tstamp asc ";
    } else if ($to_date !== '') {
        $outer_sort_asc = $sort_str === "latest" ? false : true;  /* set ascending if none specified */
        $outer_sort = $outer_sort_asc ? " asc " : " desc ";
        $sort_nonredundant = $sort_str === 'latest' ? "latest" : "";
        $inner_ordered_range = " AND tstamp < $to_unix ORDER BY tstamp desc ";
    } else {
        $outer_sort_asc = $sort_str === "earliest" ? true : false;  /* set descending if none specified */
        $outer_sort = $outer_sort_asc ? " asc " : " desc ";
        $sort_nonredundant = $sort_str === 'latest' ? "latest" : "";
        $inner_ordered_range = " ORDER BY tstamp $outer_sort ";
    }

    var_dump($outer_sort_asc);
    echo "<br>";
    //var_dump($sort_str);
}


/*
 * get jump ID if provided
 * 
 * jump ID is used with no search query & no from / to dates
 * 
 * set id to 0 if none provided, or invalid
*/
if (!$query_present && $from_date === '' && $to_date === '') {
    $jump_str = !isset($_GET['id']) || gettype($_GET['id']) !== 'string'
           ? ''
           : preg_replace(ID_SANITIZE, " ", $_GET['id']);
    $jump_id = (int) $jump_str;
}   else {
    $jump_id = 0;
}


/*
 * PROGRAM CORRECTNESS
 * 
 * Parameters are $q1-3, $u1-3, $user_date, $from_date, $to_date, and $jump_id
 * 
 * If jump_id (param 'id') is set, then all other parameters are empty, and execution is simple.
 * In all other cases, jump_id is set to 0 and therefore ignored
 * 
 * ------------------------------
 * DATES
 * ------------------------------
 *  
 * If user_date (param 'date') is not empty, exactly one of ($from_date, $to_date) is empty.
 * Else, at least one of ($from_date, $to_date) is empty.
 *
 * During parsing, $user_date (if present) is assigned to $from_date as a guess.
 * This may need to be corrected now, depending on the sort radio button value.
 * $from_date and $to_date may be swapped when:
 * ( $from_date !== '' && $sort_str === 'latest'
            || $to_date !== '' && $sort_str === 'earliest')
 * This swap always occurs when !$query_present, and sometimes occurs when $query_present.  Details below.
 * 
 * 
 * Below we refer to $from_date as from (similarly with 'to'), for convenience.
 * The actual $from is not considered in the logic below.
 * 
 * So 9 permutations: (from only, to only, neither) x (earliest, '', latest)
 * 
 * The 'to' scenarios are not possible under form submission (but are under 
 *  linking / redirects)
 * ------------------------------
 * Query Not Present (mysql query):
 * ------------------------------
 * 
 * from + earliest (= user date + earliest)
 *      -earliest is redandant
 * from + '' (= user date + '')
 *      -
 * from + latest (= user date + latest)
 *      -would have been swapped to "to + latest"
 * 
 * to + earliest
 *      -would have been swapped to "from + earliest"
 * to + ''
 *      -
 * to + latest
 *      -latest is redundant
 * 
 * neither + earliest
 *      -
 * neither + ''
 *      -maps to neither + latest
 * neither + latest
 *      -latest is redundant 
 * 
 * 
 * ------------------------------
 * Query Present (sphinx + mysql)
 * ------------------------------
 * 
 * (sort = '' always has default "earliest")
 * if sort = 'latest', outer (aka displayed) sort always shows page results
 * in reverse (tstamp descending) order
 * 
 * from + earliest (might have been user date + earliest)
 *      -earliest is redandant
 * from + '' (= user date + '')
 *      -
 * from + latest (might have been date + latest)
 *      -date not empty: impossible, would have swapped to: "to + latest"
 *      -date empty: ok (links to the next page)
 * 
 * to + earliest
 *      -date not empty: impossible, would have swapped to: "from + latest"
 *      -date empty: ok (links to the prev page)
 * to + ''
 *      -
 * to + latest
 *      -latest is redundant
 * 
 * neither + earliest
 *      -earliest is redundant
 * neither + ''
 *      -maps to neither + earliest
 * neither + latest
 *      -
 * 
 */


/*
 * URL redirecting
 * 
 * The variables $q1-3, $u1-3, and $jump_id do not cause redirection
 * 
 * If $user_date is not empty, form submission occurred.  
 * When $user_date is not empty, exactly one of $from_date and $to_date is not empty.
 * We'll redirect the user to a pretty url.
 */
if($user_date !== '') {
    $new_link = SITE;

    $query = $_SERVER['QUERY_STRING'];
    parse_str($query, $query_arr);
    //var_dump($query_arr);
    unset($query_arr['date']);
    unset($query_arr['from']);
    unset($query_arr['to']);
    unset($query_arr['sort']);
    if($sort_nonredundant !== '') {
        $query_arr['sort'] = $sort_nonredundant;
    }
    
    if ($from_date !== '') {
        $new_link .= "from/" . htmlEncodeMysqlDate($from_date) . "/";
    } else if ($to_date !== '') {
        $new_link .= "to/" . htmlEncodeMysqlDate($to_date) . "/";
    } 
    
    $trunc_query = http_build_query($query_arr);
    $new_link .= $trunc_query !== '' ? "?" : "" ;
    $new_link .= $trunc_query;
    header("Location: " . $new_link);
}

?>