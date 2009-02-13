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

/**
 * Bootstrap LibX code from a script URL.
 *
 * The code below is include twice.
 * Once in global space (where 'libx' refers to the global libx object)
 * and once per window (where 'libx' refers to the per-window wrapper
 * and where 'window' is captured).
 *
 * @namespace
 */
libx.bootstrap = {
    /**
     * Queue of scripts scheduled for execution
     */
    scriptQueue : new libx.utils.collections.ActivityQueue(),

    /**
     * Load a script.
     *
     * @param {String} scriptURL  URL
     */
    loadScript : function (scriptURL, keepUpdated) {

        var runScriptActivity = {
            baseURL : scriptURL.match (/.*\//),
            onready : function (metadata) {
                try {
                    libx.log.write("loading (" + metadata.originURL + ") from (" + metadata.chromeURL + ")", "bootstrap");

                    var jsSubScriptLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
                        .getService(Ci.mozIJSSubScriptLoader);
                    jsSubScriptLoader.loadSubScript(metadata.chromeURL, { scriptBase : this, libx : libx });  // FF only!
                    libx.log.write("done loading (" + metadata.originURL + ")");

                } catch (e) {
                    var where = e.location || (e.fileName + ":" + e.lineNumber);
                    libx.log.write( "error loading " + metadata.originURL + " -> " + e + " " + where);
                }
            }
        };
        this.scriptQueue.scheduleLast(runScriptActivity);

        libx.cache.defaultObjectCache.get({
            url: scriptURL,
            keepUpdated: keepUpdated,
            success: function (scriptText, metadata) { 
                runScriptActivity.markReady(metadata);
            }
        });

        var self = this;
        if (keepUpdated) {
            // on update, reschedule activity
            if (this.urlUpdateListenerMaps[scriptURL] == undefined) {
                var evListener = {};
                evListener["onUpdate" + scriptURL] = function (ev) {
                    self.scriptQueue.scheduleLast(runScriptActivity);
                    runScriptActivity.markReady(ev.metadata);
                }
                this.urlUpdateListenerMaps[scriptURL] = evListener;
                libx.events.addListener("Update" + scriptURL, evListener);
            }
        }
    },
    /**
     * @private
     *
     * Maps urls to event listeners.
     * A single listener is registered for each URL.
     */
    urlUpdateListenerMaps : { },

    /**
     * Signal that all scripts needed for bootstrapping have been
     * scheduled.
     */
    finish : function () {
        var self = this;
        var lastScriptDone = {
            onready: function () {
                self.hasFinished = true;
                if (libx == libx.global) {
                    new libx.events.Event("GlobalBootstrapDone").notify();
                }
            }
        };
        this.scriptQueue.scheduleLast(lastScriptDone);
        lastScriptDone.markReady();
    },
    hasFinished : false
};

(function () {

/**
 * If this is bootstrapping a window's script, wait for GlobalBootstrapDone
 * event to be fired.
 */
if (libx != libx.global && !libx.global.bootstrap.hasFinished) {
    var startQueue = new libx.utils.collections.EmptyActivity();
    libx.bootstrap.scriptQueue.scheduleFirst(startQueue);

    /* Make sure that all per-window bootstrap scripts are executed after the global bootstrap scripts */
    libx.events.addListener("GlobalBootstrapDone", {
        onGlobalBootstrapDone: function (globalBootstrapDoneEvent) {
            startQueue.markReady();
        }
    });
}

}) ();


// vim: ts=4
