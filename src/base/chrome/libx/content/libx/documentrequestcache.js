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
 * Contributor(s): Arif Khokar (aikhokar@cs.vt.edu)
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * Cache related classes
 *
 * @namespace
 */
libx.cache = { };

/**
 * An in-memory cache implementation for documents.
 *
 * Interface is compatible with $._ajax described here:
 * http://docs.jquery.com/Ajax/jQuery.ajax#options
 *
 * Supports multiple pending requests for the same document
 * simultaneously.
 */
libx.cache.MemoryCache = ( function () {

/**
 * Helper:
 * Invoke success/complete/error callbacks on an array of requests
 */
function invokeCallbacks(xmlHttpReq, requests, result) {

    if (xmlHttpReq.status == 200) {
        // 200 OK
        for (var i = 0; i < requests.length; ++i) {
            if (typeof requests[i].success == "function") {
                requests[i].success(result, xmlHttpReq.status, xmlHttpReq);
            }
        }
    } else {
        // not OK
        for (var i = 0; i < requests.length; ++i) {
            if (typeof requests[i].error == "function") {
                requests[i].error(result, xmlHttpReq.status, xmlHttpReq);
            }
        }
    }

    //Invoke the list of  complete callbacks
    for (var i = 0; i < requests.length; ++i) {
        if (typeof requests[i].complete == "function") {
            requests[i].complete(result, xmlHttpReq.status, xmlHttpReq);
        }
    }
}

var memoryCacheClass = libx.core.Class.create ( {
    /** @lends libx.cache.MemoryCache.prototype */

        /**
         * Initializes this MemoryCache object
         *
         * @constructs
         *
         * @param {Integer} cacheCapacity Sets the capacity of the cache used to store
         *                                xmlhttprequests.  Default value of 50 is used.
         */
        initialize : function (cacheCapacity) {
            if (cacheCapacity == null)
                cacheCapacity = 50;

            this.xhrCache = new InternalCache(cacheCapacity);
        },

        /**
         * Builds the string that serves as the key to the cache
         *
         * String delimited by commas (,)
         */
        buildKeyString : function (request) {
            var toReturn = "";

            //Add the url
            toReturn += request.url;

            if (request.header !== undefined) {
                for (var headerName in request.header) {
                    toReturn += "," + headerName + "=" + request.header[headerName];
                }
            }

            if (request.serverMIMEType !== undefined)
                toReturn += "," + "MIMEType=" + request.serverMIMEType;

            return toReturn;
        },

        /**
         * @private
         *
         * Checks whether we have a valid object parameter
         *
         * @throws description of error
         */
         validateParameter : function(paramObj) {

            //Mismatch with jQuery, which says:
            //If none is specified, jQuery will intelligently pass either responseXML 
            //or responseText to your success callback, based on the MIME type of the response.
            //See http://docs.jquery.com/Ajax/jQuery.ajax#options
            if (paramObj.dataType === undefined) {
                throw "In MemoryCache: Need to specify data type of returned data from server";
            }

            var defaults = {
                type : "GET",
                async : true,
                data : null,
                bypassCache : false
            };

            for (var property in defaults) {
                if (paramObj[property] === undefined)
                    paramObj[property] = defaults[property];
            }

            if (paramObj.type != "GET" && paramObj.type != "POST") {
                throw "In MemoryCache: Invalid request type: " + paramObj.type;
            }

            //if (paramObj.type == "POST") {
            //    if (paramObj.data === undefined)
            //        throw "In DocumentRequest: Must specify data for post request";
            //}
        },

        /**
         * Removes a given request from the cache
         *
         * @param request
         *
         * @see get for documentation of request
         */
        removeFromCache : function ( request ) {
            this.validateParameter(request);

            var key = this.buildKeyString(request);
            var cachedNode = this.xhrCache.findNode(key);

            if (cachedNode !== undefined) {
                this.xhrCache.removeFromCache(cachedNode);
            }
        },

        /**
         * Will issue an XMLHTTPRequest or read the cache to get the
         * information needed.
         *
         * @param {Object}   paramObj contains properties used to configure
         *                            xmlhttprequest 
         *
         * @param {Boolean}  paramObj.async           boolean (defaults to true)
         *
         * @param {Function} paramObj.complete        function to execute upon
         *                                            call completion (after
         *                                            success or error
         *                                            functions) parameters
         *                                            (XMLHttpRequest, status)
         *
         * @param {String}   paramObj.contentType     set content-type of data
         *                                            that's sent to server
         *
         * @param {String}   paramObj.serverMIMEType  type of data expected
         *                                            from server 
         *
         * @param {String}   paramObj.data            data to send to
         *                                            server
         *
         * @param {String}   paramObj.dataType        (REQUIRED) data type
         *                                            expected from server (text
         *                                            or xml)
         *
         * @param {String}   paramObj.type            type of request "POST" or
         *                                            "GET" (defaults to "GET")
         *
         * @param {String}   paramObj.url             (REQUIRED) url to request
         *
         * @param {String}   paramObj.dataType        (REQUIRED) string
         *                                            representing return type
         *                                            (xml or text)
         *
         * @param {Object}   paramObj.header          object key = header name,
         *                                            value = header value
         *
         * @param {Function} paramObj.error           function to execute on
         *                                            request failure parameters
         *                                            (XMLHttpRequest, status)
         *
         * @param {Function} paramObj.success         function to execute on
         *                                            request success parameters
         *                                            (XMLHttpRequest, status)
         *
         * @param {Boolean}  paramObj.bypassCache     boolean which will ignore
         *                                            cache and always send
         *                                            request if set to true
         *                                            (defaults to false).
         *
         * @return {Object} XML HTTP request 
         */
        get : function ( request ) {

            this.validateParameter(request);

            var key = this.buildKeyString(request);
            var result = "";
            var cachedNode = this.xhrCache.findNode(key);

            //First check whether the cache contains the information we need
            if (!request.bypassCache && cachedNode !== undefined) {

                //First check whether the readystate property of the
                //xmlhttprequest object is complete
                var xhr = cachedNode.data.xhr;

                if (xhr.readyState == 4) {

                    invokeCallbacks(xhr, [ request ], cachedNode.result);

                    //Move the corresponding cached node to the front of the list
                    this.xhrCache.moveToFront(cachedNode);

                } //end if ready state complete

                else {

                    this.xhrCache.addRequest(cachedNode, request);

                } //end if ready state not complete

                return xhr;

            } //end if request already sent

            else {
                //Need to send the request to the server
                var xmlHttpReq = libx.cache.bd.getXMLHttpReqObj();

                xmlHttpReq.open(request.type, request.url, request.async);

                //Used in onreadystate change function (captured through closure)
                var cache = this.xhrCache; 

                xmlHttpReq.onreadystatechange = function () {
                    if (xmlHttpReq.readyState == 4) {

                        if (request.dataType == "text") {
                            result = xmlHttpReq.responseText;
                        }
                        else if (request.dataType == "xml") {
                            result = xmlHttpReq.responseXML;
                        }

                        if (!request.bypassCache) {

                            //Store result in cache
                            cachedNode = cache.findNode(key);

                            cachedNode.result = result;

                            invokeCallbacks(xmlHttpReq, cachedNode.data.requests, result);
                        }
                        else {
                            invokeCallbacks(xmlHttpReq, [ request ], result);
                        }
                    } // end if readyState complete
                } // end onreadystatechange function

                //Set additional headers
                if (request.header !== undefined) {
                    for (headerName in request.header) {
                        xmlHttpReq.setRequestHeader( headerName, request.header[headerName]);
                    }
                }

                //Set content type if defined
                //TODO: Handle this case in Internet Explorer
                if (request.serverMIMEType !== undefined) {
                    xmlHttpReq.overrideMimeType(request.contentType);
                }

                //Store the xmlHttpRequest object in the cache
                if (!request.bypassCache) {
                    cache.addToCache(key, xmlHttpReq, request);
                }
                
                try {
                    xmlHttpReq.send(request.data);
                } catch ( e ) {
                    if ( typeof ( request.error ) == "function" ) {
                        request.error ( e.toString(), xmlHttpReq.status, xmlHttpReq );
                    }
                }

                if (!request.async && libx.cache.bd.doesNotFireReadyStateChangeOnSynchronous)
                    xmlHttpReq.onreadystatechange();

                return xmlHttpReq;
                
            } // end if result not in cache
        }
});
/**
 * Serves as private cache
 */
var InternalCache = libx.core.Class.create ( {

    /**
     * Constructor
     *
     * @param size integer representing maximum size of cache
     */
    initialize : function (maxSize) {
        this.maxSize = maxSize;
        this.cacheList = new libx.utils.collections.LinkedList();

        this.cacheTable = { };
        this.cacheLength = 0;
    },

   /**
    * Removes a given node from the cache.  Useful for cases where the result
    * wasn't valid, but the request had a 200 http code anyway.
    */
    removeFromCache : function (node) {

        this.cacheList.remove(node);

        //Remove from the hash table
        delete this.cacheTable[node.data.key];

        --this.cacheLength;
    },

    /**
     * Attempts to add an element to the cache with a given key.  If an
     * element with the same key is already stored in the cache, then we
     * add the handler functions to the queue associated with the element.
     * Otherwise, we add a new element to the cache.
     *
     * @param keyContents  key for cache element
     * @param xhr          xmlhttprequest object
     * @param request      request object
     *
     * @returns node associated with that key
     */
    addToCache : function (keyContents, xhr, request) {

        //Node has the following structure
        //data     : contents of node
        //next, prev: used by LinkedList
        //
        //data has the following structure
        //xhr      : xml http request object
        //key      : unique key for each xhr
        //requests : array of request objects
        //
        //Request objects may contain three methods--two of which are invoked once the
        //request completes

        //First try to find if the cache contains the element
        var node = this.cacheTable[keyContents];

        if (node !== undefined) {

            //We found the node.  Add the request to the list
            node.data.requests.push( request );

            //Move this node to the beginning of list
            this.cacheList.remove(node);
            this.cacheList.pushFront(node);

            return node;
        }

        //Since we didn't find a node with the particular key, create a new one
        //and add it to the beginning of the list
        else {

            //Check whether the cache is full
            if (this.cacheLength >= this.maxSize) {
                //Start from the least recently accessed node and find the first
                //node whose xhr's state is complete

                var node = this.cacheList.rbegin();

                while (node !== this.cacheList.rend()) {

                    if (node.data.xhr.readyState == 4) {
                        this.removeFromCache (node);
                        break;
                    }
                    node = node.prev;
                }
            }
            
            //Add new node to beginning of the list
            var newNode = { 
                data: {
                    xhr: xhr,
                    key: keyContents,
                    requests: [ request ]
                },
            };

            this.cacheList.pushFront(newNode);

            //Add a reference to this new node in the cacheTable
            this.cacheTable[keyContents] = newNode;

            ++this.cacheLength;

            return newNode;
        }
    },

    /**
     * Returns the corresponding node associated with a given key value
     *
     * @param {String} keyValue key associated with node
     *
     * @returns node or undefined if not found
     */
    findNode : function (keyValue) {
        return this.cacheTable[keyValue];
    },
    
    /**
     * Moves given node to front of list
     *
     * @param {Object} node node to move to front of list
     */
    moveToFront : function (node) {
        this.cacheList.remove(node);
        this.cacheList.pushFront(node);
    },

    /**
     * Add request to cache
     *
     * @param {Object} node node to which to add this request
     * @param {Object} request to be added
     */
    addRequest : function (node, request) {

        node.data.requests.push( request );

        this.moveToFront(node);
    }
});
return memoryCacheClass;

})();

libx.cache.globalMemoryCache = new libx.cache.MemoryCache();

