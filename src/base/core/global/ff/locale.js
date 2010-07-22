
/**
 * Browser-dependent implementation of a bundle of strings representing
 * properties.
 *
 * @class
 */

libx.locale.bd = (function() {
    
    var localeObj = null;
    var defaultLocaleObj = null;
    
    return {
        
        initialize: function() {

            // retrieve translation for user's language
            libx.cache.defaultMemoryCache.get({
                dataType: "json",
                url: "chrome://libx/locale/messages.json",
                serverMIMEType: "application/json",
                success: function(result) {
                    localeObj = result;
                }
            });
            
            // retrieve default locale for missing translation messages
            libx.cache.defaultMemoryCache.get({
                dataType: "json",
                url: "chrome://libxdefaultlocale/content/messages.json",
                serverMIMEType: "application/json",
                success: function(result) {
                    defaultLocaleObj = result;
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
            return this.getString(name).replace(/\$([a-zA-Z0-9_]+)\$/g, function(str, match) {
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
            var str = localeObj[name];
            if(!str)
                str = defaultLocaleObj[name];
            return str.message;
        }
        
    };
    
}) ();