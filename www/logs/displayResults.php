 
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
               <a type=\"button\" class=\"resultsButton $PREV_BUTTON_CLASS\" href=\"$PREV_LINK_TOP\">Previous</a>       
           </div>
           <div class=\"rightLink\">
              <a type=\"button\" class=\"resultsButton $NEXT_BUTTON_CLASS\" href=\"$NEXT_LINK_TOP\">Next</a>
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

    /***********************************************************
     ***********************************************************
     *      CREATE HTML FROM RESULTS
     ***********************************************************
     ***********************************************************/
    
    $header_meta_content = "";
    if($had_results) {
        $firstTable = true;

        /*
        $tstampFirst = reset($results)->tstamp;
        $tstampLast = end($results)->tstamp;
        $tstampEarliest = $tstampFirst < $tstampLast ? $tstampFirst : $tstampLast;
        */
        //echo "<br>";

    //    $time_pre = microtime(true);
        foreach ($results AS $result) {
    //        if (false && !$flag_has_unwhitelisted_chars && !$result->has_unwhitelisted_chars) {
    //            continue;
    //        }

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
            $arrowTimeDirection = $flag_display_sort_asc ? "&#129047;" : "&#129045;";
            $arrowTimeHtml = '<a href="' . $reverse_display_sort_url
                     . '#' . $result->msg_id 
                    . '" class="uncoloredLink">' . $arrowTimeDirection . '</a>';

            $displayedTimeMin = date("g\:i\ a ", $date);
            $displayedTimeSec = "<span class=\"littleSeconds\">&nbsp" . date("s", $date) . "s</span>";

            echo '<td><a href="' . getJumpToIdLink($result->msg_id, $flags_only_query) .'">'
            . $displayedTimeMin . '</a>' . $arrowTimeHtml;

            $vodLink = getVodLink($result->video_id, $result->video_offset_seconds);
            echo $vodLink ? '<a href="' . $vodLink . '">' . $displayedTimeSec . '</a>' : $displayedTimeSec;
            echo '</td>';

            #$user_emote = getImage($result->emote);

            $user_href = SITE . "from/" . date("Y-m-d+H:i:s", $date - 60 * 3) 
                    . "/?u1=$result->username"
                    . ($flags_only_query 
                            ? "&" . substr($flags_only_query, 1) 
                            : "")
                    . "#$result->msg_id";
            $user_color = adjustColor($result->color, $ADJUST_COLOR);
            echo userHtml($result->username, $user_href, $user_color, 
                    $result->display_name, $result->badge_ids, 
                    $result->badge_titles, $result->badge_url_ids);


            $displayed_msg = msgHtml($result->msg, $result->emote_locs);
            //if ($highlight_me === 1 && $result->me === '1') {
            if ($result->is_action === '1') {  // just always italicize it
                $displayed_msg = "<span style=\"font-style: italic;\">$displayed_msg</span>";
            }

            if ($result->msg_id === $jump_str) {
                $header_meta_content = "$result->username: " . trim(h($result->msg));
            }
            
            // old /me highlight code
    //        else if ($result->is_action === '1') {
    //            $displayed_msg = "<span style=\"color:#$user_color;\">$displayed_msg</span>";
    //        }

            echo '<td>' . $displayed_msg . '</td>';
            echo "</tr>";
            $lastTableHeader = $tableHeader;
            $lastTableDivider = $tableDivider;
        }

    //    $time_post = microtime(true);
    //    echo "<br>displayresults took " . ($time_post - $time_pre) . " s<br>";
        echo $endTable;
    } else {
        echo "
        <h2 style=\"text-align: center;\">No Results Found!</h2>    
        <br>
        ";
    }

             /*----------------------------------------------------------
             ------------------------------------------------------------
             --------    PREV / NEXT AND META
             ------------------------------------------------------------
             -----------------------------------------------------------*/

    if ($had_results) {
        echo "
        <br>
        <a class=\"arrowUp\" href=\"#top\"></a>
        <div class=\"linkAndMetaBar\">
            <div class=\"leftLink\">
                <a type=\"button\" class=\"resultsButton $PREV_BUTTON_CLASS\" href=\"$PREV_LINK_BOTTOM\">Previous</a>
            </div>
            <div class=\"rightLink\">
               <a type=\"button\" class=\"resultsButton $NEXT_BUTTON_CLASS\" href=\"$NEXT_LINK_BOTTOM\">Next</a>
            </div>

            <div class=\"meta\">
                $meta_info
            </div>
        </div>
        <br>
        ";
    }

    $pg = ob_get_contents();
    ob_end_clean();
    if ($header_meta_content) {
        if (mb_strlen($header_meta_content, "UTF-8") > 120) {
            $header_meta_content = mb_substr($header_meta_content, 0, 120) . "...";
        }
        
        $header_meta_original = 'Searchable chat logs for Twitch Plays Pokémon.';
        $replacement = 'Searchable chat logs for Twitch Plays Pokémon.\n' . $header_meta_content;
        
        $header_meta_prefix = '<meta property="og:description" content="';
        $pos = strpos($pg, $header_meta_prefix . $header_meta_original);
        if ($pos !== false) {
            $pg = substr_replace($pg, $header_meta_prefix . $replacement, $pos, strlen($header_meta_prefix . $header_meta_original));
        }
        $header_meta_prefix = '<meta name="description" content="';
        $pos = strpos($pg, $header_meta_prefix . $header_meta_original);
        if ($pos !== false) {
            $pg = substr_replace($pg, $header_meta_prefix . $replacement, $pos, strlen($header_meta_prefix . $header_meta_original));
        }
    }
    echo $pg;

?>
     