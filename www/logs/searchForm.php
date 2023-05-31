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

   <button type="button" id="js-extraFieldsButton" class="extraFieldsButton" tabindex ="-1" ><?php echo $EXTRA_FIELDS_BUTTON_VALUE ?></button>

   <br>


   <div id="js-extraFields" class="extraFields" style="<?php echo $EXTRA_FIELDS_DISPLAY ?>">
       <!----------------------------------------------------------
       ------------------------------------------------------------
       --------    EXTRA FIELDS
       ------------------------------------------------------------
       ------------------------------------------------------------>
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
       <br>
   </div>
   <h2>Starting from Date:</h2>
   <div style="float:left;">
       <div style="float: left;">
           <input type="text" id="js-date" name="date" value="" class="logTextField form-date tooltip"/>
       </div>
       <div style="clear:left;" id="js-jumpRadio" class="sortBy">
       <h3>or from:</h3>
           <input type="radio" name="sort" value="earliest"> Earliest
           <input type="radio" name="sort" value="latest"> Latest
       </div>
       
        <input type="checkbox" class="options" name="wlist" value="1" <?php echo $non_wlist_check ?> > Show non-whitelisted
        <br>
        <input type="checkbox" class="options" name="me" value="1" <?php echo $highlight_me_check ?> > Highlight /me
       
       
   </div>
   <div style="float:left;">
       <input id="js-searchButton" type="submit" name="search" class="searchButton" value="Search"/>
   </div>

   <div style="clear:left;"></div>
</form>

<!----------------------------------------------------------
------------------------------------------------------------
--------    EXAMPLES BOX
------------------------------------------------------------
------------------------------------------------------------>

<div id="js-examples" class="examples" style="display:none;">
   <h3>The sample query above returns:</h3>
   <p>( <b>exactly</b> thisWord <b>AND not</b> thatWord  )
       &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
       <b>OR</b></p>
   <p>( "Exact phrase") </p>
   <h3>Sent by users:</h3>
   <p>name1 <b>OR</b> name2</p>
   <h3>Starting from Date:</h3>
   <p>2014-04-06 00:00:00 (Type your date in any way- "June 6 2015", etc.)</p>
   <h3>Other search info...</h3>
   <p>This page has two modes- browsing logs and search. </p>
   <p>Within each page:<br>
        - Search results may be sorted in time descending order as appropriate.<br>
        - Log browsing are always sorted in time ascending order.<br></p>
    <p>For both modes, "Prev" links to messages prior in time. "Next" works respectively.
   </p>
   <p>Use | for a high-precedence <b>OR</b> operator. You can use parenthesis with this style as well.</p>
   <p>Parenthesis are <b>not</b> compatible with the low-precedence <b>OR</b>.</p>
</div>