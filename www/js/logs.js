define(['jquery'], 
    function ($) {

    "use strict";
    
    var oldQ1, oldU1, oldDate, isOldDateFromChecked, isOldDateToChecked;
    
    var baseEnd = window.location.href.indexOf('/logs');
    var SITE = window.location.href.substr(0, baseEnd) + '/logs/';
    /*
     * Toggle div element containing additional query fields
     * 
     * PHP will set display:block for this div on a new page IFF one of the relevant queries was non-empty
     */
    function toggleExtraFields() {
        var e = document.getElementById('js-extraFields');
        if (e.style.display === 'block' || e.style.display === '') {
            e.style.display = 'none';
            document.getElementById('js-extraFieldsButton').innerHTML = "+";
            document.getElementById('js-q2').value = "";
            document.getElementById('js-u2').value = "";
            document.getElementById('js-q3').value = "";
            document.getElementById('js-u3').value = "";
        } else {
            e.style.display = 'block';
            document.getElementById('js-extraFieldsButton').innerHTML = "-";
        }
        //this.preventDefault();
        return;
    }

    function toggleHelp() {
        var examples = $("#js-examples");
        
        var $q1 = $("#js-q1");
        var $u1 = $("#js-u1");
        var $date = $("#js-date");
        var $dateFrom = $("#js-dateDirectionFrom");
        var $dateTo = $("#js-dateDirectionTo");
        var $helpButton = $("#js-helpButton");
        
        if ( examples.css("display") === 'block' || examples.css("display") === '' ) {
            examples.css("display", "none");
            $q1.val(oldQ1);
            $u1.val(oldU1);
            $date.val(oldDate);
            $dateFrom.prop("checked", isOldDateFromChecked);
            $dateTo.prop("checked", isOldDateToChecked);
            $helpButton.html("Help");
        } else {
            oldQ1 = $q1.val();
            oldU1 = $u1.val();
            oldDate = $date.val();
            isOldDateFromChecked = $dateFrom.is(":checked");
            isOldDateToChecked = $dateTo.is(":checked");
            examples.css("display", "block");
            $q1.val("=thisWord !thatWord or \"exact phrase\"");
            $u1.val("name1 name2");
            $date.val('4/6/14');
            $dateFrom.prop("checked", true);
            $dateTo.prop("checked", false);

            $helpButton.html("Restore previous");
        }
        //e.preventDefault();
        this.blur();
        return;
    }

    function requestPage(query) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                $('#js-searchResults').html(xmlhttp.responseText);
            }
        };
        xmlhttp.open("GET", "search.php?" + query, true);
        xmlhttp.send();
    }

    /*
     * Determine the url to request from the server, then navigate to it.
     */
    function search(){
        var newUrl = SITE;
        /* Replace spaces in date with + */
        var $date = $('#js-date');
        var $dateDirEarliest = $("#js-dateDirectionEarliest");
        var $dateDirLatest = $("#js-dateDirectionLatest");
        var dateVal = $date.val();
        var isDisplaySortAsc;
        /* put the original value back (in case user presses back button) */
//        dateEl.val = oldJumpVal;
//        console.log(oldQueryArr);
        
        /*
         * Determine whether to search from or to this date.
         * The 'dir=(from|to)' param will help us determine this.
         * Then we will reload the page as *.com/from/2016.../?query
         */
        
        // If no date provided, but user wants earliest results,
        // pretend user provided the start of TPP as the date.
        if (!dateVal) {
            if ($dateDirEarliest.is(":checked")) {
                dateVal = '2014-02-14';
            }
        }
        var isDisplaySortAsc;
        if (!dateVal) {
            // No date provided, shows latest results in descending order
            isDisplaySortAsc = false;
        } else {
            /*
             * assume user wants to see results starting *from* this date 
             * (and displayed in ascending order) unless they checked Latest.
             * 
             * Append a prettier date to the redirect path.
             */
            dateVal = dateVal.replaceAll(" ", "+");  // just because prettier
            dateVal = dateVal.replaceAll("/", "_");  // problematic
            newUrl += (!$dateDirLatest.is(":checked") ? "from" : "to")
                    + "/" + encodeURIComponent(dateVal) + "/";
            isDisplaySortAsc = !$dateDirLatest.is(":checked");
        }
        
//        /*
//         * Create a new query array:
//         * Replace date param with pretty path *.com/from/2016.../?...
//         */
        var newQueryArr = [];
        var oldQueryArr = $('#js-searchForm').serialize().split("&");
        var isBot = false;  // we will set to True if it was checked
        var showCommands = false;  // we will set to True if it was checked
        oldQueryArr.forEach(function(paramAndValue) {
            var valLen = paramAndValue.length;
            if (paramAndValue === 'bot=1') {
                isBot = true;  // default value, don't need in URL
            } else if (paramAndValue === 'cmds=1') {
                showCommands = true;  // default value, don't need in URL
            } else if (paramAndValue.startsWith('dir')) {
                ; // don't need this parameter anymore
            } else if (paramAndValue.startsWith('date')) {
                ; // don't need this parameter anymore
            } else if (paramAndValue[valLen-1] !== '=') {
                // push any param with value after the = sign
                newQueryArr.push(paramAndValue);
            }
        });
        // Add params with non-default values, that aren't in the query yet
        if (!isBot) {
            newQueryArr.push("bot=0");
        }
        if (!showCommands) {
            newQueryArr.push("cmds=0");
        }
        if (isDisplaySortAsc) {
            newQueryArr.push("sort=1");
        }
        
        // assemble and redirect
        var newQueryString = newQueryArr.join("&");
        newUrl += newQueryString.length !== 0 ? "?" : "";
        newUrl += newQueryString;
        console.log("redirecting to " + newUrl);
        window.location.href = newUrl;
    }
    
    function reload() {
//        console.log(window);
//        console.log(window.location);
//        console.log(window.location.href);
//        
        
        var params = new URLSearchParams(window.location.search);
        
        var isBotChecked = $("#js-CheckboxBot").is(":checked");
        var isCommandsChecked = $("#js-CheckboxCommands").is(":checked");
        var isInputsChecked = $("#js-CheckboxInputs").is(":checked");
        var isCharsChecked = $("#js-CheckboxChars").is(":checked");
        // default True
        if (isBotChecked) {
            params.delete('bot');
        } else {
            params.set("bot", 0);
        }
        if (isCommandsChecked) {
            params.delete('cmds');
        } else {
            params.set("cmds", 0);
        }
        // default False
        if (!isInputsChecked) {
            params.delete('inputs');
        } else {
            params.set("inputs", 1);
        }
        if (!isCharsChecked) {
            params.delete('chars');
        } else {
            params.set("chars", 1);
        }
//        if (!isSortAscChecked) {
//            params.delete('sort');
//        } else {
//            params.set("sort", 1);
//        }
        
        var paramStr = params.toString();
        paramStr = paramStr ? "?" + paramStr : paramStr;
        var newUrl = window.location.origin + window.location.pathname +
                paramStr + window.location.hash;
//        console.log(newUrl);
        window.location.href = newUrl;
    }
    
    $(document).ready(function() {
        
        $('#js-searchForm').on('submit', function(e) {
            e.preventDefault();
            search();
        });
        
        //  $('#js-searchButton').on('click', search);
        $('#js-helpButton').on('click', toggleHelp);
        
        $('#js-extraFieldsButton').on('click', toggleExtraFields);
        
        $('#js-reloadButton').on('click', reload);
    });
});