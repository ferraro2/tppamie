<!----------------------------------------------------------
------------------------------------------------------------
--------    SEARCH FORM
------------------------------------------------------------
------------------------------------------------------------>

<div id="top"></div>
<form id="js-searchForm" class="searchForm" method="get">
    <h2>Search For:</h2>
   <input id="js-q1" type="text" name="q1" value="<?php echo h($q1) ?>" class="logTextField form-query tooltip"/>

   <button type="button" id="js-helpButton" class="helpButton" tabindex ="-1" onclick="toggle_help();">Help</button>

   <br>

   <h2>By Users:</h2>
   <input type="text" id="js-u1" name = "u1" value="<?php echo h($u1) ?>" class="logTextField form-user tooltip"/>

   <!--<button type="button" id="js-extraFieldsButton" class="extraFieldsButton" tabindex ="-1" ><?php echo $EXTRA_FIELDS_BUTTON_VALUE ?></button>-->

   <br>


   <div class="searchOptions">
       <!----------------------------------------------------------
       ------------------------------------------------------------
       --------    EXTRA FIELDS
       ------------------------------------------------------------
       ------------------------------------------------------------>
<!--       <h1>Additional search fields:</h1>
       <input id="js-q2" type="text" name="q2" value="<?php echo h($q2) ?>" class="logTextField form-query tooltip"/>
       <br>
       <div class="smallBr"></div>
       <h2>By Users:</h2>
       <input type="text" id="js-u2" name = "u2" value="<?php echo h($u2) ?>" class="logTextField form-user tooltip"/>
       <br>
       <br>
       <input id="js-q3" type="text" name="q3" value="<?php echo h($q3) ?>" class="logTextField form-query tooltip"/>
       <br>
       <div class="smallBr"> </div>
       <h2>By Users:</h2>
       <input type="text" id="js-u3" name = "u3" value="<?php echo h($u3) ?>" class="logTextField form-user tooltip"/>
       <br>-->
        <input type="checkbox" class="options" 
               name="<?php echo $query_flags->show_tpp_bot->name?>" value="1" 
             <?php echo $query_flags->show_tpp_bot->val_checked_str ?> > TPP bot messages
        <br> 
        <input type="checkbox" class="options" 
               name="<?php echo $query_flags->show_game_inputs->name ?>" value="1"
             <?php echo $query_flags->show_game_inputs->val_checked_str ?> > Game inputs <i>(up, !a, !bet, !balance, etc.)</i>
        <br> 
        <input type="checkbox" class="options" 
               name="<?php echo $query_flags->show_unwhitelisted_chars->name ?>" value="1"
            <?php echo $query_flags->show_unwhitelisted_chars->val_checked_str ?> > ASCII spam / unnatural characters
        <br><br>
        <input type="checkbox" class="options" 
               name="<?php echo $query_flags->display_sort_asc->name ?>" value="1"
             <?php echo $query_flags->display_sort_asc->val_checked_str ?> > Display in chronological order
        <br>
        
<!--         <input type="checkbox" class="options" name="wlist" value="1" <?php echo $non_wlist_check ?> > Show non-whitelisted -->
<!--         <br> -->
<!--         <input type="checkbox" class="options" name="me" value="1" <?php echo $highlight_me_check ?> > Highlight /me -->
       
       
   </div>
   <div style="float:left;">
       <h2> 
       <span id="js-jumpRadio" class="sortBy">
           <input type="radio" name="dateRadio" value="from" 
                  class="dateRadioFrom"><span class="dateFromTo">From Date:</span>
           
           <input type="radio" name="dateRadio" value="to" 
                  class="dateRadioTo"><span class="dateFromTo">To</span>
           Date:
       </span>
       </h2>
       <div style="float: left;">
           <input type="text" id="js-date" name="date" value="" 
                  class="logTextField form-date tooltip"/>
       </div>
       
       
   </div>

    <input id="js-searchButton" type="submit" name="search" 
        class="searchButton" value="Search"/>
   
   
   

   <div style="clear:left;"></div>
</form>

<!----------------------------------------------------------
------------------------------------------------------------
--------    EXAMPLES BOX
------------------------------------------------------------
------------------------------------------------------------>

