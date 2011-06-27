/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is LibX Firefox Extension.
 *
 * The Initial Developer of the Original Code is Annette Bailey (libx.org@gmail.com)
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer and Virginia Tech. All Rights Reserved.
 *
 * Contributor(s): Godmar Back (godmar@gmail.com)
 *                 Mike Doyle (vtdoylem@gmail.com)
 * 
 * ***** END LICENSE BLOCK ***** */

/** 
 * @namespace 
 *
 * Support for internationalization.
 */
libx.locale = ( function () { 

var StringBundle = libx.core.Class.create( {

    initialize: function( bundles ) {
        this.bundles = bundles;
    },
    
	/**
	 *	Returns a LibX property with specified name 
	 *	@param {String} name of property
	 *	@param {Objects} variable number of arguments
	 */	
	getProperty : function ( name /*, arg0, arg1, arg2, .... */) {
        
        var propertyObj = null;
        
        for (var i = 0; i < this.bundles.length; i++) {
            propertyObj = this.bundles[i][name];
            if (propertyObj)
                break;
        }
        
        if (propertyObj == null) {
            libx.log.write("Property '" + name + "' not found");
            return "[" + name + "]";
        }
        
        var message = propertyObj.message;
        
        if (arguments.length > 1) {
            var args = arguments;
            message = message.replace(/\$([a-zA-Z0-9_]+)\$/g, function(str, match) {
                var placeholder = propertyObj.placeholders[match];
                if(!placeholder)
                    throw new Error("placeholder '" + match + "' not defined.");
                
                // replace $n with corresponding argument n
                return placeholder.content.replace(/(.?)\$([0-9])/g, function(str, chr, match) {
                    // exclude $$n from argument replacement
                    if(chr == '$')
                        return '$' + match;
                    var result = args[parseInt(match)];
                    if(!result)
                        return '';
                    return chr + result;
                });
            });
        }
        
        return message;
	    
	}
    
} );

return /** @lends libx.locale */ {

    /** @namespace libx.locale.bd */
    bd : { },
    
    initialize: function () {
        libx.locale.bd.initialize();
    },
    
    getExtensionURL: function (path) {
        return libx.locale.bd.getExtensionURL(path);
    },
    
    getBootstrapURL: function (path) {
        return "$bootstrapURL$" + path;
    },
    
    getLibappScriptURL: function (path) {
        return "$libappscriptURL$" + path;
    },
    
	/**
	 *	Gets a localization bundle.
     *  Bundles will be searched similar to Google Chrome's i18n rules (http://code.google.com/chrome/extensions/i18n.html#l10):
     *      1) Search the messages file (if any) for the user's preferred locale.
     *         For example, if user's locale is en_GB, the en_GB locale will be searched first.
     *      2) If the user's preferred locale has a region (that is, the locale has an underscore: _),
     *         search the locale without that region. For example, if the en_GB messages file doesn't exist
     *         or doesn't contain the message, the system looks in the en messages file.
     *      ** NOTE: to save an extra XHR, (2) is not done since it is unlikely we will ever use this.
     *      3) Use the locale specified in defaultLocale. For example, if defaultLocale is set to "es",
     *         and neither the en_GB nor en versions of the URL contain the message, es is searched.
	 *	@param {Object} object parameter that contains the following:
     *      url             {String}    OPTIONAL - URL to load bundle from.  URL can contain
     *                                  a $locale$ placeholder, which will be replaced with
     *                                  the user's current locale.
     *      feed            {String}    OPTIONAL - Feed to load bundle from.
     *      object          {String}    OPTIONAL - Object to load bundle from.
     *      defaultLocale   {String}    OPTIONAL - the fallback locale bundle when either
     *                                      1) the user's preferred locale does not exist
     *                                      2) the user's locale exists, but a string is missing
     *      async           {bool}      whether the locale will be retrieved asynchronously
     *      success         {Function}  REQUIRED - success callback function; takes a parameter
     *                                  which is the returned string bundle
     *      error           {Function}  error callback function
	 */	
    getBundle: function (params) {
        
        var localesToFind = [];

        // add default locale if it is not already in list
        function addLocale(locale) {
            for (var i = 0; i < localesToFind.length; i++)
                if (localesToFind[i] == locale)
                    return;
            localesToFind.push(locale);
        }
        
        addLocale(libx.locale.bd.currentLocale);
        var regionSeparatorPos = libx.locale.bd.currentLocale.indexOf('_')
        
        // uncomment this to enable option (2) described above
        //if (regionSeparatorPos != -1)
        //    addLocale(libx.locale.bd.currentLocale.substr(0, regionSeparatorPos));
        
        if (params.defaultLocale)
            addLocale(params.defaultLocale);
        
        var queue = new libx.utils.collections.ActivityQueue();
        var bundles = [];
        
        // schedule possible locales, executing callback for each to mark them ready
        function scheduleLocales(callback) {
        
            for (var i = 0; i < localesToFind.length; i++) {        
                var addBundleActivity = {
                    onready: function (json) {
                        if (json)
                            bundles.push(json);
                    }
                };
                
                queue.scheduleLast(addBundleActivity);
                callback(localesToFind[i], addBundleActivity);
            }
            
            var createBundleActivity = {
                onready: function () {
                    params.success(new StringBundle(bundles));
                    if (!bundles.length && params.error)
                        params.error('Could not load any bundles from: ' + (params.url||params.feed));
                }
            };
            
            queue.scheduleLast(createBundleActivity);
            createBundleActivity.markReady();
            
        }
        
        if (params.url) {
            // get locales from url
            scheduleLocales(function (locale, activity) {
                libx.cache.defaultObjectCache.get( {
                    // BRN: is async still used?
                    dataType: "json",
                    async: params.async,
                    url: params.url.replace(/\$locale\$/, locale),
                    error: function ( status ) {
                        activity.markReady();
                        if (status != 404 && params.error)
                            params.error(status);
                    },
                    success: function (response) {
                        activity.markReady(response);
                    }
                } );
            });
        } else if (params.object) {
            // get locales from object
            scheduleLocales(function (locale, activity) {
                if (locale in params.object)
                    activity.markReady(params.object[locale]);
                else
                    activity.markReady();
            });
        } else {
            // get locales from feed
            function getLocale(entry) {
                if (entry.defaultLocale)
                    addLocale(entry.defaultLocale);
                scheduleLocales(function (locale, activity) {
                    if (locale in entry.locales)
                        activity.markReady(libx.utils.json.parse(entry.locales[locale]));
                    else
                        activity.markReady();
                });
            }
            new libx.libapp.PackageWalker(params.feed).walk({
                onpackage: getLocale,
                onmodule:  getLocale,
                onlibapp:  getLocale
            });
        }
        
    }
	
};

} ) ();
