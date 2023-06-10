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


define("DATE_SANITIZE", "/[^a-zA-Z0-9\-:\s\\/,\+\.]/");
define("USER_SANITIZE", "/[^a-zA-Z0-9_ ]/");
define("ID_SANITIZE", "/[^0-9]/");

class QueryFlag {
    public $name;
    public $default;
    public $val;
    public $val_checked_str;
    
    public function __construct(string $name, bool $default) {
        $this->name = $name;
        $this->default = $default;
        
        // set val from GET
        $param_as_string = (
                isset($_GET[$name]) && 
                    gettype($_GET[$name]) === 'string' ) 
                ? $_GET[$name] 
                : '';
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
    }
}

$query_flags = new QueryFlags();

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
//        echo "<br>to_date: :$to_date<br>";
//        echo "<br>to_unix: :$to_unix<br>";
//        echo "<br>to: :$to<br>";
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

    

    $flag_display_sort_asc = $query_flags->display_sort_asc->val;
    $display_tstamp_sort = " ORDER BY tstamp " . 
            ($flag_display_sort_asc ? " asc " : " desc ");
    if ($from_date !== '') {
        $sort_nonredundant = "earliest";
        $fetch_tstamp_range_filter = " tstamp >= '$from_date' ";
        $fetch_tstamp_sort = " ORDER BY tstamp asc ";
    } else if($to_date !== '') {
        $sort_nonredundant = "";
        $fetch_tstamp_range_filter = " tstamp < '$to_date' ";
        $fetch_tstamp_sort = " ORDER BY tstamp desc ";
    } else {
        if ($sort_str === 'earliest') {
            $sort_nonredundant = "earliest";
            $fetch_tstamp_range_filter = " 1 ";
            $fetch_tstamp_sort = " ORDER BY tstamp asc ";
        } else {
            $sort_nonredundant = "";
            $fetch_tstamp_range_filter = " 1 ";
            $fetch_tstamp_sort = " ORDER BY tstamp desc ";
        }
    }
} else { /* query present */
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
//        $flag_display_sort_asc = $sort_str === "latest" ? false : true;  /* set ascending if none specified */
        $str_display_sort_asc = $flag_display_sort_asc ? " asc " : " desc ";
        $sort_nonredundant = "";
        $fetch_tstamp_range_filter = " tstamp >= $from_unix ";
        $fetch_tstamp_sort = " ORDER BY tstamp asc ";
    } else if ($to_date !== '') {
//        $flag_display_sort_asc = $sort_str === "latest" ? false : true;  /* set ascending if none specified */
        $str_display_sort_asc = $flag_display_sort_asc ? " asc " : " desc ";
        $sort_nonredundant = $sort_str === 'latest' ? "latest" : "";
        $fetch_tstamp_range_filter = " tstamp < $to_unix ";
        $fetch_tstamp_sort = " ORDER BY tstamp desc ";
    } else {
//        $flag_display_sort_asc = $sort_str === "earliest" ? true : false;  /* set descending if none specified */
        $str_display_sort_asc = $flag_display_sort_asc ? " asc " : " desc ";
        $sort_nonredundant = $sort_str === 'latest' ? "latest" : "";
        $fetch_tstamp_range_filter = " 1 ";
        $fetch_tstamp_sort = $display_tstamp_sort;
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

    $temp_query_part = $_SERVER['QUERY_STRING'];
    parse_str($temp_query_part, $query_arr);
//    var_dump($query_arr);
    unset($query_arr['date']);
    unset($query_arr['from']);
    unset($query_arr['to']);
    unset($query_arr['sort']);
    
    foreach (get_object_vars($query_flags) as $query_flag) {
        if ($query_flag->val === $query_flag->default) {
            unset($query_arr[$query_flag->name]);
        } else {
            $query_arr[$query_flag->name] = $query_flag->val;
        }
    }
//    if($sort_nonredundant !== '') {
//        $query_arr['sort'] = $sort_nonredundant;
    //    
    //    var_dump($query_arr);
    if ($from_date !== '') {
        $new_link .= "from/" . htmlEncodeMysqlDate($from_date) . "/";
    } else if ($to_date !== '') {
        $new_link .= "to/" . htmlEncodeMysqlDate($to_date) . "/";
    } 

    $trunc_query = http_build_query($query_arr);
    $new_link .= $trunc_query !== '' ? "?" : "";  # add `?` if query exists
    $new_link .= $trunc_query;
    header("Location: " . $new_link);
}


//$trimmed_query = getTrimmedQuery($query_flags);
$flags_only_query = getTrimmedQuery($query_flags, True);
$flags_only_query = $flags_only_query !== '' ? "?$flags_only_query" : "";
//echo $trimmed_query;
//echo $flags_only_query;
?>