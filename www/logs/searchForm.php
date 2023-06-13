<!----------------------------------------------------------
------------------------------------------------------------
--------    SEARCH FORM
------------------------------------------------------------
------------------------------------------------------------>

<div id="top"></div>
<form id="js-searchForm" class="searchForm" method="get">
    <div>
    <h2>Search For:</h2>
    <div>
        <input id="js-q1" type="text" name="q1" tabindex="1" value="<?php echo h($q1) ?>" 
               class="logTextField form-query tooltip"/>
        <button type="button" id="js-helpButton" class="helpButton clickableButton redButton"
           tabindex ="-1">Help</button>
    </div>
    </div>
   <h2>By Users:</h2>
   <div>
        <input type="text" id="js-u1" name = "u1" tabindex="2" value="<?php echo h($u1) ?>" 
               class="logTextField form-user tooltip"/>
        <button type="button" id="js-extraFieldsButton" 
                class="extraFieldsButton clickableButton blueButton" 
                tabindex ="-1" ><?php echo $EXTRA_FIELDS_BUTTON_VALUE ?></button>
   </div>
   <div id="js-extraFields" class="extraFields" style="<?php echo $EXTRA_FIELDS_DISPLAY ?>">
       <h1>Additional search fields:</h1>
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
       <br>
   </div>
   <div style="float: left;">
        <h2> Starting from Date:</h2>
        <input type="text" id="js-date" name="date" tabindex="3" 
           value="" 
           class="logTextField form-date tooltip"/>
    <!--           <input type="text" id="js-date" name="date" 
           value="<?php echo restoredDate($from_date, $to_date)?>" 
           class="logTextField form-date tooltip"/>-->

        <h3>&nbsp;&nbsp;&nbsp;or from:
        <input id="js-dateDirectionFrom" type="radio" name="dir" 
               tabindex="4" value="from" <?php echo $from_checked?>>
        <span class="dateDirection dateDirectionFrom">Earliest</span>

        <input id="js-dateDirectionTo" type="radio" name="dir"
               tabindex="5" value="to" <?php echo $to_checked?>>
        <span class="dateDirection dateDirectionTo">Latest</span>
        </h3>
    </div>

   
   <div class="searchOptions">
       <!----------------------------------------------------------
       ------------------------------------------------------------
       --------    EXTRA FIELDS
       ------------------------------------------------------------
       ------------------------------------------------------------>

        <input id="js-CheckboxBot" type="checkbox" class="options" tabindex="20"
               name="<?php echo $query_options->show_tpp_bot->name?>" value="1" 
             <?php echo $query_options->show_tpp_bot->val_checked_str ?> > TPP bot messages
        <br> 
        <input id="js-CheckboxInputs" type="checkbox" class="options" tabindex="21"
               name="<?php echo $query_options->show_game_inputs->name ?>" value="1"
             <?php echo $query_options->show_game_inputs->val_checked_str ?> > Game inputs <i>(up, !a, !bet, !balance, etc.)</i>
        <br> 
        <input id="js-CheckboxCommands" type="checkbox" class="options" tabindex="22"
               name="<?php echo $query_options->show_commands->name ?>" value="1"
             <?php echo $query_options->show_commands->val_checked_str ?> > Commands <i>(anything starting with !)</i>
        <br> 
        <input id="js-CheckboxChars" type="checkbox" class="options" tabindex="23"
               name="<?php echo $query_options->show_unwhitelisted_chars->name ?>" value="1"
            <?php echo $query_options->show_unwhitelisted_chars->val_checked_str ?> > ASCII spam / unnatural characters
        <br>
        <!--<div class="orderOptions">-->
<!--        <input id="js-CheckboxSort" type="checkbox" class="options" 
               name="<?php echo $query_options->display_sort_asc->name ?>" value="1"
             <?php echo $query_options->display_sort_asc->val_checked_str ?> > Display in chronological order-->
        <!--</div>-->
        <input id="js-reloadButton" type="button" name="reload" tabindex="-1"
               class="clickableButton reloadButton blueButton" 
               value="⟳"/><span class="reloadText">Apply to current results</span>
<!--         <input type="checkbox" class="options" name="wlist" value="1" <?php echo $non_wlist_check ?> > Show non-whitelisted -->
<!--         <br> -->
<!--         <input type="checkbox" class="options" name="me" value="1" <?php echo $highlight_me_check ?> > Highlight /me -->
       
       
   </div>
   <div class="searchButtonContainer">
        <input id="js-searchButton" type="submit" name="search" tabindex="6" 
            class="searchButton clickableButton" value="Search"/>
   </div>
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
   <p><b><i>Starting from date: </b></i><u>2014-04-06 00:00:00 UTC</u> 
   (Type your date in any way- "June 6 2015", etc.)</p>
   <p>&nbsp;&nbsp;&nbsp;When you type in a date:</p>
   <p>&nbsp;&nbsp;&nbsp;- selecting <b><i>From Date</b></i> (or not making a selection) shows messages starting from that date</p>
   <p>&nbsp;&nbsp;&nbsp;- selecting <b><i>To Date</b></i> shows messages up until that date</p>
   <p>&nbsp;&nbsp;&nbsp;When you leave the date blank:</p>
   <p>&nbsp;&nbsp;&nbsp;- selecting <b><i>From Date</b></i> shows messages from the <u>beginning of time</u></p>
   <p>&nbsp;&nbsp;&nbsp;- selecting <b><i>To Date</b></i> (or not making a selection) shows messages to the <u>end of time</u></p>
   <h2>Page Links</h2>
   <ul>
       <li>Click the <b><u>hour:minutes AM/PM</b></u> to the left of a message to see all chatlogs
           at the time of that message.</li>
       <li>Click the <b><u>seconds</b></u> to the left of a message to see the video at 
           the time of that message.  Not all messages have video available.</li>
       <li>Click the <b><u>🠕</b></u> or <b><u>🠗</b></u> arrow between the above two to reload the page at this message with the 
           chronological order of messages reversed.
       <li>Click any <b><u>username</b></u> to see that user's chatlogs at the time of 
           that message.</li>
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
           of type: <i>!bet</i>, <i>!balance</i>, <i>!aubl</i>, and <i>!move a</i>.<br>
           It also doesn't filter most democracy inputs because they overlap
           heavily with real words.<br>
           It also doesn't filter game inputs containing additional text after 
           the input.
       </li>
       <li><u>Display in chronological order</u> determines the order in which
           the results of current page are displayed. <br>
           Clicking the little arrow between <b><u>11:00 pm 🠕 00s</b></u> 
            has the same effect, and inverts this selection.<br>
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
       remove them promptly, no questions asked.<br>
      If you prefer, I can also remove individual messages of your choice, 
      or all messages in any specified time range.<br>
      I do not disclose who has made requests or what they requested.
   </p>
   <p>This site provides an identical experience for all its visitors 
       (e.g., there are no special hidden features for moderators or anyone else).<br>
       Your activity on this site will not be exposed to any other party, in any way.</p>
   <h2>Source Code</h2>
   <p><a href="https://github.com/ferraro2/tppamie">The source for 
           this entire site is available on Github.</a></p>
   <p>Search functionality is performed by SphinxSearch.</p>
   
</div>