<div id="js-examples" class="examples" style="display:none;">
   <h1>How to Search</h1>
   <h2>Example</h2>
   <p>The query above returns:</p>
   <p><b><i>Messages with: </b></i>(<i>exactly</i> <u>thisWord</u> <i>and not</i> <u>thatWord</u>)
       <i>or</i> (<u>"Exact phrase"</u>) </p>
   <p><b><i>Sent by users: </b></i><u>name1</u> <i>or</i> <u>name2</u></p>
   <p><b><i>From Date: </b></i><u>2014-04-06 00:00:00 UTC</u> (Type your date in any way- "June 6 2015", etc.)</p>
   <p>&nbsp;&nbsp;&nbsp;If you leave the date blank:</p>
   <p>&nbsp;&nbsp;&nbsp;- selecting <b><i>From Date</b></i> shows messages from the <u>beginning of time</u></p>
   <p>&nbsp;&nbsp;&nbsp;- selecting <b><i>To Date</b></i> shows messages to the <u>end of time</u></p>
   <p>&nbsp;&nbsp;&nbsp;- selecting neither shows messages to the <u>end of time</u></p>
   <h2>Page Links</h2>
   <ul>
       <li>Click the <b><u>hour:minutes AM/PM</b></u> time to the left of a message to see all chatlogs
           at the time of that message, with the search criteria removed.</li>
       <li>Click the <b><u>seconds</b></u> time to the left of a message to see the video at 
           the time of that message.  Not all messages have video available.</li>
       <li>Click any <b><u>username</b></u> to see that user's chatlogs at the time of 
           that message, with the search criteria removed.</li>
       <li>The <i><u>Previous</i></u> button always links to messages 
           prior in time. <i><u>Next</i></u> works respectively.</li>
       <li>Click the green arrows on the right to jump to the bottom / 
           top of this webpage.</li>
       
   </ul>
       <h2>Checkboxes</h2>
   <ul>
       <li><u>TPP bot messages</u> filters messages from: tpp, tppinfobot,
           tppbankbot, and tppbalancebot.</li>
       <li><u>Game inputs</u> doesn't filter !-prefixed commands beyond those
           similar to: <i>!bet</i>, <i>!balance</i>, <i>!aubl</i>, and <i>!move a</i>.<br>
           It also doesn't filter most democracy inputs because they overlap
           heavily with real words.<br>
           It also doesn't filter game inputs containing additional text after 
           the input.
       </li>
       <li><u>Display in chronological order</u> determines the order in which
           the results of current page are displayed. <br>
           The little arrow between <b><u>11:00 pm 🠕 00s</b></u> 
            reflects this order. <br>
           Set this to the desired value before clicking <b>Search</b> for it 
           to affect your results.
       </li>
   </ul>
       <h2>Other</h2>
   <ul>
       <li>All times are in UTC.</li>
       <li>Use | for a high-precedence <b>OR</b> operator. 
           You can use parenthesis with this style as well.<br>
           Parenthesis are <b>not</b> compatible with the low-precedence <b>OR</b>.</li>
   </ul>
<!--   <p>This page has two modes- browsing logs and search. </p>
   <p>Within each page:<br>
        - Search results may be sorted in time descending order as appropriate.<br>
        - Log browsing are always sorted in time ascending order.<br></p>-->
   
   <h1>General info</h1>
   <h2>Contact</h2>
   <p>I'm ferraro2 and I run this site on my own.</p>
   <p>Feel free to <a href="https://www.discordapp.com/users/ferraro2#2257">contact me on Discord</a> 
       or <a href="https://www.twitch.tv/ferraro2">Twitch</a>.</p>
   <p>This website is not affiliated with TwitchPlaysPokémon.</p>
   <h2>Privacy</h2>
   <p>To have all your messages removed from this site, just whisper me from the 
       Twitch account in question. Then let me know on Discord, and I will 
       remove them promptly, no questions asked.</p>
   <p>This site provides an identical experience for all its visitors.  
       Your activity on this site will not be exposed to any other party, in any way.</p>
   <h2>Source Code</h2>
   <p><a href="https://github.com/ferraro2/tppamie">The source for 
           this entire site is available on Github.</a></p>
   <p>Search functionality is performed by SphinxSearch.</p>
   
</div>