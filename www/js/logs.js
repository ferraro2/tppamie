define(['jquery'], 
    function ($) {

    "use strict";
    
    var oldQ1, oldU1, oldDate, isOldDateFromChecked, isOldDateToChecked;
    
    var baseEnd = window.location.href.indexOf('/logs');
    var SITE = window.location.href.substr(0, baseEnd) + '/logs/';
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
        
        var q1 = $("#js-q1");
        var u1 = $("#js-u1");
        var date = $("#js-date");
        var dateFrom = $("#js-dateDirectionFrom");
        var dateTo = $("#js-dateDirectionTo");
        var helpButton = $("#js-helpButton");
        
        if ( examples.css("display") === 'block' || examples.css("display") === '' ) {
            examples.css("display", "none");
            q1.val(oldQ1);
            u1.val(oldU1);
            date.val(oldDate);
            dateFrom.prop("checked", isOldDateFromChecked);
            dateTo.prop("checked", isOldDateToChecked);
            helpButton.html("Help");
        } else {
            oldQ1 = q1.val();
            oldU1 = u1.val();
            oldDate = date.val();
            isOldDateFromChecked = dateFrom.is(":checked");
            isOldDateToChecked = dateTo.is(":checked");
            examples.css("display", "block");
            q1.val("=thisWord !thatWord OR \"exact phrase\"");
            u1.val("name1 name2");
            date.val('4/6/14');
            dateFrom.prop("checked", false);
            dateTo.prop("checked", false);

            helpButton.html("Restore previous");
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
     * On clicking search, examine all elements of the form and disable them if empty
     * 
     * This cleans up the URL from having many empty values
     */
    function search(){
        /* Replace spaces in date with + */
//        var dateEl = $('#js-date');
//        var oldJumpVal = dateEl.val;
//        console.log(oldJumpVal);
//        dateEl.val = oldJumpVal.replace(" ", "+");
        var oldQueryArr = $('#js-searchForm').serialize().split("&");
        /* put the original value back (in case user presses back button) */
//        dateEl.val = oldJumpVal;
        var newQueryArr = [];
        
        /*
         * Remove all empty variables from old query
         */
        oldQueryArr.forEach(function(val) {
            var valLen = val.length;
            if (val[valLen-1] !== '=') {
                newQueryArr.push(val);
            }
            
        });
        
        var newQueryString = newQueryArr.join("&");
        var dest = SITE;
        dest += newQueryString.length !== 0 ? "?" : "";
        dest += newQueryString;
        window.location.href = dest;
        //requestPage(query);
    }
    
    function reload() {
//        console.log(window);
//        console.log(window.location);
//        console.log(window.location.href);
//        
        
        let params = new URLSearchParams(window.location.search);
        
        let isBotChecked = $("#js-CheckboxBot").is(":checked");
        let isInputsChecked = $("#js-CheckboxInputs").is(":checked");
        let isCharsChecked = $("#js-CheckboxChars").is(":checked");
        let isSortAscChecked = $("#js-CheckboxSort").is(":checked");
        // default True
        if (isBotChecked) {
            params.delete('bot');
        } else {
            params.set("bot", 0);
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
        if (!isSortAscChecked) {
            params.delete('sort');
        } else {
            params.set("sort", 1);
        }
        
        let paramStr = params.toString();
        paramStr = paramStr ? "?" + paramStr : paramStr;
        let newUrl = window.location.origin + window.location.pathname +
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