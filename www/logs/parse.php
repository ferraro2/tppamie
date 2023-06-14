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


class QueryOption {
    public $name;
    public $default;
    public $val;
    public $val_checked_str;
    
    public function __construct(string $name, bool $default, $valid) {
        $this->name = $name;
        $this->default = $default;
        
        // set val from GET
        $this->val = filter_input(INPUT_GET, $name);
        // set default value if empty or invalid
        if(!in_array($this->val, $valid)) {
            $this->val = $default;
        }
        $this->val_checked_str = $this->val == '1' ? 'checked' : '';
    }
}

class QueryOptions {
    public $show_game_inputs;
    public $show_tpp_bot;
    public $show_unwhitelisted_chars;
    public $display_sort_asc;
    public $direction;
    
    
    public function __construct() {
        $valid_checkbox = array('0', '1');
        $this->show_tpp_bot = new QueryOption("bot", '1', $valid_checkbox);
        $this->show_commands = new QueryOption("cmds", '1', $valid_checkbox);
        $this->show_game_inputs = new QueryOption("inputs", '0', $valid_checkbox);
        $this->show_unwhitelisted_chars = new QueryOption("chars", '0', $valid_checkbox);
        $this->display_sort_asc = new QueryOption("sort", '0', $valid_checkbox);
        
        $valid_directions = array('from', 'to');
        $this->direction = new QueryOption("dir", "to", $valid_directions);
    }
}
//echo ($query_options->direction) + "<br>";
$query_options = new QueryOptions();
if ($query_options->direction->val == 'from') {
    $from_checked = 'checked';
    $to_checked = '';
} else {
    $from_checked = '';
    $to_checked = 'checked';
}

$query_filter_array = array();
array_push($query_filter_array, "is_hidden=0");
array_push($query_filter_array, "hide_all_messages=0");

// additionally filter results from sphinx on filter parameters
// that may have gone stale: e.g. user wants messages hidden,
// but that isn't updated in the results returned by the sphinx indices
$mysql_sphinx_ids_filter = implode(" AND ", $query_filter_array);
if ($mysql_sphinx_ids_filter == "") {
    $mysql_sphinx_ids_filter = " 1 ";
}

if ($query_options->show_game_inputs->val == '0') {
    array_push($query_filter_array, "is_input=0");
    array_push($query_filter_array, "is_match_command=0");
}
if ($query_options->show_tpp_bot->val == '0') {
    array_push($query_filter_array, "is_bot=0");
}
if ($query_options->show_commands->val == '0') {
    array_push($query_filter_array, "is_command=0");
}
if ($query_options->show_unwhitelisted_chars->val == '0') {
    array_push($query_filter_array, "has_unwhitelisted_chars=0");
}
$query_filter = implode(" AND ", $query_filter_array);
if ($query_filter == "") {
    $query_filter = " 1 ";
}

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
    if ($query_options->direction->val == 'to') {
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
    $flag_display_sort_asc = $query_options->display_sort_asc->val == '1';
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
        if ($query_options->direction->val === 'from') {
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
    $flag_display_sort_asc = $query_options->display_sort_asc->val == '1';
    $display_tstamp_sort = " ORDER BY tstamp " . 
            ($flag_display_sort_asc ? " asc " : " desc ");
    if($from_date) {
        $fetch_tstamp_range_filter = " tstamp >= $from_date_sphinx ";
        $fetch_tstamp_sort = " ORDER BY tstamp asc ";
    } else if ($to_date) {
        $fetch_tstamp_range_filter = " tstamp <= $to_date_sphinx ";
        $fetch_tstamp_sort = " ORDER BY tstamp desc ";
    } else {
        if ($query_options->direction->val === 'from') {
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

if (!$query_present && !$from_date && !$to_date) {
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

    $new_link .= getRedactedQuery($query_options);
    header("Location: " . $new_link);
}


$redacted_query = getRedactedQuery($query_options);
$flags_only_query = getRedactedQuery($query_options, True);
$reverse_display_sort_url = getReverseDisplaySortUrl($query_options);
//echo $trimmed_query;
//echo $flags_only_query;
?>