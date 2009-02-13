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
 * LibX toolbar extension
 *
 * Author: Annette Bailey <annette.bailey@gmail.com>
 */ 
                        
/**
 * @namespace
 * Support for built-in access to services such 
 * as xISBN, Pubmed, CrossRef
 *
 * This namespace is global.
 */
libx.services = { }

/**
 * @namespace
 *
 * Support for the execution of libapps.
 *
 * This namespace is global.
 */
libx.libapp = { }

/**
 * @namespace
 * Utility namespaces
 *
 * This namespace is global.
 */
libx.utils = { 
    /**
     * @namespace libx.utils.stdnumsupport
     *
     * Support for standard numbers such as ISBNs
     */
    stdnumsupport: { },

    /**
     * @namespace libx.utils.browserprefs
     *
     * Support for manipulating preferences.
     *
     * These are reachable in Firefox via about:config and
     * in IE by editing a prefs.txt file.
     *
     * Previous versions of LibX used this preference store for
     * user preferences.
     */
    browserprefs: { },

    /**
     * XML utilities
     *
     * @namespace libx.utils.xml
     */
    xml: { 
    	encodeEntities : function ( s ) {
    		var result = '';
        	for (var i = 0; i < s.length; i++) {
            	var c = s.charAt(i);
            	result += {'<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;'}[c] || c;
        	}
        	return result;
    	},
    	decodeEntities : function ( s ) {
    		var result = '';
        	for (var i = 0; i < s.length; i++) {
            	var c = s.charAt(i);
            	result += {'&lt;':'<', '&gt;':'>', '&amp;':'&', '&quot;':'"'}[c] || c;
        	}
        	return result;
    	}
    },

    /**
     * String utilities
     *
     * @namespace libx.utils.string
     */
    string: { 
		/**
		 *	Trim's all spaces from the beginning and end of a string
		 *	@param s - string to trim
		 *	@return String with all leading and trailing spaces removed
		 */
		trim : function ( s ) {
			return s.replace(/^\s*/, "").replace(/\s*$/, "");
		}
    },

    /**
     * @namespace libx.utils.types
     *
     * Convenience methods for dealing with JavaScript types.
     */
    types: { 
        /**
         * Turns (string) "true" -> true
         *       (string) "false" -> false
         *       (string) "" -> null
         * Otherwise, returns input.
         *
         * @param {String} value - input string
         * @return {String|Boolean|null} - converted input
         */ 
        normalize : function (value) {
            if (value == "false")
                return false;
            if (value == "true")
                return true;
            if (value == "")
                return null;
            return String(value);
        },
        
        /**
         * Compute a string representing all fields of an object.
         *
         * @param {String} prefix - if given, prefix is prepended to string
         * @param {Object} obj - object to be dumped
         * @return {String} string representation.
         */
        dumpObject : function (obj, prefix) {
            prefix = prefix || "";
            for (var k in obj)
                prefix += k + "=" + obj[k] + " (" + typeof obj[k] + "), ";
            return prefix;
        }
    },

    /**
     * @namespace libx.utils.collections
     *
     * Convenience methods for dealing with collections
     */
    collections: {
        /**
         * @class
         *
         * A standard-style doubly-linked list
         */
        LinkedList: libx.core.Class.create(
            /** @lends libx.utils.collections.LinkedList */{
            initialize: function () {
                this.head = { prev: null };
                this.tail = { next: null };
                this.head.next = this.tail;
                this.tail.prev = this.head;
            },
            insert : function (before, node) {
                node.prev = before.prev;
                node.next = before;
                before.prev.next = node;
                before.prev = node;
            },
            remove : function (node) {
                node.prev.next = node.next;
                node.next.prev = node.prev;
                delete node.prev;
                delete node.next;
            },
            /** first node in list */
            front: function () {
                return this.head.next;
            },
            /** last node in list */
            back: function () {
                return this.tail.prev;
            },
            pushFront : function (node) {
                this.insert(this.front(), node);
            },
            pushBack : function (node) {
                this.insert(this.tail, node);
            },
            popFront : function (node) {
                var front = this.front();
                this.remove(front);
                return front;
            },
            popBack : function (node) {
                var back = this.back();
                this.remove(back);
                return back;
            },
            begin: function () {
                return this.front();
            },
            end: function () {
                return this.tail;
            },
            rbegin: function () {
                return this.back();
            },
            rend: function () {
                return this.head;
            },
            /** iteration */
            map : function (operator) {
                for (var node = this.begin(); node != this.end(); node = node.next) {
                    operator(node);
                }
            },
            toString : function () {
                var s = "[";
                this.map(function (node) { 
                    s += node + ", "; 
                });
                return s + "]";
            }
        }),

        unittests : function (out) {
            out.write("Running unit tests for linked list\n");
            var ll = new libx.utils.collections.LinkedList();
            var ObjectWrapper = new libx.core.Class.create({
                initialize : function (value) { this.value = value; },
                toString: function () { return "" + this.value; }
            });
            ll.pushFront(new ObjectWrapper("C"));
            ll.pushFront(new ObjectWrapper("B"));
            ll.pushFront(new ObjectWrapper("A"));
            out.write(ll + "\n");  // A, B, C
            ll.pushFront(ll.popBack());
            out.write(ll + "\n");  // C, A, B
            ll.pushBack(ll.popFront());
            out.write(ll + "\n");  // A, B, C
            var b = ll.front().next;
            ll.remove(b);
            out.write(ll + "\n");  // A, C
            ll.pushFront(b);
            out.write(ll + "\n");  // B, A, C
            // reverse iteration
            for (var n = ll.rbegin(); n != ll.rend(); n = n.prev) {
                out.write(n + ", ");    // C, A, B
            }
            out.write("\n"); 
        }
    },
    /**
     *	Provides timer related functionality to component code
     */
    timer : { }
};

