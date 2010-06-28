
/**
 * Browser-dependent implementation of a bundle of strings representing
 * properties.
 *
 * @class
 */

libx.locale.bd = (function() {
    
    return {
        
        initialize: function() {},
        
        /**
         *  Returns a string with specified name
         *  @param {String} name of property
         *  @param {String[]} additional arguments
         *  @return {String} Formatted property
         */
        getFormattedString : function ( name, args ) {
            return chrome.i18n.getMessage(name, args);
        },
        
        /**
         *  Returns a formatted property string
         *  @param {String} name of property
         *  @return {String} property
         */
        getString : function ( name ) {
            return chrome.i18n.getMessage(name);
        }
        
    };
    
}) ();