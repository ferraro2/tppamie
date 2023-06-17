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

$query_options = new QueryOptions();

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
 * Setting both from and to is contradictory by the logic expressed in 
 * our help file.
 * We don't expect they will both ever not be not null.
 */
$from_date = getNullableDTIFromDateParam('from');
if ($from_date) {
    $to_date = null;
} else {
    // might be null if user didn't specify a date
    $to_date = getNullableDTIFromDateParam('to');
}

$from_date_url = getUrlDateFromNullableDTI($from_date);
$from_date_mysql = getMysqlDateFromNullableDTI($from_date);
$from_date_sphinx = getSphinxDateFromNullableDTI($from_date);

$to_date_url = getUrlDateFromNullableDTI($to_date);
$to_date_mysql = getMysqlDateFromNullableDTI($to_date);
$to_date_sphinx = getSphinxDateFromNullableDTI($to_date);

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

$redacted_query = getRedactedQuery($query_options);
$flags_only_query = getRedactedQuery($query_options, True);
$reverse_display_sort_url = getReverseDisplaySortUrl($query_options);
//echo $trimmed_query;
//echo $flags_only_query;
?>