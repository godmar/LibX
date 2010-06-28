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
 * @namespace
 */
libx.bootstrap = { };

/**
 * @class
 *
 * Manage the bootstrapping of a sequence of scripts.
 *
 * Loads scripts and executes them in the order in which
 * they were requested.
 */
libx.bootstrap.BootStrapper = libx.core.Class.create(
    /** @lends libx.bootstrap.BootStrapper */{
    /**
     * @param {Event} eventToFireWhenFinished (optional) 
     *          an event to fire when this bootstrapper has finished.
     */
    initialize : function (eventToFireWhenFinished) {
        this.eventToFireWhenFinished = eventToFireWhenFinished;
        this.scriptQueue = new libx.utils.collections.ActivityQueue();
        /**
         * @private
         *
         * Maps urls to event listeners.
         * A single listener is registered for each URL.
         */
        this.url2UpdateListener = { };
        this.hasFinished = false;
    },

    /**
     * Load a script.
     *
     * @param {String} scriptURL  URL
     * @param {boolean} keepUpdated  if true, reexecute script when it was updated
     * @param {Object} globalProperties  set of properties to place in global scope
     */
    loadScript : function (scriptURL, keepUpdated, globalProperties) {

        var self = this;
        var runScriptActivity = {
            onready : function (script, metadata) {
        		var globalTargetScope = {
                    bootStrapper : { 
                        baseURL : scriptURL.match (/.*\//),
                        finish  : function () { 
                            self.finish(); 
                        },
                        loadScript  : function (scriptURL) { 
                            return self.loadScript(scriptURL, keepUpdated, globalTargetScope); 
                        }
                    }
                };
                libx.core.Class.mixin(globalTargetScope, globalProperties, true);
                libx.bootstrap.loadSubScript(script, metadata, globalTargetScope);
            }
        };
        this.scriptQueue.scheduleLast(runScriptActivity);

        libx.cache.defaultObjectCache.get({
            url: scriptURL,
            fetchDataUri: libx.bootstrap.fetchDataUri,
            keepUpdated: keepUpdated,
            success: function (scriptText, metadata) { 
                runScriptActivity.markReady(scriptText, metadata);
            }
        });

        var self = this;
        if (keepUpdated) {
            // on update, reschedule activity
            if (this.url2UpdateListener[scriptURL] == undefined) {
                var evListener = {};
                evListener["onUpdate" + scriptURL] = function (ev) {
                    self.scriptQueue.scheduleLast(runScriptActivity);
                    runScriptActivity.markReady(ev.metadata);
                }
                this.url2UpdateListener[scriptURL] = evListener;
                libx.events.addListener("Update" + scriptURL, evListener);
            }
        }
    },

    /**
     * Signal that all scripts needed for bootstrapping have been
     * scheduled.
     */
    finish : function () {
        var self = this;
        var lastScriptDone = {
            onready: function () {
                self.hasFinished = true;
                if (self.eventToFireWhenFinished != null) {
                    self.eventToFireWhenFinished.notify();
                }
            }
        };
        this.scriptQueue.scheduleLast(lastScriptDone);
        lastScriptDone.markReady();
    }
});

// vim: ts=4
