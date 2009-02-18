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
        var safeWin = new XPCNativeWrapper(win);

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
     * @param {String} code to be evaluated
     */
    evaluate : function ( code ) {
    	
        try {
	        if ( libx.utils.browserprefs.getBoolPref('libx.sandbox.usesubscriptloader', false ) ) {
	        	
	        	if ( this.subscriptLoader == null ) {
	        		this.subscriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                      .getService(Components.interfaces.mozIJSSubScriptLoader);;
	        	}
	        	if ( libx.global.libapp.FILE_COUNTER == null ) {
	        		libx.global.libapp.FILE_COUNTER = 0;
	        	}
	        	
	    		var filename = "chrome://libx/content/temp" + libx.global.libapp.FILE_COUNTER++ + ".js";
				libx.io.writeToFile ( filename, code, true );
				
	    		this.subscriptLoader.loadSubScript ( filename, this.sandBox );
	    		
	    	} else {
	            return Components.utils.evalInSandbox( code, this.sandBox );
	        }
        } catch (er) {
            libx.log.write("Error in Sandbox.evaluate: " + er);
        }
    }
});

