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
 * Support for internationalization.
 *
 * @namespace 
 */
libx.locale = ( function () { 

StringBundle = libx.core.Class.create(
    /** @lends libx.locale.StringBundle.prototype */ {

    /**
     * Bundle class for localization.
     *
     * @constructs
     * @param {Array[bundle]} l10ns  localization objects to associate with
     *  this string bundle. each l10n object holds messages that follow the
     *  formats described in:
     *  http://code.google.com/chrome/extensions/i18n-messages.html
     */
    initialize: function( l10ns ) {
        this.l10ns = l10ns;
    },
    
    /**
     * Check if a property is present in any locale string bundle.
     * @return {boolean} if property is present
     */
    hasProperty : function (name) {
        return this.getPropertyObject(name) != null;
    },

    getPropertyObject : function ( name ) {
        var propertyObj = null;
        
        for (var i = 0; i < this.l10ns.length; i++) {
            propertyObj = this.l10ns[i][name];
            if (propertyObj)
                return propertyObj;
        }
        return null;
    },
        
    /**
     * Returns a message with the specified name.
     *  Beginning at the first element in the l10ns array given to
     *  libx.locale.StringBundle(), each l10n object is checked for a message
     *  with the given name. Consequently, subsequent elements in the array
     *  serve as fallback objects.
     *
     * @param {String} name  name property to find
     * @param {Strings} arg1...argn  variable number of replacement strings.
     *      messages with replacement strings follow the format described in:
     *      http://code.google.com/chrome/extensions/i18n-messages.html#placeholders
     *  @returns {String} localized message
     */
    getProperty : function ( name /*, arg0, arg1, arg2, .... */) {
        
        var propertyObj = this.getPropertyObject(name);
        
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

    // attach StringBundle to libx.locale namespace
    StringBundle: StringBundle,

    /**
     * Namespace for browser-specific localization functionality.
     * @namespace libx.locale.bd
     */
    bd : { },
    
    /**
     * Initialize the localization framework.
     */
    initialize: function () {
        libx.locale.bd.initialize();
    },
    
    /**
     *  Gets a localization bundle.
     *  Localizations will be searched similar to Google Chrome's i18n rules
     *  (http://code.google.com/chrome/extensions/i18n.html#l10):
     *      1. Search the messages file (if any) for the user's preferred locale.
     *         For example, if user's locale is en_GB, the en_GB locale will be searched first.
     *      2. Use the locale specified in defaultLocale. For example, if defaultLocale is set to "es",
     *         and the en_GB version of the URL does not contain the message, es is searched.
     *  @param {Object}  params          object parameter. either url|feed|object
     *                                   should be supplied.
     *  @config {String} url             (optional) URL to load bundle from.  URL can contain
     *                                   a $locale$ placeholder, which will be replaced with
     *                                   the user's current locale.
     *  @config {String} feed            (optional) feed to load bundle from
     *  @config {String} object          (optional) object to load bundle from
     *  @config {String} defaultLocale   (optional) the fallback locale bundle when either
     *                                      1. the user's preferred locale does not exist
     *                                      2. the user's locale exists, but a string is missing
     *  @config {Function(libx.locale.StringBundle)} success  success callback function;
     *                                   takes a parameter which is the returned string bundle
     *  @config {Function()} error       error callback function
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
        
        if (params.defaultLocale)
            addLocale(params.defaultLocale);
        
        var queue = new libx.utils.collections.ActivityQueue();
        var l10ns = [];
        
        // schedule possible locales, executing callback for each to mark them ready
        function scheduleLocales(callback) {
        
            for (var i = 0; i < localesToFind.length; i++) {        
                var addBundleActivity = {
                    onready: function (json) {
                        if (json)
                            l10ns.push(json);
                    }
                };
                
                queue.scheduleLast(addBundleActivity);
                callback(localesToFind[i], addBundleActivity);
            }
            
            var createBundleActivity = {
                onready: function () {
                    params.success(new StringBundle(l10ns));
                    //!l10ns.length && params.error && params.error();
                }
            };
            
            queue.scheduleLast(createBundleActivity);
            createBundleActivity.markReady();
            
        }
        
        if (params.url) {
            // get locales from url
            scheduleLocales(function (locale, activity) {
                /* Make sure that locale information is always fetched from server 
                 * when in 'cs' mode. */
                libx.cache.defaultObjectCache[libx.cs ? 'update' : 'get']( {
                    validator: function (vParams) {
                        function validateMessages() {
                            for (var i in vParams.data) {
                                if (!('message' in vParams.data[i]))
                                    return false;
                            }
                            return true;
                        }
                        // We require that .json file be served with a mime type such as
                        // application/json
                        if (/json/.test(vParams.mimeType) && validateMessages())
                            vParams.success();
                        else
                            vParams.error();
                    },
                    dataType: "json",
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
