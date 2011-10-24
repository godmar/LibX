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
 *                 Michael Doyle ( vtdoylem@gmail.com )
 *
 * ***** END LICENSE BLOCK ***** */

(function () {
	
    var prefix = 'browserprefs.';
    var store = localStorage;
    
    /* Get a preference from localStorage.  If it does not exist, return the
     * default value. */
	function getPref(prefName, defValue) {
	    var pref = store[prefix + prefName];
        /* RP: FF's store obj has a small quirk, unlike chrome sets pref var to null
           instead of 'undefined'...hence the additional check for null   
        */
		if(typeof(pref) != 'undefined' && pref != null)
			return pref;
		return defValue;
	}
	
	function setPref(prefName, value) {
		store[prefix + prefName] = value;
	}
	
    libx.core.Class.mixin(libx.utils.browserprefs, {
    
        setStore : function ( newStore ) {
            store = newStore;
        },
    
        getBoolPref : function ( prefName, defValue ) {
    		return getPref(prefName, defValue).toString() == 'true';
        },

        getStringPref : function ( prefName, defValue ) {
        	return getPref(prefName, defValue);
        },

        getIntPref : function ( prefName, defValue ) {
        	return parseInt(getPref(prefName, defValue));
        },

        setBoolPref : function ( prefName, value ) {
			setPref(prefName, Boolean(value));
        },

        setStringPref : function ( prefName, value ) {
        	setPref(prefName, String(value));
        },

        setIntPref : function ( prefName, value ) {
        	setPref(prefName, parseInt(value));
        }
    });
})();

