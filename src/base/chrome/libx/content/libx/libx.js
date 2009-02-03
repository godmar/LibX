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
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * LibX toolbar extension
 *
 * Author: Annette Bailey <annette.bailey@gmail.com>
 */ 
                        
/**
 * @namespace
 * Utility namespaces
 */
libx.utils = { 
    /**
     * @namespace libx.utils.stdnumsupport
     *
     * Support for standard numbers such as ISBNs
     */
    stdnumsupport: { },

    /**
     * @namespace libx.utils.browserprefs
     *
     * Support for manipulating preferences.
     *
     * These are reachable in Firefox via about:config and
     * in IE by editing a prefs.txt file.
     *
     * Previous versions of LibX used this preference store for
     * user preferences.
     */
    browserprefs: { },

    /**
     * @namespace libx.utils.types
     *
     * Convenience methods for dealing with JavaScript types.
     */
    types: { 
        /**
         * Turns (string) "true" -> true
         *       (string) "false" -> false
         *       (string) "" -> null
         * Otherwise, returns input.
         *
         * @param {String} value - input string
         * @return {String|Boolean|null} - converted input
         */ 
        normalize : function (value) {
            if (value == "false")
                return false;
            if (value == "true")
                return true;
            if (value == "")
                return null;
            return value;
        },
        
        /**
         * Compute a string representing all fields of an object.
         *
         * @param {String} prefix - if given, prefix is prepended to string
         * @param {Object} obj - object to be dumped
         * @return {String} string representation.
         */
        dumpObject : function (obj, prefix) {
            prefix = prefix || "";
            for (var k in obj)
                prefix += k + "=" + obj[k] + " (" + typeof obj[k] + "), ";
            return prefix;
        }
    }
};

/**
 * Store the build date here.  Checking whether this value exists
 * as well as comparison can be used by feed code if needed.
 */
libx.buildDate = "$builddate$";

/**
 * Initialize LibX
 *
 * In Firefox, this code is called once per new window. It is called
 * after libx.xul has been loaded.
 */
libx.initialize = function () 
{
    libx.browser.initialize();

    var myLibXComponent = Components.classes['@libx.org/libxcomponent;1'].getService().wrappedJSObject;

    //Define a DocumentRequest object here
    //libx.ajax.docrequest = myLibXComponent.getCache();
    libx.cache = { };
    libx.cache.memorycache = myLibXComponent.getMemoryCache();

    var editionConfigurationReader = new libx.config.EditionConfigurationReader( {
    	url: "chrome://libx/content/config.xml",
    	onload: function (edition) {
    		libx.edition = edition;

    		libx.browser.activateConfiguration(edition);

            libxEnv.doforurls.initDoforurls();  // XXX
            libxEnv.eventDispatcher.init(); // XXX
            libx.citeulike.initialize();
    	}
/* XXX
        onerror: function () {
            libx.log.write ( "ERROR: Config XML Not Found" );
            return;
        }
*/
    });

    //
    // XXX function should end here
    //
	/**
	 * helper function that creates the cue logo to be inserted
	 * make the equivalent of this html:
	 * <a title="[title]" href="[url]"><img src="chrome://libx/skin/virginiatech.ico" border="0"/></a>
	 *
	 * targetobject is either the catalog or openurl object used.
	 * if it has an '.image' property, use that for the cue.
     *
     * @member libxEnv
     *
     * @param {DOM node} doc document node in HTML DOM
     * @param {String} title title attribute for link
     * @param {String} url href attribute for link
     * @param {Object} either a catalog or openurl resolver
	 *
	 */
    libxEnv.makeLink = function (doc, title, url, targetobject) {
        var link = doc.createElement('a');
        link.setAttribute('title', title);
        link.setAttribute('href', url);
        var image = doc.createElement('img');
        if (targetobject && targetobject.image) {
            image.setAttribute('src', targetobject.image);
        } else {
            if (libx.edition.options.cueicon != null)
                image.setAttribute('src', libx.edition.options.cueicon);
            else
                image.setAttribute('src', libx.edition.options.icon);
        }
        image.setAttribute('border', '0');
        link.appendChild(image);
        return link;
    }

    try {
        libx.log.write( "Applying Hotfixes" );
        for ( var i = 0; i < libxEnv.doforurls.hotfixList.length; i++ )
        {
            eval( libxEnv.doforurls.hotfixList[i].text );
        }
    } catch (e) {
        libx.log.write( "Hotfix error " + e.message );
    } 
}

// XXX to-be-removed
var libxEnv = { };

/*
 * Designed to extended to implement events that we commonly re-use, but are not provided
 * natively ( or to combine multiple events together )
 * 
 * - onContentChange -- events fired when the content of the website changes, either by switching tabs
 *                      or navigating to another website
 */
libxEnv.eventDispatcher = {
    // Notifies all listeners waiting for a given type
    notify: function ( libxtype, e ) {
        var listeners = libxEnv.eventDispatcher[libxtype];
        if ( listeners )
            for ( var i = 0; i < listeners.length; i++ ) {
                listeners[i].funct(e, listeners[i].args);
            }
    },
    // Adds a function to be executed when an event of the given type is triggered
    addEventListener: function ( libxtype, listener, args ) {
        if ( this[libxtype] == null )
            this[libxtype] = new Array();    
        this[libxtype].push({funct: listener, args: args});
    }
}; 
// vim: ts=4
