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
 * The Initial Developer of the Original Code is Godmar Back (godmar@gmail.com)
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer and Virginia Tech. All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * popuputils.js
 *
 * Use like so:
 * var popuphelper = new ContextPopupHelper();
 *
 * in popupshowing event handler, do:
 *      if (popuphelper.isTextSelected()) ....
 * or
 *      if (popuphelper.getSelection()) ....
 *      if (popuphelper.isOverLink()) ....
 *
 * helper.getNode() will return DOM node over which last popup opened.
 */

function ContextPopupHelper() { 
}

ContextPopupHelper.prototype = {
    /* was popup opened over <X> link? */
    isTag: function(tagname) {
        // see if current node is a descendant of a node of given type
        var p = this.lastPopupNode = document.popupNode;
        while (p && p.tagName != tagname) {
            p = p.parentNode;
        }
        if (!p)
            return false;
        this.lastPopupNode = p;
        return true;
    },

    /* was popup opened over hyperlink? */
    isOverLink: function() {
		// must be over A tag and have a good href (not a name)
        return this.isTag('A') && this.lastPopupNode.href != "";
    },

    getSelection: function() {
        // alternatively, we could use gContextMenu.searchSelected(charlen as int)
        var focusedWindow = document.commandDispatcher.focusedWindow;
        var s = focusedWindow.getSelection();
        return s == null ? "" : s.toString();
    },

    isTextSelected: function() {
        return gContextMenu.isTextSelected;
    },

    getNode: function() {
        return this.lastPopupNode;
    }
};

// vim: ts=4
