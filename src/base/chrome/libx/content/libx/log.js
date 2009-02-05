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
 * Contributor(s): see file AUTHORS
 * 
 * ***** END LICENSE BLOCK ***** */

/**
 * @fileoverview
 *
 * This file contains functionality related to logging.
 */

/**
 * @namespace libx.log
 *
 * Support for logging
 *
 * This namespace is global.
 */
libx.log = { 
    /**
     * Output a message to the JS console.
     *
     * If a prefix string is given, message will be output only if
     * libx.<prefix>.debug is set to true in the browser prefs,
     * or if libx.all.debug is set to true.
     * 
     * @param {String} msg Message to be output to console
     * @param {String} prefix Log prefix (optional)
     */
    write : function (msg, prefix) {

        if (!prefix) {
            prefix = 'LibX';
        } else {
            var prefString = 'libx.' + prefix.toLowerCase() + '.debug';
            if (!libx.utils.browserprefs.getBoolPref('libx.all.debug', false) &&
                !libx.utils.browserprefs.getBoolPref(prefString, false)) {
                return;
            }
        }

        libx.log.bd.write(prefix + ": " + msg);
    }
}
