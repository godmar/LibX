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
         * @param {Object}   mapping of key=>value subitems for this menu
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
            
            for(var i in subItems) {
                var subItem = $('<li><a href="#">' + subItems[i] + '</a></li>')
                    .appendTo(subItemList);
                (function(key, value) {
                    subItem.click(function() {
                        itemLink.text(value);
                        subItemList.slideUp('normal');
                        selection(key, value);
                    });
                }) (i, subItems[i]);
                
            }
            
            subItemList.hide();
        }
    };
    
};
