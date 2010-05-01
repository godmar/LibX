/**
 * Drop-down box
 *
 * This code is based on sample source code provided by fromvega.
 * http://fromvega.com/wordpress/2007/05/05/auto-complete-field-with-jquery-json-php/
 * Search for the complete article at http://www.fromvega.com
 *
 * Enjoy!
 *
 * @author fromvega
 *
 */

libx.ui.jquery.dropdown = function ($, options)
{
	
    var acListTotal   =  0;
    var acListCurrent = -1;

    // create the results div
    var acResultsDiv = $('<div class="results" />'); 
    $("body").append(acResultsDiv);
    
    // register mostly used vars
    var acSearchField   = options.field;

    // populate results box
    for(var i in options.dropdown_items) {
        
        var div = $('<div class="unselected" />');
        var itemText = options.dropdown_items[i];

        div.text(itemText);
        (function(i, itemText) {
            div.click(function() {
                acSearchField.text(itemText);
                clearResults();
                if(options.select)
                    options.select(i, itemText);
            });
        }) (i, itemText);
        
        // on mouse over set selection
        div.mouseover( function() {
            this.className = "selected";
        });

        // on mouse out, deselect item
        div.mouseout( function() {
            this.className = "unselected";
        });
        
        acResultsDiv.append(div);
    }
    
    acSearchField.click(function() {
        repositionResultsDiv();
        acResultsDiv.fadeIn(function() {
            $('body').one('click', function() {
                clearResults();
            });
        });
    });
    
    // clear auto complete box
    function clearResults()
    {
        acResultsDiv.fadeOut(100);
    }

    // reposition the results div accordingly to the search field
    function repositionResultsDiv()
    {
        var sf_pos    = acSearchField.offset();
        var sf_height = acSearchField.height();
        var sf_width  = acSearchField.width();
        var results_left = sf_pos.left;
        var results_top = sf_pos.top;
        
        acResultsDiv.height('');
        
        // determine how much this popup menu goes past the bottom of the
        // visible area
        var bottom_overflow = results_top + acResultsDiv.height() -
            $('body').height();
        
        // if the menu overflows, move it up so it doesn't get cut off
        if(bottom_overflow > 0)
            results_top = results_top - bottom_overflow;
        
        if(results_top < 7) {
            acResultsDiv.height(acResultsDiv.height() + results_top);
            results_top = 7;
        }
        
        acResultsDiv.css("position", "absolute");
        acResultsDiv.css("left", results_left);
        acResultsDiv.css("top", results_top);
        acResultsDiv.css("width", sf_width);
        acResultsDiv.css("min-width", '150px');
    }

    // on key up listener
    acSearchField.keyup(function (e) {

        // get keyCode (window.event is for IE)
        var keyCode = e.keyCode || window.event.keyCode;
        var lastVal = acSearchField.val();

        // check an treat up and down arrows
        if(enterKey(keyCode)){
            return;
        }
        
        // check an treat up and down arrows
        if(updownArrow(keyCode)){
            return;
        }

        // check for an ENTER or ESC
        if(keyCode == 27){
            clearResults();
            return;
        }

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
                    clearResults();
                }
            });

            return true;
        } else {
            return false;
        }
    }
    
}
