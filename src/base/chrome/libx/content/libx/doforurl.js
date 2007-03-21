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

/* 
 * doforurl.js
 * Author: Godmar Back
 * 
 * Associate an action when the user reaches a given URL, greasemonkey style. 
 * The difference between this and greasemonkey is that 
 * greasemonkey scripts will run inside the DOM of the page, just ordinary
 * user javascripts, whereas the scripts here will run inside Chrome JS.
 *
 * Example: 
 * function doAmazon(doc) {
 *      // doc is document to be loaded
 *      alert("you're at amazon");
 * }
 *
 * then place outside a function:
 *
 * new DoForURL(/\.amazon\.com/, doAmazon);
 * Voila!
 */

function dfu_log(msg) {
    if (!libxEnv.getBoolPref("libx.doforurl.debug", false))
        return;

    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                       .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage("doforurl: " + msg);
}   

var dfu_actions = new Array();

function DoForURL(/* a regex */urlpattern, /* function */what, /* array<regex> */exclude)
{
    this.pattern = urlpattern;
    this.action = what;
    this.exclude = exclude;
    this.aidx = dfu_actions.push(this);
}

DoForURL.prototype = {
    remove: function() {
        dfu_actions.splice(this.aidx, 1);
    }
}

function newpage(ev) {
        if (!ev) return;

        var win = ev.explicitOriginalTarget.defaultView;
        var doc = win.document;
        if (ev.originalTarget.location == 'about:blank')
                return;

    outer:
        for (var i = 0; i < dfu_actions.length; i++) {
            var dfu = dfu_actions[i];
            var m;
            if (m = ev.originalTarget.location.href.match(dfu.pattern)) {
                var exclude = dfu.exclude;
                if (exclude) {
                    for (var j = 0; j < exclude.length; j++)
                        if (ev.originalTarget.location.href.match(exclude[j]))
                            continue outer;
                }
                try {
                    dfu.action(doc, m);
                } catch (e) { 
                    dfu_log(e);
                }
            }
        }
}

libxEnv.addEventHandler(window, "load", 
    function () {
        var ac = document.getElementById("appcontent");
        if (ac) {
            libxEnv.addEventHandler(ac, "DOMContentLoaded", newpage, true);
        }
    },
    false);

// vim: ts=4
