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
 * This file contains functionality related to support for LibX events.
 *
 * This file is global.
 */

(function () {

// maps eventName to array of observers
// an observer is an object { handler: obj, window: win }
// window may be null if the event is not tied to a window
var handlerMap = { };

/**
 * @name libx.events
 * @namespace 
 *
 * Support for events.  LibX events provide a 
 * browser-independent implementation of a observer pattern.
 *
 * They are not related to browser events (neither in a content window,
 * nor in FF XUL).
 */

libx.events = { 
    Event : libx.core.Class.create(
        /** @lends libx.events.Event.prototype */{
        /**
         * Event represents an LibX internal event.
         *
         * @param {String} eventName name of event, can be freely chosen
         * @param {Window} eventWindow window (optional)
         * @constructs
         */
        initialize : function (eventName, eventWindow) {
            this.eventName = eventName;
            this.eventWindow = eventWindow;
        },
        /**
         * Notify any observers.  If the event was created with a
         * window, only observers that specified the same window
         * will be notified.
         */
        notify : function () {
            // see http://www.mennovanslooten.nl/blog/post/59
            var argsAsArray = [].splice.call(arguments, 0);
            var observers = handlerMap[this.eventName] || [];
            for (var i = 0; i < observers.length; i++)
                if (this.eventWindow == observers[i].window)
                    observers[i].handler["on" + this.eventName].apply(observers[i].handler, [this].concat(argsAsArray));
        }
    }),

    /**
     * Add a listener for a given event
     * @param {String} eventName - name of event, say "load"
     * @param {Object} observer - must have oneventName method, e.g., "onload"
     * @param {Window} window (optional) - only listen to events 
     *                 associated with this window
     * @param {String} observerId (optional) - if given, replace listener
     *                 previously added using the same observerId
     */
    addListener : function (eventName, observer, observerWindow, observerId) {
        var handlers = handlerMap[eventName];
        if (handlers == undefined)
            handlers = handlerMap[eventName] = [ ];

        for (var i = 0; i < handlers.length; i++) {
            if (handlers[i].id == observerId && handlers[i].window == observerWindow) {
                handlers.splice(i, 1);
                break;
            }
        }
        handlerMap[eventName].push({ handler : observer, window: observerWindow, id : observerId });
    }

    /* XXX to be done removeListener */
};

})();
