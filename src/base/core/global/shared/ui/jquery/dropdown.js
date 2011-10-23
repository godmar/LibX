
/**
 * Drop-down box.
 * This code is based on sample source code provided by fromvega.
 * http://fromvega.com/wordpress/2007/05/05/auto-complete-field-with-jquery-json-php/
 * Search for the complete article at http://www.fromvega.com
 *
 * @param  {Object} $               the jQuery object
 * @param  {Object} options         parameter object
 * @config {Object} field           jQuery link element where the dropdown will be created
 * @config {Array} dropdown_items   array of dropdown entry objects.  each
 *                                  object has a "text" and "value" property.
 * @config {Function(value, text)} select  callback function when an item is selected
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
    for(var i = 0; i < options.dropdown_items.length; i++ ) {
        
        var div = $('<div class="unselected" />');
        var itemText = options.dropdown_items[i].text;
        div.text(itemText);
        
        (function(value, text) {
            div.click(function() {
                acSearchField.text(text);
                clearResults();
                if(options.select)
                    options.select(value, text);
            });
        }) (options.dropdown_items[i].value, itemText);
        
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
    
}
