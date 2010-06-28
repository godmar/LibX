
/**
 * Browser-dependent implementation of a bundle of strings representing
 * properties.
 *
 * @class
 */

libx.locale.bd = (function() {
    
    var localeObj = null;
    
    return {
        
        initialize: function() {
            libx.cache.defaultMemoryCache.get({
                dataType: "json",
                url: "chrome://libx/locale/messages.json",
                serverMIMEType: "application/json",
                success: function(result) {
                    localeObj = result;
                }
            });
        },
        
        /**
         *  Returns a string with specified name
         *  @param {String} name of property
         *  @param {String[]} additional arguments
         *  @return {String} Formatted property
         */
        getFormattedString : function ( name, args ) {
            return localeObj[name].message.replace(/\$([a-zA-Z0-9_]+)\$/g, function(str, match) {
                var placeholder = localeObj[name].placeholders[match];
                if(!placeholder)
                    throw new Error("placeholder '" + match + "' not defined.");
                
                // replace $n with corresponding argument n
                return placeholder.content.replace(/(.?)\$([0-9])/g, function(str, chr, match) {
                    // exclude $$n from argument replacement
                    if(chr == '$')
                        return '$' + match;
                    var result = args[parseInt(match) - 1];
                    if(!result)
                        return '';
                    return chr + result;
                });
            });
        },
        
        /**
         *  Returns a formatted property string
         *  @param {String} name of property
         *  @return {String} property
         */
        getString : function ( name ) {
            return localeObj[name].message;
        }
        
    };
    
}) ();