/**
 * @class
 *
 * A FIFO queue of activities
 *
 * Activities must not use 
 * properties 'next', 'previous', '_isReady', '_hasRun', and 'markReady'
 */
libx.utils.collections.ActivityQueue = libx.core.Class.create(libx.utils.collections.LinkedList, 
    /** @lends libx.utils.collections.ActivityQueue.prototype */ {
    /** @private */
    prepareActivity : function (activity) {
        activity._isReady = false;
        activity._hasRun = false;
        var queue = this;
        activity.markReady = function () {
            var myArgs = [].splice.call(arguments, 0);
            queue.markReady.apply(queue, [activity].concat(myArgs));
        }
    },
    /**
     * Schedule an activity at the front of the queue
     *
     * @param {Object} activity
     * @param {Function} activity.onready - function to be run when ready
     */
    scheduleFirst : function (activity) {
        this.prepareActivity(activity);
        this.pushFront(activity);
    },
    /**
     * Schedule an activity at the tail of the queue
     *
     * @param {Object} activity
     * @param {Function} activity.onready - function to be run when ready
     */
    scheduleLast : function (activity) {
        this.prepareActivity(activity);
        this.pushBack(activity);
    },
    /**
     * Mark an activity as ready.  If the activity is at the head
     * of the queue, run all ready activities in the queue.
     *
     * Alternatively, activity.markReady() may be called.
     * @param {Object} activity
     */
    markReady : function (activity) {
        activity._isReady = true;
        activity._readyArgs = [].splice.call(arguments, 1);
        while (activity == this.front() && activity._isReady) {
            activity._hasRun = true;
            this.popFront();
            activity.onready.apply(activity, activity._readyArgs);
            activity = this.front();
        }
    }
});

/**
 * An activity that does nothing.
 *
 * Place in an activity queue to control when other activities fire.
 *
 * @see libx.utils.collections.ActivityQueue
 *
 * @static
 */
libx.utils.collections.EmptyActivity = libx.core.Class.create({
    onready: function () { /* empty */ }
});

/**
 * Store the build date here.  Checking whether this value exists
 * as well as comparison can be used by externally loaded code to
 * determine the installed version of LibX
 */
libx.buildDate = "$builddate$";

/**
 *
 * Initialize LibX
 *
 */
libx.initialize = function () 
{
	libx.locale.initialize();
    // Load Preferences
    libx.preferences.initialize();

    new libx.config.EditionConfigurationReader({
        url: "chrome://libx/content/config.xml",
        onload: function (edition) {
            libx.edition = edition;
            libx.log.write("Loaded configuration for edition: " + libx.edition.name['long']);

            var edLoadedEvent = new libx.events.Event("EditionConfigurationLoaded");
            edLoadedEvent.edition = edition;
            edLoadedEvent.notify();

            // var editionRoot = libx.edition.localizationfeeds.primary;
            var editionRoot = null;
            var bootstrapUrl = editionRoot || 
                libx.utils.browserprefs.getStringPref("libx.bootstrap.global.url", 
                    "http://libx.org/libx-new/src/libx2/bootstrapglobal.js");
        
            libx.bootstrap.loadScript(bootstrapUrl, true);
        }
    });
}

// vim: ts=4
