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
     * @constructs
     * @param {Window} win  window to be wrapped
     * @param {Object} globalproperties  properties to be included in global scope
     */
    initialize : function ( win, globalproperties ) {
    
        // XPCNativeWrappers should be on, so win should implicitly
        // be an XPCNativeWrapper'd window

        // We use the system principal for all sandboxed code, since exposing
        // the LibX object to the page principal would require setting the
        // __exposedProps__ attribute.  This is described at:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=630779.
        var systemPrincipal = Cc["@mozilla.org/systemprincipal;1"] 
                             .createInstance(Ci.nsIPrincipal); 
        
        this.sandBox = new Components.utils.Sandbox( systemPrincipal );

        for (var prop in globalproperties) {
            this.sandBox[prop] = { };
            libx.core.Class.mixin(this.sandBox[prop], globalproperties[prop], true);
        }

        // Set the prototype chain.
        // This will expose window, document, etc. to the sandboxed code.
        this.sandBox.__proto__ = win; 
    },
    
    /**
     * Evaluate a given piece of JavaScript
     *
     * @param {String}  code  code to be evaluated
     * @param {String}  name  name of file or identifier for code being evaluated
     *                        (used for debugging details)
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
     * @param {String} url  location of script
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

