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

var DEFAULT_PROPERTIES = "chrome://libx/locale/definitions.properties";
var libxbundle = null;

return /** @lends libx.locale */ {

	/**
	 *	Initializes the libx.locale namespace, loading the LibX properties
	 */
	initialize : function () {
		libxbundle = new libx.locale.StringBundle ( DEFAULT_PROPERTIES );
	},
	
	/**
	 *	Returns a LibX property with specified name 
	 *	@param {String} name of property
	 *	@param {Objects} variable number of arguments
	 */	
	getProperty : function ( name /*, arg0, arg1, arg2, .... */) {
		if ( libxbundle != null ) {
			return libxbundle.getProperty.apply ( libxbundle, arguments );
		} else {
			libx.log.write ( "Error: libx bundle was not initialized" );
			return null;
		}
	},
	
	/** @namespace */
	bd : {},
	
	StringBundle : libx.core.Class.create ( 
	/** @lends libx.locale.StringBundle.prototype */{
	
		/**
		 *	Initializes a StringBundle
		 *	@constructs
		 */
		initialize : function ( url ) {
            this.url = url;
			this.bundle = new libx.locale.bd.StringBundle ( url );	
		},
		
		/**
		 *	Returns a property, or null if it doesnt exist
		 *	@param {String} name of the property
		 *	@param {String} any additional arguments, each should be passed as seperate paramaters
		 */
		getProperty : function ( name ) {
			var args = [];
		    for ( var i = 1; i < arguments.length; i++ ) {
		        args.push ( arguments[i] );
		    }
		    
			try {
		        if (args.length > 0) {
		            var formatted = this.bundle.getFormattedString(name, args);
		        } else {
		            var formatted = this.bundle.getString(name);
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
	} )	
};

} ) ();
