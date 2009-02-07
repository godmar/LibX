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
 * Services namespaces
 *
 * This namespace is global.
 */
libx.services = { }

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
    xml: { },

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
            },
            front: function () {
                return this.head.next;
            },
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
 * Store the build date here.  Checking whether this value exists
 * as well as comparison can be used by feed code if needed.
 */
libx.buildDate = "$builddate$";

/**
 * Initialize LibX
 *
 */
libx.initialize = function () 
{
	libx.locale.initialize();
    // Load Preferences
    libx.preferences.initialize();
}

// vim: ts=4
