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
 */

(function () {

// maps eventName to array of observers
var handlerMap = { };

/**
 * @namespace libx.events
 *
 * Support for events.  LibX events provide a 
 * browser-independent implementation of a observer pattern.
 *
 * They are not related to browser events (neither in a content window,
 * nor in FF XUL).
 */
libx.events = { 
    /**
     * Event represents an LibX internal event.
     *
     * @class
     */
    Event : libx.core.Class.create(
        /** @lends libx.events.Event.prototype */{
        initialize : function (eventName) {
            this.eventName = eventName;
        },
        /** notify any observers */ 
        notify : function () {
            var observers = handlerMap[this.eventName] || [];
            for (var i = 0; i < observers.length; i++)
                observers[i]["on" + this.eventName].apply(observers[i], [this].concat(arguments));
        }
    }),

    /**
     * Add a listener for a given event
     * @param {String} eventName - name of event, say "load"
     * @param {Object} observer - must have oneventName method, e.g., "onload"
     */
    addListener : function (eventName, observer) {
        if (handlerMap[eventName] == undefined)
            handlerMap[eventName] = [ ];

        handlerMap[eventName].push(observer);
    }

    /* XXX to be done removeListener */
};

})();
