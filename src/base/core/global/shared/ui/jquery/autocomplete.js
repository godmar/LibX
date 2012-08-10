/**
 * Auto-complete field.
 * This code is based on sample source code provided by fromvega.
 * http://fromvega.com/wordpress/2007/05/05/auto-complete-field-with-jquery-json-php/
 * Search for the complete article at http://www.fromvega.com
 *
 * @param  {Object} $               the jQuery object
 * @param  {Object} options         parameter object
 * @config {Object} field           jQuery link element where the dropdown will be created
 * @config {Function} make_url      function executed when the user has inputted a partial search.
 *                                  takes one parameter, the search string, and
 *                                  returns a url containing JSON results for
 *                                  the search.
 * @config {Array} formatter        formatter function that accepts a single result to format
 * @config {Function(item)} select  callback function when an item is selected
 */
libx.ui.jquery.autocomplete = function ($, options)
{
	
    var acListTotal   =  0;
    var acListCurrent = -1;
    var acDelay       = 500;

    // create the results div
    var acResultsDiv = $('<div class="results" />'); 
    $("body").append(acResultsDiv);
    
    // register mostly used vars
    var acSearchField   = options.field;

    // clear auto complete box
    function clearAutoComplete()
    {
        acResultsDiv.html('');
        acResultsDiv.css("display", "none");
    }

    // reposition the results div accordingly to the search field
    function repositionResultsDiv()
    {
        // get the field position
        var sf_pos    = acSearchField.offset();
        var sf_top    = sf_pos.top;
        var sf_left   = sf_pos.left;
        
        // get the field size
        var sf_height = acSearchField.height();
        var sf_width  = acSearchField.width();

        // apply the css styles - optimized for Firefox
        acResultsDiv.css("position", "absolute");
        acResultsDiv.css("left", sf_left);
        acResultsDiv.css("top", sf_top + sf_height + 6);
        acResultsDiv.css("width", sf_width + 2);
    }
    
    // on blur listener
    acSearchField.blur(function(){ libx.utils.timer.setTimeout(clearAutoComplete, 200) });

    // on key up listener
    acSearchField.keyup(function (e) {

        // get keyCode (window.event is for IE)
        var keyCode = e.keyCode || window.event.keyCode;
        var lastVal = acSearchField.val();

        // check an treat up and down arrows
        if(enterKey(keyCode)) {
            return;
        }
        
        // check an treat up and down arrows
        if(updownArrow(keyCode)){
            return;
        }

        // check for an ENTER or ESC
        if(keyCode == 27){
            clearAutoComplete();
            return;
        }

        // if is text, call with delay
        libx.utils.timer.setTimeout(function () {autoComplete(lastVal)}, acDelay);
    });

    // treat up and down key strokes defining the next selected element
    function updownArrow(keyCode) {
        if(keyCode == 40 || keyCode == 38){

            if(keyCode == 38){ // keyUp
                if(acListCurrent == 0 || acListCurrent == -1){
                    acListCurrent = acListTotal-1;
                } else{
                    acListCurrent--;
                }
            } else { // keyDown
                if(acListCurrent == acListTotal-1){
                    acListCurrent = 0;
                } else {
                    acListCurrent++;
                }
            }

            // loop through each result div applying the correct style
            acResultsDiv.children().each(function(i){
                if(i == acListCurrent){
                    acSearchField.val($(this).text());
                    this.className = "selected";
                } else {
                    this.className = "unselected";
                }
            });

            return true;
        } else {
            // reset
            acListCurrent = -1;
            return false;
        }
    }

    // treat up and down key strokes defining the next selected element
    function enterKey(keyCode) {
        if(keyCode == 13) { // enter key

            acResultsDiv.children().each(function(i){
                if(i == acListCurrent){
                    acSearchField.val($(this).text());
                    options.select(acResultsDiv.children()[i].item);
                    clearAutoComplete();
                }
            });

            return true;
        } else {
            return false;
        }
    }
    
    // treat the auto-complete action (delayed function)
    function autoComplete(lastValue)
    {
        
        // if user hides search during delay time, don't show results
        if(!acSearchField.is(':visible'))
            return;
        
        // get the field value
        var part = acSearchField.val();

        // if it's empty clear the resuts box and return
        if(part == ''){
            clearAutoComplete();
            return;
        }

        // if it's equal the value from the time of the call, allow
        if(lastValue != part){
            return;
        }

        // get remote data as JSON
        function processResult(json) {

            // reposition div
            repositionResultsDiv();
        	
            // get the total of results
            var ansLength = acListTotal = json.length;

            // if there are results populate the results div
            if(ansLength > 0){

                // clear the current results
                acResultsDiv.empty();
                
                // create a div for each result
                for(i = 0; i < ansLength; i++) {
                    var div = $('<div class="unselected" />');
                    div.append(options.formatter(json[i]));
                    div[0].item = json[i];
                    acResultsDiv.append(div);
                }

                // update the results div
                acResultsDiv.css("display", "block");
                
                // for all divs in results
                var divs = $("div", acResultsDiv);
            
                // on mouse over set selection
                divs.mouseover( function() {
                    this.className = "selected";
                });
            
                // on mouse out, deselect item
                divs.mouseout( function() {
                    this.className = "unselected";
                });
                
                // on click copy the result text to the search field and hide
                divs.click( function() {
                    acSearchField.val($(this).text());
                    clearAutoComplete();
                    options.select($(this)[0].item);
                });

            } else {
                clearAutoComplete();
            }
        }

        if (options.xhrUnrestricted) {
            $.get(options.make_url(part).replace(/&?(\s+)=\?/, ""), function (data) {
                processResult(libx.utils.json.parse(data));
            });
        } else {
            $.getJSON(options.make_url(part), processResult);
        }
    }
}
