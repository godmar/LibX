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

return /** @lends libx.locale */ {

    /** @namespace libx.locale.bd */
    bd : { },
    
	/**
	 *	Initializes the libx.locale namespace, loading the LibX properties
	 */
	initialize : function () {
        this.bd.initialize();
	},
	
	/**
	 *	Returns a LibX property with specified name 
	 *	@param {String} name of property
	 *	@param {Objects} variable number of arguments
	 */	
	getProperty : function ( name /*, arg0, arg1, arg2, .... */) {
	    
	    var args = [];
        for ( var i = 1; i < arguments.length; i++ ) {
            args.push ( arguments[i] );
        }
        
        try {
            if (args.length > 0) {
                var formatted = this.bd.getFormattedString(name, args);
            } else {
                var formatted = this.bd.getString(name);
            }
            if (formatted == null) {
                libx.log.write("Property '" + name + "' not found in '" + this.url + "'");
                return "<" + name + ">";
            }
            return formatted;
        } catch (e) {
            libx.log.write("Error retrieving property '" + name + "' from '" + this.url + "': " + e);
            return "<" + name + ">";
        }
	    
	}
	
};

} ) ();
