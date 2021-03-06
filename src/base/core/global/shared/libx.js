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
                        
(function () {

/**
 * @namespace
 * Support for built-in access to services such 
 * as xISBN, Pubmed, CrossRef
 *
 * This namespace is global.
 */
libx.services = { };

/**
 * @namespace
 *
 * Support for the execution of libapps.
 *
 * This namespace is global.
 */
libx.libapp = { };

/**
 * Support for caching of resources.
 *
 * @namespace
 */
libx.cache = { };

/**
 * @namespace
 * Support for the user interface.
 * 
 * This namespace is global.
 */
libx.ui = {
    bd : {},
    
    /** 
     * Namespace for jQuery-based UI components.
     * @namespace
     */
    jquery : {}
};

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
     * @namespace 
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
        /**
         * Parse an XML document from a string.
         *
         * @function
         * @param {String} input source 
         * @return {Document} an XML document
         */
        loadXMLDocumentFromString : libx.core.AbstractFunction('libx.utils.xml.loadXMLDocumentFromString'),

        /**
         * Convert XML Document to string.
         *
         * @function
         * @param {DOMDocument} XML document
         * @return {String} string representation of document
         */
        convertXMLDocumentToString : libx.core.AbstractFunction('libx.utils.xml.convertXMLDocumentToString'),

        /**
         * Encode characters into valid HTML 
         *
         * @param {any} anything that can be coerced into a string
         * @return {String} string in which characters have been replaced with HTML entities
         */
    	encodeEntities : function ( s ) {
            s = String (s);

            var result = '';
            for (var i = 0; i < s.length; i++) {
                var c = s.charAt(i);
                result += {'<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;'}[c] || c;
            }
            return result;
    	},
        /**
         * Decode HTML entities into characters
         *
         * @param {String} input string
         * @return {String} string in which HTML entities have been replaced
         */
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
     * XML XPath utilities
     *
     * @namespace libx.utils.xpath
     */
    xpath: {
        /**
         * Evaluates an XPath expression and returns a single DOM node or null
         *
         * @function
         * @param {DOM Tree} doc               document (used if root is undefined)
         * @param {String}   xpathexpr         XPath expression
         * @param {DOM Tree} root              root of DOM to execute search (used
         *                                     instead of doc if defined)
         * @param {Object}   namespaceresolver Object keys are namespace prefixes,
         *                                     values are corresponding URIs
         *
         * @returns DOM node or null if not found
         *
         */
        findSingleXML : libx.core.AbstractFunction('libx.utils.xpath.findSingleXML'),

        /**
         * Evaluates an XPath expression and returns an array of DOM nodes
         *
         * @function
         * @param {DOM Tree} doc               document (used if root is undefined)
         * @param {String}   xpathexpr         XPath expression
         * @param {DOM Tree} root              root of DOM to execute search (used
         *                                     instead of doc if defined)
         * @param {Object}   namespaceresolver Object keys are namespace prefixes,
         *                                     values are corresponding URIs
         *
         * @returns array of nodes, possibly empty
         */
        findNodesXML : libx.core.AbstractFunction('libx.utils.xpath.findNodesXML')
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
         * Note: this list does not use separate list cells, rather it
         * uses inserted objects' 'next' and 'prev' properties.
         *
         * You must provide your own list cells if you wish to keep objects
         * in multiple lists.
         */
        LinkedList: libx.core.Class.create(
            /** @lends libx.utils.collections.LinkedList.prototype */{
            initialize: function () {
                this.head = { prev: null };
                this.tail = { next: null };
                this.head.next = this.tail;
                this.tail.prev = this.head;
            },
            /** insert a node */
            insert : function (before, node) {
                node.prev = before.prev;
                node.next = before;
                before.prev.next = node;
                before.prev = node;
            },
            /** remove a node */
            remove : function (node) {
                if (!('prev' in node)) {
                    libx.log.backtrace("LinkedList.remove");
                    throw new Error("LinkedList.remove: node not in list: " + node);
                }
                node.prev.next = node.next;
                node.next.prev = node.prev;
                delete node.prev;
                delete node.next;
            },
            /** return first node in list */
            front: function () {
                return this.head.next;
            },
            /** return last node in list */
            back: function () {
                return this.tail.prev;
            },
            /** add node to front of list */
            pushFront : function (node) {
                this.insert(this.front(), node);
            },
            /** add node to back of list */
            pushBack : function (node) {
                this.insert(this.tail, node);
            },
            /** remove node from front of the list 
             * @return {Node} first node
             */
            popFront : function (node) {
                var front = this.front();
                this.remove(front);
                return front;
            },
            /** remove node from back of the list 
             * @return {Node} last node
             */
            popBack : function (node) {
                var back = this.back();
                this.remove(back);
                return back;
            },
            /** 
             * iterate over a list forward like so:
             * for (var node = list.begin(); node != list.end(); node = node.next) {
             * }
             *
             * @return {Node} first node
             */
            begin: function () {
                return this.front();
            },
            /** 
             * return end marker for forward iteration. Not part of list.
             * @return {Node}
             */
            end: function () {
                return this.tail;
            },
            /** 
             * iterate over a list backward like so:
             * for (var node = list.rbegin(); node != list.rend(); node = node.prev) {
             * }
             *
             * @return {Node} last node
             */
            rbegin: function () {
                return this.back();
            },
            /** 
             * return begin marker for reverse iteration. Not part of list.
             * @return {Node}
             */
            rend: function () {
                return this.head;
            },
            /** apply 'operator' to each element */
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
 * properties 'next', 'previous', '_isReady', '_hasRun', and 'markReady',
 * 'scheduleBefore'
 */
libx.utils.collections.ActivityQueue = libx.core.Class.create(libx.utils.collections.LinkedList, 
    /** @lends libx.utils.collections.ActivityQueue.prototype */ {
    /** @private */
    prepareActivity : function (activity) {
        activity._isReady = false;
        activity._hasRun = false;
        var queue = this;
        activity.markReady = function () {
            var myArgs = [].slice.call(arguments, 0);
            queue.markActivityReady.apply(queue, [activity].concat(myArgs));
        }
        /* insert another activity that must be done before this one. */
        activity.scheduleBefore = function (beforeActivity) {
            queue.prepareActivity(beforeActivity);
            queue.insert(activity, beforeActivity);
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
     * of the queue, run all subsequent ready activities in the queue.
     *
     * Alternatively, activity.markReady() may be called.
     * @param {Object} activity
     */
    markActivityReady : function (activity) {
        activity._isReady = true;
        activity._readyArgs = [].slice.call(arguments, 1);
        while (activity == this.front() && activity._isReady) {
            activity._hasRun = true;
            this.popFront();
            activity.onready.apply(activity, activity._readyArgs);
            activity = this.front();
        }
    }
});

/**
 * @class
 *
 * An ActivityQueue that is itself an activity.
 * Any activity in the queue won't be executed
 * until the queue is marked ready.
 */
libx.utils.collections.DelayedActivityQueue = libx.core.Class.create(libx.utils.collections.ActivityQueue, 
    /** @lends libx.utils.collections.DelayedActivityQueue.prototype */ {
    initialize: function () {
        this.parent();
        this.scheduleLast(this);
    },
    onready: function () {  /* empty */ }
});

/**
 * An activity that does nothing.
 *
 * Place in an activity queue to control when other activities fire.
 *
 * @see libx.utils.collections.ActivityQueue
 * @class
 */
libx.utils.collections.EmptyActivity = libx.core.Class.create({
    onready: function () { /* empty */ }
});

/**
 * An activity that executes a function when ready.
 *
 * @see libx.utils.collections.ActivityQueue
 * @class
 */
libx.utils.collections.FunctionActivity = libx.core.Class.create({
    initialize: function (fn) {
        this.fn = fn;
    },
    onready: function () {
        this.fn();
    }
});

/**
 * Store the build date here.  Checking whether this value exists
 * as well as comparison can be used by externally loaded code to
 * determine the installed version of LibX
 */
libx.buildDate = "$builddate$";

/**
 * Store the version here. 
 */
libx.version = "$libxversion$";

var localeQueue = new libx.utils.collections.ActivityQueue();
var localeLoaded = new libx.utils.collections.EmptyActivity();

/**
 * Initialize LibX.
 *
 * @namespace
 * @function
 * @param {Boolean} primeCache whether bundled content should be added to cache
 */
libx.initialize = function (primeCache)
{
    
    /**
     * Reloads the in-memory edition.
     */
    libx.initialize.reload = function () {
    
        // clear preferences and stale data
        //libx.storage.prefsStore.clear();
        delete libx.edition;
        delete libx.prefs;
        libx.preferences.initialize();
        
        // load config if user has one set
        var configUrl = libx.utils.browserprefs.getStringPref('libx.edition.configurl', null);
        if (configUrl)
            libx.loadConfig(configUrl);
            
    }
    
    /*
     * Block until the default locale is fetched.
     * The default locale is packaged with the extension, so this
     * wait should be negligible.
     */
    localeQueue.scheduleLast(localeLoaded);
    libx.events.addListener("DefaultLocaleLoaded", {
        onDefaultLocaleLoaded: function () {
            localeLoaded.markReady();
        }
    });

    libx.locale.initialize();
    libx.preferences.initialize();
    
    if (primeCache) {
        /*
         * Prime the object cache with local copies of bootstrapped files. This
         * saves us from unnecessary xhr after initial LibX installation. We store
         * the local updates.json as updates.json.local to flag that we have
         * already done this processing.
         */
        var dummyName = 'updates.json.local';
        var found = false;
        libx.cache.defaultObjectCache.get({
            url: dummyName,
            cacheOnly: true,
            success: function () {
                found = true;
            },
            complete: function () {
                if (!found) {
                    libx.cache.defaultObjectCache.get({
                        url: libx.utils.getExtensionURL('bootstrapped/updates.json'),
                        alias: dummyName,
                        dataType: 'json',
                        success: function (updates) {
                           for (var file in updates.files) {
                               libx.cache.defaultObjectCache.get({
                                   url: libx.utils.getExtensionURL('bootstrapped/' + file),
                                   alias: libx.utils.getBootstrapURL(file),
                                   dataType: 'text'
                               });
                           }
                        }
                    });
                }
            }
        });
    }
}

/**
 * Load an edition configuration.
 * @param {String} configUrl  URL of the edition configuration
 */
libx.loadConfig = function (configUrl) {
    
    new libx.config.EditionConfigurationReader({
        url: configUrl,
        onload: function (edition) {
            
            libx.edition = edition;
            libx.log.write("Loaded configuration for edition: " + libx.edition.name['long']);
            
            // replace chrome with URLs with the actual images (data URIs)
            function chromeURL2DataURI(item) {
                if (libx.edition.options[item] == null)
                    return;
                libx.utils.getEditionResource({
                    url: libx.edition.options[item],
                    success: function (dataURI) {
                        libx.edition.options[item] = dataURI;
                    }
                });
            }
            chromeURL2DataURI("icon");
            chromeURL2DataURI("cueicon");
            chromeURL2DataURI("logo");
            
            var loadScriptsAct = {
                onready: function () {
                    var edLoadedEvent = new libx.events.Event("EditionConfigurationLoaded");
                    edLoadedEvent.edition = edition;
                    edLoadedEvent.notify();
                }
            };
            localeQueue.scheduleLast(loadScriptsAct );
            loadScriptsAct.markReady();
            
        }
    });
}

}) ();

// vim: ts=4
