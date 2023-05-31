 
<!----------------------------------------------------------
------------------------------------------------------------
--------    PREV / NEXT AND META
------------------------------------------------------------
------------------------------------------------------------>
<?php
if ($had_results || True) {
   echo "
   <div class=\"linkAndMetaBar\">
       <div class=\"leftLink\">
           <a type=\"button\" class=\"$PREV_BUTTON_CLASS\" href=\"$PREV_LINK\">Previous</a>       
       </div>
       <div class=\"rightLink\">
          <a type=\"button\" class=\"$NEXT_BUTTON_CLASS\" href=\"$NEXT_LINK\">Next</a>
       </div>

       <div class=\"meta\">
           $meta_info
       </div>
   </div>
   ";
}

if ($had_results) {
   echo "
        <a class=\"arrowDown\" href=\"#bottom\"></a>
   ";
}
?>
     
<?php

include 'displayResultsFunctions.php';

/***********************************************************
 ***********************************************************
 *      CREATE HTML FROM RESULTS
 ***********************************************************
 ***********************************************************/
if($had_results) {
    $firstTable = true;

    /*
    $tstampFirst = reset($results)->tstamp;
    $tstampLast = end($results)->tstamp;
    $tstampEarliest = $tstampFirst < $tstampLast ? $tstampFirst : $tstampLast;
    */
    //echo "<br>";

    foreach ($results AS $result) {

        if (!$non_wlist && !$result->whitelisted) {
            continue;
        }

        if($CAST_MYSQL_RESULTS) {
            $moder = (bool) ($result->moder);
            $sub = (bool) ($result->sub);
            $turbo = (bool) ($result->turbo);
        }

        echo '<tr id="' . h($result->msg_id). '">';
        $date = strtotime($result->tstamp);
        $tableHeader = date("F Y", $date);
        $tableDivider = date("M j", $date);

        if ($firstTable) {
            $lastTableHeader = $tableHeader;
            $lastTableDivider = "none";
            echo newTable($tableHeader);
            $firstTable = false;
        }

        if (strcmp($tableHeader, $lastTableHeader) != 0) {
            echo $endTable;
            echo newTable($tableHeader);
        }
        if (strcmp($tableDivider, $lastTableDivider) != 0) {
            echo newDivider($tableDivider);
        }





        #$displayedTime = date("g\:i\:s a", $date);

//            $displayedTime = date("g\:i\:", $date)
//                    . "<span style=\"font-size: 12px;\">" . date("s", $date) . "</span>"
//                    . date(" a", $date);
        $arrowTimeDirection = $outer_sort_asc ? "🠗" : "🠕";
        $displayedTimeMin = date("g\:i\ a ", $date);
        $displayedTimeSec = "<span class=\"littleSeconds\">&nbsp" . date("s", $date) . "s</span>";

        echo '<td><a href="' . getLink($result->msg_id, "") .'">'
        . $displayedTimeMin . '</a>' . $arrowTimeDirection
        . '<a>' . $displayedTimeSec . '</a></td>';

        #$user_emote = getImage($result->emote);

        $user_href = SITE . "from/" . date("Y-m-d+H:i:s", $date - 60 * 3) . "/?u1=$result->username#$result->msg_id";
        $user_color = adjustColor($result->color, $ADJUST_COLOR);
        echo userHtml($result->username, $user_href, $user_color, $moder, $sub, $turbo);

        
        $displayed_msg = msgHtml($result->msg, $result->emote_locs);
        if ($highlight_me === 1 && $result->me === '1') {
            $displayed_msg = "<span style=\"color:#$user_color;\">$displayed_msg</span>";
        }
        
        echo '<td>' . $displayed_msg . '</td>';
        echo "</tr>";
        $lastTableHeader = $tableHeader;
        $lastTableDivider = $tableDivider;
    }

    echo $endTable;
} else {
    echo "
    <h2 style=\"text-align: center;\">No Results Found!</h2>    
    <br>
    ";
}

?>
    
    <!----------------------------------------------------------
    ------------------------------------------------------------
    --------    EXAMPLE TABLE
    ------------------------------------------------------------
    ------------------------------------------------------------>
    <!--

    <table class='logTable'>
        <tr>
        <th>Time</th>
        <th>Username</th>
        <th>Message</th>
        </tr>
        <tr>
            <td class='msgTime'>2m 3s</td>
            <td class='msgUser'>
                <img src="https://static-cdn.jtvnw.net/emoticons/v1/25/1.0"/>
                 z33k33</td>
            <td class='msgText'>
                New chat logger 
                <img src="https://static-cdn.jtvnw.net/emoticons/v1/25/1.0"/>
                nice!</td>

        </tr>
        <tr>
            <td class='msgTime'>2m 3s</td>
            <td class='msgUser'>
                <img src="https://static-cdn.jtvnw.net/emoticons/v1/5/1.0" />
                chauzu</td>
            <td class='msgText'>I know, zeekee!  
                <img title='DBstyle' src='../img/emotes-reg/PogChamp.png'/>
                This is so cool I am an atack helicograph please don't tell me that I cab wick so that elaborate
                <img src="https://static-cdn.jtvnw.net/emoticons/v1/89590/1.0" />
                but for what reason it is a mess</td>

        </tr>
        <tr>
            <td class='msgTime'>2m 3s</td>
            <td class='msgUser'>imgOnly</td>
            <td class='msgText'>
                New chat logger 
                <img src="https://static-cdn.jtvnw.net/emoticons/v1/8/1.0" />
                nice!</td>

        </tr>
        <tr>
            <td class='msgTime'>2m 3s</td>
            <td class='msgUser'>image Only</td>
            <td class='msgText'>
                New chat logger <img title='DBstyle' src='../img/emotes-reg/Kappa.png'/> nice!</td>

        </tr>


    </table>
    -->

     <!----------------------------------------------------------
     ------------------------------------------------------------
     --------    PREV / NEXT AND META
     ------------------------------------------------------------
     ------------------------------------------------------------>

<?php

if ($had_results) {
    echo "
    <br>
    <a class=\"arrowUp\" href=\"#top\"></a>
    <div class=\"linkAndMetaBar\">
        <div class=\"leftLink\">
            <a type=\"button\" class=\"$PREV_BUTTON_CLASS\" href=\"$PREV_LINK\">Previous</a>
        </div>
        <div class=\"rightLink\">
           <a type=\"button\" class=\"$NEXT_BUTTON_CLASS\" href=\"$NEXT_LINK\">Next</a>
        </div>

        <div class=\"meta\">
            $meta_info
        </div>
    </div>
    <br>
    ";
}
?>
     