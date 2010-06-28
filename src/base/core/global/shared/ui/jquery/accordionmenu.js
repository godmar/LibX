/**
 * Accordion menu
 * 
 * Based off of Marco van Hylckama Vlieg's menu
 * http://www.i-marco.nl/weblog/
 */

libx.ui.jquery.accordionmenu = function ($, options) {

    var theMenu = options.menu;

    return {
        
        /**
         * Set up a single menu item.
         *
         * @param {Object}   jQuery reference to the menu element
         * @param {String}   name of this menu item
         * @param {Array}    array of subitems for this menu; each array element
         *                   must be an object containing a "text" and "value"
         *                   property
         * @param {Function} callback when a subitem is chosen
         */
        setMenuItems: function(itemRef, itemName, subItems, selection) {
        
            // reset this menu item if it has already been populated
            itemRef.empty();
            
            var itemLink = $('<a href="#">' + itemName + '</a>');
            var subItemList = $('<ul/>');
            itemRef.append(itemLink).append(subItemList);
            
            itemLink.click(function() {
                if(subItemList.is(':visible')) {
                    subItemList.slideUp('normal');
                } else {
                    $('ul:visible', theMenu).slideUp('normal');
                    subItemList.slideDown('normal');
                }
            });
            
            for(var i = 0; i < subItems.length; i++) {
                var subItem = $('<li><a href="#">' + subItems[i].text + '</a></li>')
                    .appendTo(subItemList);
                (function(text, value) {
                    subItem.click(function() {
                        itemLink.text(text);
                        subItemList.slideUp('normal');
                        selection(value, text);
                    });
                }) (subItems[i].text, subItems[i].value);
                
            }
            
            subItemList.hide();
        }
    };
    
};
