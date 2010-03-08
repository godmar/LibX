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

libx.ui = {
    jquery: {}
};

libx.localStorage = {
    setItem: function(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch(e) {
            throw new Error("libx.localStorage.setItem(): " + e);
        }
    },
    getItem: function(key) {
        try {
            return window.localStorage.getItem(key);
        } catch(e) {
            throw new Error("libx.localStorage.getItem(): " + e);
        }
    },
    removeItem: function(key) {
        try {
            return window.localStorage.removeItem(key);
        } catch(e) {
            throw new Error("libx.localStorage.removeItem(): " + e);
        }
    },
    clear: function() {
        window.localStorage.clear();
    }
};

