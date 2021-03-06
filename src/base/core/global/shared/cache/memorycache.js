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

libx.cache.MemoryCache = ( function () {

/*
 * Helper:
 * Invoke success/complete/error callbacks on an array of requests
 */
function invokeCallbacks(params) {
    
    var status = params.status;
    if (status == null)
        status = params.xmlHttpReq.status;

    if (status == 200 || (params.result && status == 0)) {
        // 200 OK
        for (var i = 0; i < params.requests.length; ++i) {
            if (typeof params.requests[i].success == "function") {
                params.requests[i].success(params.result, status, params.xmlHttpReq, params.text);
            }
        }
    } else {
        // not OK
        for (var i = 0; i < params.requests.length; ++i) {
            if (typeof params.requests[i].error == "function") {
                params.requests[i].error(params.result, status, params.xmlHttpReq, params.text);
            }
        }
    }

    // invoke the list of complete callbacks
    for (var i = 0; i < params.requests.length; ++i) {
        if (typeof params.requests[i].complete == "function") {
            params.requests[i].complete(params.result, status, params.xmlHttpReq, params.text);
        }
    }
}

var memoryCacheClass = libx.core.Class.create (
    /** @lends libx.cache.MemoryCache.prototype */ {

    /**
     * An in-memory cache implementation for documents.
     *
     * Interface is compatible with $._ajax described here:
     * http://docs.jquery.com/Ajax/jQuery.ajax#options
     *
     * Supports multiple pending requests for the same document
     * simultaneously.
     * 
     * @param {Integer} cacheCapacity Sets the capacity of the cache used to store
     *                                xmlhttprequests.  Default value of 50 is used.
     * @constructs
     */
    initialize : function (cacheCapacity) {
        if (cacheCapacity == null)
            cacheCapacity = 50;

        this.xhrCache = new InternalCache(cacheCapacity);
    },

    /**
     * Flush cache
     */
    flush : function () {
        this.xhrCache.flush ();
    },

    /**
     * Builds the string that serves as the key to the cache
     * String delimited by commas (,)
     *
     * @private
     * @param {Object} request  the request object given to get()
     * @returns {String} the key string from this request
     */
    buildKeyString : function (request) {
        var toReturn = "";

        //Add the url
        toReturn += request.url;

        if (request.header !== undefined) {
            for (var headerName in request.header) {
                // exclude last modified header from key. this allows update requests
                // to replace existing entries in the cache
                if (headerName != 'If-Modified-Since') {
                    toReturn += "," + headerName + "=" + request.header[headerName];
                }
            }
        }

        if (request.serverMIMEType !== undefined)
            toReturn += "," + "MIMEType=" + request.serverMIMEType;

        return toReturn;
    },

    /**
     * Checks whether we have a valid object parameter
     *
     * @private
     * @throws description of error
     * @param {Object} paramObj  the request object given to get()
     */
     validateParameter : function(paramObj) {

        //Mismatch with jQuery, which says:
        //If none is specified, jQuery will intelligently pass either responseXML 
        //or responseText to your success callback, based on the MIME type of the response.
        //See http://docs.jquery.com/Ajax/jQuery.ajax#options
        //if (paramObj.dataType === undefined) {
        //    throw "In MemoryCache: Need to specify data type of returned data from server";
        //}

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
     * Removes a given request from the cache.
     *
     * @param {Object} request  the request object
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
     * @param {Object}   paramObj        contains properties used to configure
     *                                   xmlhttprequest 
     *
     * @config {Boolean}  async           boolean (defaults to true)
     *
     * @config {Function} complete        function to execute upon
     *                                   call completion (after
     *                                   success or error
     *                                   functions) parameters
     *                                   (result, status, XMLHttpRequest)
     *                                   
     * @config {String}   serverMIMEType  type of data expected
     *                                   from server 
     *
     * @config {String}   data            data to send to
     *                                   server
     *
     * @config {String}   dataType        (REQUIRED) data type
     *                                   expected from server (text,
     *                                   xml, or json)
     *
     * @config {String}   type            type of request "POST" or
     *                                   "GET" (defaults to "GET")
     *
     * @config {String}   url             (REQUIRED) url to request
     *
     * @config {Object}   header          object key = header name,
     *                                   value = header value
     *
     * @config {Function} error           function to execute on
     *                                   request failure parameters
     *                                   (result, status, XMLHttpRequest)
     *
     * @config {Function} success         function to execute on
     *                                   request success parameters
     *                                   (result, status, XMLHttpRequest)
     *
     * @config {Boolean}  bypassCache     boolean which will ignore
     *                                   cache and always send
     *                                   request if set to true
     *                                   (defaults to false).
     *
     * @config {Function} validator       function to validate the
     *                                   object's data before it
     *                                   is stored in the cache. accepts one
     *                                   params object with the following
     *                                   properties:<br/>
     *                                     url: {String} the url of the resource<br/>
     *                                     data: {Object} the resource's data<br/>
     *                                     text: {String} the stringified data<br/>
     *                                     mimeType: {String} the resource's mime-type<br/>
     *                                     success: {Function} callback function for successful validation<br/>
     *                                     error: {Function} callback function for failed validation
     *
     * @see libx.cache.validators for common validators.
     *
     * @returns {Object} XML HTTP request 
     */
    get : function ( request ) {

        var self = this;

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

                invokeCallbacks({
                    xmlHttpReq: xhr,
                    requests: [ request ],
                    result: cachedNode.result,
                    text: cachedNode.text
                });

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

            try {
                xmlHttpReq.open(request.type, request.url, request.async);
            } catch (er) {
                libx.log.write("error in XMLHTTPRequest.open for: " + request.type + " " + request.url + "\n" + er);
                if ( typeof ( request.error ) == "function" ) {
                    request.error ( er.toString(), xmlHttpReq.status, xmlHttpReq );
                }
                return xmlHttpReq;
            }

            //Used in onreadystate change function (captured through closure)
            var cache = this.xhrCache; 

            // When making a request, we don't always know if we're requesting
            // an image, so determine that here by checking the file extension.
            // When fetching an image, the dataType property of the request is
            // ignored.
            var isImage = /\.(jpg|jpeg|tiff|gif|ico|bmp|png|webp)$/i.test(request.url);

            // set response MIME type if defined
            if (request.serverMIMEType !== undefined) {
                xmlHttpReq.overrideMimeType && xmlHttpReq.overrideMimeType(request.serverMIMEType);
            } else if (isImage) {
                // For images, we must use the raw data, which we get by
                // setting this response type.
                xmlHttpReq.responseType = "arraybuffer";
            } else if (request.dataType == 'text') {
                // if we only want text response, suppress responseXML parsing for efficiency
                xmlHttpReq.overrideMimeType && xmlHttpReq.overrideMimeType("text/plain");
            }

            var onreadystatechange = function () {
                if (xmlHttpReq.readyState == 4) {

                    var text;
                    var contentType = xmlHttpReq.getResponseHeader("Content-Type");

                    if (isImage) {
                        text = libx.utils.binary.binary2Base64(xmlHttpReq.response);
                        result = 'data:' + contentType + ';base64,' + text;
                    } else {
                        text = xmlHttpReq.responseText;
                        if (request.dataType == "xml") {
                            result = xmlHttpReq.responseXML;
                        } else if (request.dataType == "text") {
                            result = xmlHttpReq.responseText;
                        } else if (request.dataType == "json") {
                            try {
                                result = libx.utils.json.parse(xmlHttpReq.responseText);
                            } catch (e) {
                                result = null;
                            }
                        } else {
                            result = xmlHttpReq.responseBody || xmlHttpReq.responseText;
                        }
                    }

                    function saveAndInvokeCallbacks() {

                        cachedNode = cache.findNode(key);
                        
                        if (xmlHttpReq.status == 200 || (result && xmlHttpReq.status == 0)) {

                            // store/update result in cache if request succeeded
                            if (cachedNode) {
                                cachedNode.data.xhr = xmlHttpReq;
                                cachedNode.result = result;
                                cachedNode.text = text;
                            }

                        } else if (cachedNode && !request.bypassCache) {

                            // don't keep error responses in the cache
                            cache.removeFromCache(cachedNode);

                        }

                        invokeCallbacks({
                            xmlHttpReq: xmlHttpReq,
                            requests: request.bypassCache ? [ request ] : cachedNode.data.requests,
                            result: result,
                            text: text
                        });

                    }

                    // don't validate chrome URLs or errors
                    if (!/^chrome.*:\/\//.test(request.url) && xmlHttpReq.status == 200 && request.validator) {
                        request.validator.call(self, {
                            url: request.url,
                            data: result,
                            text: text,
                            mimeType: contentType,
                            success: function () {
                                saveAndInvokeCallbacks();
                            },
                            error: function () {
                                // if the data is not valid, do not write to cache and trigger error
                                invokeCallbacks({
                                    xmlHttpReq: xmlHttpReq,
                                    requests: [ request ],
                                    result: result,
                                    status: 'failedvalidation',
                                    text: text
                                });
                            }
                        });
                    } else {
                        saveAndInvokeCallbacks();
                    }

                } // end if readyState complete
            } // end onreadystatechange function

            // In FF, after doing an XHR that results in a 304, all subsequent XHRs
            // seem to result in status 304 (even if they don't include an
            // If-Modified-Since header).  Setting If-Modified-Since to 0 fixes this bug.
            if (!request.header || !request.header['If-Modified-Since'])
                xmlHttpReq.setRequestHeader('If-Modified-Since', '0');

            //Set additional headers
            if (request.header !== undefined) {
                for (headerName in request.header) {
                    xmlHttpReq.setRequestHeader( headerName, request.header[headerName]);
                }
            }

            //Store the xmlHttpRequest object in the cache
            if (!request.bypassCache) {
                cache.addToCache(key, xmlHttpReq, request);
            }
            
            if (request.async)
                xmlHttpReq.onreadystatechange = onreadystatechange;

            try {
                xmlHttpReq.send(request.data);
            } catch ( e ) {
                if ( typeof ( request.error ) == "function" ) {
                    request.error ( e.toString(), xmlHttpReq.status, xmlHttpReq );
                }
            }

            if (!request.async)
                onreadystatechange();

            return xmlHttpReq;
            
        } // end if result not in cache
    }

});

var InternalCache = libx.core.Class.create (
    /** @lends libx.cache.MemoryCache.xhrCache.prototype */ {

    /**
     * Internal cache.
     *
     * @param {Integer} maxSize  integer representing maximum size of cache
     * @constructs
     * @private
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
    * @param {Object} node  node to remove
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
     * @returns {Object} node associated with that key
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
                }
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
     * @returns {Object} node or undefined if not found
     */
    findNode : function (keyValue) {
        return this.cacheTable[keyValue];
    },
    
    /**
     * Moves given node to front of list.
     *
     * @param {Object} node  node to move to front of list
     */
    moveToFront : function (node) {
        this.cacheList.remove(node);
        this.cacheList.pushFront(node);
    },

    /**
     * Add request to cache.
     *
     * @param {Object} node     node to which to add this request
     * @param {Object} request  request to be added
     */
    addRequest : function (node, request) {

        node.data.requests.push( request );

        this.moveToFront(node);
    },

    /**
     * Flush cache
     */
    flush : function () {
        this.initialize(this.maxSize);
    }

});
return memoryCacheClass;

})();

/**
 * Browser-dependent aspects of memory and file caching implementation
 * @namespace
 */
libx.cache.bd = {
    /**
     * Browser-dependent - create an XHR object
     * @returns {XMLHttpRequest} a new instance of an XMLHttpRequest
     */
    getXMLHttpReqObj : libx.core.AbstractFunction('libx.cache.bd.getXMLHttpReqObj')
}

libx.cache.defaultMemoryCache = new libx.cache.MemoryCache();

