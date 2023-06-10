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


class QueryFlag {
    public $name;
    public $default;
    public $val;
    public $val_checked_str;
    
    public function __construct(string $name, bool $default) {
        $this->name = $name;
        $this->default = $default;
        
        // set val from GET
        $param_as_string = filter_input(INPUT_GET, $name);
//        echo "<br>param '$param_name' as string:" . $param_as_string. "<br>";
        if($default === True) {
//            $query = "";
            $this->val = $param_as_string === '0' ? False : True;
        } else {
//            $query = "&$param_name=" . (1 - ($default ? 1 : 0));
            $this->val = $param_as_string === '1' ? True : False;
        }
        $this->val_checked_str = $this->val ? 'checked' : '';
    }
}

class QueryFlags {
    public $show_game_inputs;
    public $show_tpp_bot;
    public $show_unwhitelisted_chars;
    public $display_sort_asc;
    
    public function __construct() {
        $this->show_game_inputs = new QueryFlag("inputs", False);
        $this->show_tpp_bot = new QueryFlag("bot", True);
        $this->show_unwhitelisted_chars = new QueryFlag("chars", False);
        $this->display_sort_asc = new QueryFlag("sort", False);
        $this->user_date_sort = new QueryFlag("sort", False);
    }
}

$query_flags = new QueryFlags();
$user_date_radio_str = filter_input(INPUT_GET, "dateRadio");
if(!preg_match("/^from|to$/", $user_date_radio_str)) {
    $user_date_radio_str = "";
}


$msg_flags_filter = " 1 ";
$msg_flags_filter .= $query_flags->show_game_inputs->val
        ? "" : " and is_input=0 and is_match_command=0 ";
$msg_flags_filter .= $query_flags->show_tpp_bot->val
        ? "" : " and is_bot=0 ";
$msg_flags_filter .= $query_flags->show_unwhitelisted_chars->val
        ? "" : " and has_unwhitelisted_chars=0 ";


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

$user_date = getNullableDTIFromDateParam('date');
if ($user_date) {
    /*
     * if $user_date was a valid date,
     * set from_date to the user date and $to_date to empty string.
     * 
     */
    if ($user_date_radio_str == 'to') {
        $to_date = $user_date;
        $from_date = null;
    } else {
        $from_date = $user_date;
        $to_date = null;
    }
} else {
    $from_date = getNullableDTIFromDateParam('from');
    if ($from_date) {
        /* if from_date was a valid date, 
         * force to_date to be the empty string
         * 
         * Setting both from and to is entirely meaningless for these searches
         */
        $to_date = null;
    } else {
        // might be null if user didn't specify a date
        $to_date = getNullableDTIFromDateParam('to');
//        echo "<br>to_date: :$to_date<br>";
//        echo "<br>to_unix: :$to_unix<br>";
//        echo "<br>to: :$to<br>";
    }
}
$from_date_url = getUrlDateFromNullableDTI($from_date);
$from_date_mysql = getMysqlDateFromNullableDTI($from_date);
$from_date_sphinx = getSphinxDateFromNullableDTI($from_date);

$to_date_url = getUrlDateFromNullableDTI($to_date);
$to_date_mysql = getMysqlDateFromNullableDTI($to_date);
$to_date_sphinx = getSphinxDateFromNullableDTI($to_date);

//var_dump($user_date);
//echo "<br>";
//var_dump($from_date);
//echo "<br>";
//var_dump($sort_str);
//echo "<br>";


if(!$query_present) {
    $flag_display_sort_asc = $query_flags->display_sort_asc->val;
    $display_tstamp_sort = " ORDER BY tstamp " . 
            ($flag_display_sort_asc ? " asc " : " desc ");
    if ($from_date) {
//        $sort_nonredundant = "earliest";
        $fetch_tstamp_range_filter = " tstamp >= '$from_date_mysql' ";
        $fetch_tstamp_sort = " ORDER BY tstamp asc ";
    } else if($to_date) {
//        $sort_nonredundant = "";
        $fetch_tstamp_range_filter = " tstamp <= '$to_date_mysql' ";
        $fetch_tstamp_sort = " ORDER BY tstamp desc ";
    } else {
        if ($user_date_radio_str === 'from') {
//            $sort_nonredundant = "earliest";
            $fetch_tstamp_range_filter = " 1 ";
            $fetch_tstamp_sort = " ORDER BY tstamp asc ";
        } else {
//            $sort_nonredundant = "";
            $fetch_tstamp_range_filter = " 1 ";
            $fetch_tstamp_sort = " ORDER BY tstamp desc ";
        }
    }
} else { /* query present */
    $str_display_sort_asc = $flag_display_sort_asc ? " asc " : " desc ";
    if($from_date) {
        $fetch_tstamp_range_filter = " tstamp >= '$from_date_sphinx' ";
        $fetch_tstamp_sort = " ORDER BY tstamp asc ";
    } else if ($to_date) {
        $str_display_sort_asc = $flag_display_sort_asc ? " asc " : " desc ";
        $fetch_tstamp_range_filter = " tstamp <= '$to_date_sphinx' ";
        $fetch_tstamp_sort = " ORDER BY tstamp desc ";
    } else {
        if ($user_date_radio_str === 'from') {
            $fetch_tstamp_range_filter = " 1 ";
            $fetch_tstamp_sort = " ORDER BY tstamp asc ";
        } else {
            $fetch_tstamp_range_filter = " 1 ";
            $fetch_tstamp_sort = " ORDER BY tstamp desc ";
        }
    }

    //var_dump($outer_sort_asc);
    //echo "<br>";
    //var_dump($sort_str);
}

/*
 * get jump ID if provided
 * 
 * jump ID is used with no search query & no from / to dates
 * 
 * set id to 0 if none provided, or invalid
*/
if (!$query_present && $from_date_mysql === '' && $to_date === '') {
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
 * redirect *.com/?to=2014-....&... to *.com/to/2014-../?...
 * 
 * The variables $q1-3, $u1-3, and $jump_id do not cause redirection
 * 
 * If $user_date_DIO is not null, search form submission occurred.
 * When $user_date is not empty, we have set exactly one of $from_date 
 * and $to_date is not empty.
 * We'll redirect the user to a pretty url.
 */
if($user_date) {
    $new_link = SITE;
    
    if ($from_date) {
        $new_link .= "from/" . $from_date_url . "/";
    } else if ($to_date) {
        $new_link .= "to/" . $to_date_url . "/";
    } 

    $new_link .= getReplacementQuery($query_flags);
    header("Location: " . $new_link);
}


//$trimmed_query = getTrimmedQuery($query_flags);
$flags_only_query = getReplacementQuery($query_flags, True);
//echo $trimmed_query;
//echo $flags_only_query;
?>