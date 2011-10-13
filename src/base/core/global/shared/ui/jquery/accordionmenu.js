/**
 * Accordion menu
 * Based off of Marco van Hylckama Vlieg's menu
 * http://www.i-marco.nl/weblog/
 *
 * @param  {Object} $        the jQuery object
 * @param  {Object} options  parameter object
 * @config {Object} menu     a jQuery-selected UL element.  this element will
 *                           be transformed into the accordion menu.
 * @example
 * var accordionMenu = libx.ui.jquery.accordionmenu($, {
 *     menu: $('#simple-menu')
 * });
 */
libx.ui.jquery.accordionmenu = function ($, options) {

    var theMenu = options.menu;

    return {
        
        /**
         * Set up a single menu item.
         *
         * @param {Object} itemRef   jQuery reference to the menu element
         * @param {String} itemName  name of this menu item
         * @param {Array}  subItems  array of subitems for this menu; each array element
         *                   must be an object containing a "text" and "value"
         *                   property.  these properties will be passed to the selection
         *                   callback when the item is selected.
         * @param {Function(value, text)} selection callback when a subitem is chosen.
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
