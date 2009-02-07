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

/** @namespace */
libx.locale = ( function () { 

var libxbundle = null;

return /** @lends libx.locale */ {

	/**
	 *	Initializes the libx.locale namespace, loading the LibX properties
	 */
	initialize : function () {
		libxbundle = new libx.locale.StringBundle ( "chrome://libx/locale/definition.properties" );
	},
	
	/**
	 *	Returns a LibX property with specified name 
	 */	
	getProperty : function ( name, args ) {
		if ( libxbundle != null ) {
			return libxbundle.getProperty ( name, args );
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
		initialize : function ( filename ) {
			this.bundle = new libx.locale.bd.StringBundle ( filename );	
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
		            return this.bundle.getFormattedString(prop, args);
		        } else {
		            return this.bundle.getString(prop);
		        }
		    } catch (e) {
		        return null;
		    }
		}
	} )	
};

} ) ();
