<?php

/***********************************************************
***********************************************************
*      TABLE FUNCTIONS
***********************************************************
***********************************************************/

//create a new table
function newTable($header) {
   return "
   <h2>".$header."</h2>
    <div class='tableContainer'>
   <div class='leftBar'></div>
   <div class='rightBar'></div>
   <table class='logTable'>
   <tr>
   <th>Time & &nbsp;<img class=\"iconVod\" width=\"16\" src=\"/img/icon_vod.png\"</img></th>
   <th>Username</th>
   <th>Message</th>
   </tr>";
}
$endTable = "</table></div>";

/*
* Return html for a table row, that acts as a in-table divider
*/
function newDivider($divider) {
   return "<tr class='invisibleRow'></tr>"
           . "<tr class='rowDivider'>"
           . "<td class='divider'>$divider</td>"
           . "<td class='divider'></td>"
           . "<td class='divider'></td>"
           . "</tr>";
}

/***********************************************************
***********************************************************
*      MESSAGE HTML FUNCTIONS
***********************************************************
***********************************************************/
//array to adjust username colors
$ADJUST_COLOR = array(
   'ff4500' => 'f04500',
   'ff7f50' => 'e05f30',
   '54ff9f' => '84d85f',
   '00ff00' => '00b000',
   '00ff7f' => '00d87f',
   '0000ff' => '0000e0'
);

// $TWITCH_COLORS = ['0000ff', 'ff7f50', '1e90ff', '00ff7f', '9acd32', '00ff00', 'ff4500', 'ff0000', 'daa520', 'ff69b4', '5f9ea0', '54ff9f', 'd2681e', '8a2be2', 'b22222'];
// $TWITCH_COLORS_LEN = count($TWITCH_COLORS);

function adjustColor($color, $ADJUST_COLOR) {
   #, '1e90ff', '00ff7f', '9acd32', '00ff00', 'ff4500', 'ff0000', 'daa520', 'ff69b4', '5f9ea0', '54ff9f', 'd2681e', '8a2be2', 'b22222'];
   if (array_key_exists($color, $ADJUST_COLOR)) {
       return $ADJUST_COLOR[$color];
   } 
   
   return $color;
}

function blist_misty($str) {
   return stripos($str, 'misty') !== false ||
           stripos($str, 'mist') !== false && stripos($str, 'fist') !== false;
}
function blist_unicode($str) {
   return !mb_check_encoding($str, 'ASCII');
}
function blist_url($str) {
   return stripos($str, 'http') !== false;
}

function getEmoteImg($image_id, $emote_name) {
    return getImg("https://static-cdn.jtvnw.net/emoticons/v2/$image_id/default/light/1.0", $emote_name);
    /*
    if ($image_id === 0 or gettype($image_id) !== 'integer') {
        return '';
    } 

    /*
    if ($image_id >= 2000000) {
        return getImg("/img/emotes-numbered/1.0/$image_id.png", $emote_name);
    } else {
        return getImg("https://static-cdn.jtvnw.net/emoticons/v1/$image_id/1.0", $emote_name);
    }
    */
}

function getImg($src, $name) {
    $escaped_name = h($name);
    return "<img src=\"$src\" title=\"$escaped_name\" alt=\"$escaped_name\"/>";
}

function userHtml($name, $href, $color, $mod, $sub, $turbo) {
    $ret = '<td>';
    if ($mod)
        $ret .= ' ' . getImg("https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1", 'Moderator');
    if ($sub)
        $ret .= ' ' . getImg("https://static-cdn.jtvnw.net/jtv_user_pictures/badges/1591/18x18.png", 'Subscriber');
    //if ($turbo)
      //  $ret .= ' ' . getImg("https://static-cdn.jtvnw.net/chat-badges/turbo.png", 'Turbo');
   
    $ret .= " <a href=\"$href\" style=\"color:#$color\">$name</a>";
    $ret .= "</td>";
    return $ret;
}

function my_mb_substr_replace($str, $replace, $posOpen, $len) { 
   return mb_substr($str, 0, $posOpen, "UTF-8")
       . $replace
       . mb_substr($str, $posOpen + $len, NULL, "UTF-8");
} 

function linkEscape($msg) {
   $arr = explode(" ", $msg);
   foreach($arr as $i => $str) {
       if (preg_match('/^(https?:\/\/|www\.)\S+$/i', $str) &&
           ! preg_match('/(porn|naked|nude|virus|redtube|misty|brazzer|xnxx)/i', $str)) {
           $firstChars = mb_substr($str, 0, 4, "UTF-8");
           #echo "<br>" . $firstChars;
           $linkStart = (strcmp($firstChars, "http") === 0) ? "" : "http://";
           $arr[$i] = '<a href="' . $linkStart . h($str) . '">' . h($str) . "</a>";
       } else{
           $arr[$i] = h($str);
       }
   }
   return " " . implode(" ", $arr) . " ";
}

function msgHtml($msg, $emote_locs) {
   $replace = [];
   preg_match_all('/([^:]+):([^\/]+)/', $emote_locs, $emotes_list, PREG_SET_ORDER);
   foreach ($emotes_list as $emote_info) {
       #$msg =  "Matched: <" . $emote_info[0] . ">\n" . $msg;
       $emote_id = $emote_info[1];
       $emote_data = $emote_info[2];
       preg_match_all('/(\d+)-(\d+)/', $emote_data, $occur_list, PREG_SET_ORDER);
       foreach ($occur_list as $occur) {
           $start = intval($occur[1]);
           $end = intval($occur[2]);
           $replace[$start] = array($emote_id, $start, $end-$start+1);
       }
   }

   krsort($replace);
   $msgParts = [];
   $earliestIndexProcessed = mb_strlen($msg, "UTF-8");

   foreach($replace as list($emote_id, $start, $len)) {
       #if msg is too long, treat as text
       if ($start + $len > 1023) {
           $earliestIndexProcessed = $start;
           continue;
       }
       #push text after emote to ret
       $afterEmoteTextStart = $start + $len;
       $afterEmoteText = mb_substr($msg, $afterEmoteTextStart, $earliestIndexProcessed - $afterEmoteTextStart, "UTF-8");
       array_push($msgParts, linkEscape($afterEmoteText));

       #push emote to ret
       $emote_text = mb_substr($msg, $start, $len, "UTF-8");
       array_push($msgParts, getEmoteImg($emote_id, $emote_text));

       #update earliestIndexProcessed
       $earliestIndexProcessed = $start;
   }
   $beforeEmoteText = mb_substr($msg, 0, $earliestIndexProcessed, "UTF-8");
   array_push($msgParts, linkEscape($beforeEmoteText) );

   $msgHtmlArr = [];
   for ($i = count($msgParts) - 1; $i >= 0; $i--) {
       array_push($msgHtmlArr, $msgParts[$i]);
   }

   $msgHtml = implode("", $msgHtmlArr);

   return trim($msgHtml);# . "<br>" . $emote_locs;
}

function getJumpLink($options_only_query) {
    return SITE . "/$options_only_query";
}
    
function getJumpToIdLink($id, $options_only_query) {
    return SITE . "id/" . ($id) . "/$options_only_query#$id";
}

function getVodLink($id, $offset) {
    return $id? "https://www.twitch.tv/videos/$id?t={$offset}s" : null;
}

?>