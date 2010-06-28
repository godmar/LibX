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
    
    /* Get a preference from localStorage.  If it does not exist, return the
     * default value. */
	function getPref(prefName, defValue) {
	    var pref = localStorage[prefix + prefName];
		if(typeof(pref) != 'undefined')
			return pref;
		return defValue;
	}
	
	function setPref(prefName, value) {
		localStorage[prefix + prefName] = value;
	}
	
    libx.core.Class.mixin(libx.utils.browserprefs, {
        /** @lends libx.utils.browserprefs */
        /**
         * Retrieve a boolean preference
         *
         * @memberOf libx.utils.browserprefs
         * @param {String} prefName - name of the preference
         * @param {Boolean} defValue - value to be substituted if not found
         * @return {Boolean} value of preference
         */
        getBoolPref : function ( prefName, defValue ) {
    		return getPref(prefName, defValue).toString() == 'true';
        },

        /**
         * Retrieve a string preference
         *
         * @memberOf libx.utils.browserprefs
         * @param {String} prefName - name of the preference
         * @param {String} defValue - value to be substituted if not found
         * @return {String} value of preference
         */
        getStringPref : function ( prefName, defValue ) {
        	return getPref(prefName, defValue);
        },

        /**
         * Retrieve an integer preference
         *
         * @memberOf libx.utils.browserprefs
         * @param {String} prefName - name of the preference
         * @param {Number} defValue - value to be substituted if not found
         * @return {Number} value of preference
         */
        getIntPref : function ( prefName, defValue ) {
        	return parseInt(getPref(prefName, defValue));
        },

        /**
         * Set a boolean preference
         *
         * @memberOf libx.utils.browserprefs
         * @param {String} prefName - name of the preference
         * @param {Boolean} value - new value
         */
        setBoolPref : function ( prefName, value ) {
			setPref(prefName, Boolean(value));
        },

        /**
         * Set a string preference
         *
         * @memberOf libx.utils.browserprefs
         * @param {String} prefName - name of the preference
         * @param {String} value - new value
         */
        setStringPref : function ( prefName, value ) {
        	setPref(prefName, String(value));
        },

        /**
         * Set an integer preference
         *
         * @memberOf libx.utils.browserprefs
         * @param {String} prefName - name of the preference
         * @param {Number} value - new value
         */
        setIntPref : function ( prefName, value ) {
        	setPref(prefName, parseInt(value));
        }
    });
})();

