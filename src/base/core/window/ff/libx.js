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

/*
 * LibX toolbar extension
 *
 * Author: Annette Bailey <annette.bailey@gmail.com>
 */ 
 
 /*
  * @fileoverview Firefox-specific code for the Libx extension
  */

(function () {
  
/**
 * Initialize Firefox-specific parts.
 */
libx.ui.initialize = function() {

    // fire LibX 'onContentChange' event for various FF-events related to tabs
    var tabHandlers = [
        { target: gBrowser.tabContainer, event: "TabOpen"},
        { target: gBrowser.tabContainer, event: "TabSelect"},
        { target: document.getElementById("appcontent"), event: "pageshow" },
    ];
    for (var i = 0; i < tabHandlers.length; i++) {
        var h = tabHandlers[i];
        h.target.addEventListener(h.event, function (nativeEvent) {
            var ev = new libx.events.Event("ContentChange", window);
            ev.notify(nativeEvent);
        }, false);
    }

    var ac = document.getElementById("appcontent");
    ac.addEventListener("DOMContentLoaded", function (nativeFFEvent) {
        // examine event and decide whether to fire ContentLoaded
        var ev = nativeFFEvent;

        if (!ev || !ev.originalTarget || !ev.originalTarget.location) return;
        
        var win = ev.explicitOriginalTarget.defaultView;
        if (!win)
            return;     

        if (/^(chrome:|javascript:|about:)/.test(ev.originalTarget.location))
            return;     

        // don't run anything in hidden frames - some are used for Comet-style communication
        // they examine 'textContent' on the entire document; any change will lead to
        // application failure
        if ( win.frameElement != null && win.frameElement.style.visibility == "hidden" ) 
			return;

        // wrap information in ContentLoaded Event and fire it
        var libxEvent = new libx.events.Event("ContentLoaded", window);
        libx.core.Class.mixin(libxEvent, {
            url : ev.originalTarget.location.href,
            window : win,
            nativeEvent : nativeFFEvent
        }, true);
        libxEvent.notify();
    }, true);
};

/**
 * Returns a Window object for the primary content window.
 * See https://developer.mozilla.org/en/DOM/window.content
 *
 * @return Window object for content window
 */
libx.ui.getCurrentWindowContent = function() {
    return window.content;
};

}) ();

// vim: ts=4
