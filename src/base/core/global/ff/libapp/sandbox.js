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
 * Contributor(s): Tobias Wieschnowsky (frostyt@vt.edu)
 *
 * ***** END LICENSE BLOCK ***** */
 
/**
 * Support for creating a sandbox.
 *
 * Evaluates in global FF context.
 *
 * @see libx.libapp.createSandbox
 *
 * @class
 */
libx.libapp.Sandbox = libx.core.Class.create(
    /** @lends libx.libapp.Sandbox.prototype */{
    /** 
     * Creates a sandbox.
     * 
     * The environment will contain an wrapped version of the 
     * passed-in window.  The wrapper will not propagate assignments
     * to the underlying window in order to avoid interfering with
     * the loaded page's scope.
     *
     * 'unsafeWindow' may be used to access the actual window object.
     *
     * @param {Window} win - window to be wrapped
     * @param {Object} globalproperties - properties to be included in global scope
     */
    initialize : function ( win, globalproperties ) {
    
    	// XXX: We cannot use an XPCNativeWrapper here because
    	// Firefox 3.6 does not support expando properties on
		// wrappers.  This is necessary for jQuery and other
		// libraries.  This should be fixed in Firefox 4
		// according to:
		// https://bugzilla.mozilla.org/show_bug.cgi?id=478529
		
        //var safeWin = new XPCNativeWrapper(win);
        var safeWin = win;

        this.sandBox = new Components.utils.Sandbox( safeWin );
        this.sandBox.unsafeWindow = win;

        this.sandBox.window = safeWin;
        this.sandBox.document = safeWin.document;

        for (var prop in globalproperties) {
            this.sandBox[prop] = { };
            libx.core.Class.mixin(this.sandBox[prop], globalproperties[prop], true);
        }

        // XPCNativeWrapper does not set the prototype chain
        this.sandBox.__proto__ = safeWin; 
    },
    
    /**
     * Evaluate a given piece of JavaScript
     *
     * @param {String}  code to be evaluated
     * @param {String}  name of file or identifier for code being evaluated
     *                  (used for debugging details)
     */
    evaluate : function ( code, fname ) {
        try {
            return Components.utils.evalInSandbox( code, this.sandBox, '1.8', fname, 1 );
        } catch (e) {
	        var where = e.location || (e.fileName + ":" + e.lineNumber);
	        libx.log.write( "error in Sandbox.evaluate: " + e + " -> " + where);
	    }
    },
    
    /**
     * Load a script from a given URL
     * 
     * @param {String}  location of script
     */
    loadScript : function ( url ) {
        var self = this;
        libx.cache.defaultMemoryCache.get({
            url: url,
            type: "GET",
            dataType: "text",
            serverMIMEType: "text/javascript",
            success: function(data) {
                self.evaluate(data, url);
            }
        });
    }
    
});

