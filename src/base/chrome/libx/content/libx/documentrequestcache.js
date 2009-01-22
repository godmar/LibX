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

//Test implementation of new framework for XMLHttpRequest
//objects along with cached results

//Object to handle AJAX related functionality
libx.ajax = { };

libx.ajax.DocumentRequest = ( function () {

var DocumentRequest = libx.core.Class.create ( {

        /**
         * Constructor
         *
         * @param cacheCapacity Sets the capacity of the cache used to store
         *                      xmlhttprequests.  Default value of 50 is used.
         */
        initialize : function (cacheCapacity) {
            if (cacheCapacity !== undefined && cacheCapacity !== null)
                this.xhrCache = new libx.ajax.DocumentCache(cacheCapacity);
            else
                this.xhrCache = new libx.ajax.DocumentCache(50);
        },


        /**
         * Builds the string that serves as the key to the cache
         *
         * String delimited by commas (,)
         */
        buildKeyString : function () {
            var toReturn = "";

            //Add the url
            toReturn += this.requestParams.url;

            if (this.requestParams.header !== undefined) {
                for (var headerName in this.reqParams.header) {
                    toReturn += "," + headerName + "=" + reqParams.header;
                }
            }

            if (this.requestParams.serverMIMEType !== undefined)
                toReturn += "," + "MIMEType=" + this.requestParams.serverMIMEType;

            return toReturn;
        },

        /**
         * Checks whether we have a valid object parameter
         *
         * @throws description of error
         */
         validateParameter : function(paramObj) {

            this.requestParams = { };

            //Check whether we have the required information
            if (paramObj === undefined || paramObj === null || typeof paramObj != "object") {
                throw "DocumentRequest class parameter must be of type object";
            }


            //Check mandatory parameters (url, dataType)
            if (paramObj.url === undefined) {
                libxEnv.writeLog("In DocumentRequest: param.url must be set");
                throw "In DocumentRequest: Need to provide url to document request";
            }

            if (paramObj.dataType === undefined) {
                throw "In DocumentRequest: Need to specify data type of returned data from server";
            }

            //We default to GET
            if (paramObj.type === undefined)
                paramObj.type = "GET";

            if (paramObj.type != "GET"
                    && paramObj.type != "POST") {
                throw "In DocumentRequest: Invalid request type";
            }

            //if (paramObj.type == "POST") {
            //    if (paramObj.data === undefined)
            //        throw "In DocumentRequest: Must specify data for post request";
            //}


            //We default to asynchronous
            if (paramObj.async === undefined)
                paramObj.async = true;

            if (paramObj.data === undefined) {
                paramObj.data = null;
            }

            //We default to using the cache
            if (paramObj.bypassCache === undefined)
                paramObj.bypassCache = false;

            this.requestParams = paramObj;

            return true;
        },

        /**
         * Removes a given item from the cache
         *
         * @param paramObj parameters used to create key
         *
         * @see getRequest for documentation of paramObj
         */
        removeFromCache : function ( paramObj ) {
            //Validate paramObj
            if (!this.validateParameter( paramObj))
                return;


            var key = this.buildKeyString();
            var cachedNode = this.xhrCache.findNode(key);

            if (cachedNode !== undefined) {
                //Remove it from the cache
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
         * @return {Object} xml http request (only when the result is cached
         *                                    or synchronous)
         */
        getRequest : function ( paramObj ) {

            //Validate paramObj
            if (!this.validateParameter( paramObj))
                return;

            var key = this.buildKeyString();
            var result = "";
            var cachedNode = this.xhrCache.findNode(key);

            //First check whether the cache contains the information we need
            if (!this.requestParams.bypassCache && cachedNode !== undefined) {

                //First check whether the readystate property of the
                //xmlhttprequest object is complete
                var xhr = cachedNode.data.xhr;

                if (xhr.readyState == 4) {

                    result = cachedNode.result;

                    //Invoke the callbacks
                    var stat = cachedNode.data.xhr.status;

                    if (stat == 200) {
                        if (typeof this.requestParams.success == "function") {
                            this.requestParams.success(result, stat, xhr);
                        }
                    }
                    else {
                        if (typeof this.requestParams.error == "function") {
                            this.requestParams.error(result, stat, xhr);
                        }
                    }

                    if (typeof this.requestParams.complete == "function") {
                        this.requestParams.complete(result, stat, xhr);
                    }

                    //Move the corresponding cached node to the front of the list
                    this.xhrCache.moveToFront(cachedNode);

                } //end if ready state complete

                else {

                    //Request not completed, so add the handler functions
                    //to the queue
                    this.xhrCache.addHandlers(cachedNode, this.requestParams);

                } //end if ready state not complete

                return xhr;

            } //end if request already sent

            else {
                //Need to send the request to the server
                var xmlHttpReq = libx.bd.getXMLHttpReqObj();

                    xmlHttpReq.open(this.requestParams.type, this.requestParams.url, this.requestParams.async);

                    //Used in onreadystate change function (captured through closure)
                    var params = this.requestParams;
                    var cache = this.xhrCache; 

                    if (this.requestParams.async) {
                        xmlHttpReq.onreadystatechange = function () {
                            if (xmlHttpReq.readyState == 4) {

                                if (params.dataType == "text") {
                                    result = xmlHttpReq.responseText;
                                }
                                else if (params.dataType == "xml") {
                                    result = xmlHttpReq.responseXML;
                                }

                                if (!params.bypassCache) {

                                    //Store result in cache
                                    cachedNode = cache.findNode(key);

                                    cachedNode.result = result;

                                    handlerArray = cachedNode.data.handlers;

                                        if (xmlHttpReq.status == 200) {
                                            //Invoke the list of success callbacks
                                            for (var i = 0; i < handlerArray.length; ++i) {
                                                if (typeof handlerArray[i].requestParams.success == "function") {
                                                    handlerArray[i].requestParams.success(result, xmlHttpReq.status, xmlHttpReq);
                                                }
                                            }
                                        } //end if status ok

                                        else {
                                            //Invoke the list of failure callbacks
                                            for (var i = 0; i < handlerArray.length; ++i) {
                                                if (typeof handlerArray[i].requestParams.error == "function") {
                                                    handlerArray[i].requestParams.error(result, xmlHttpReq.status, xmlHttpReq);
                                                }
                                            }
                                        } // end if status not ok

                                    //Invoke the list of  complete callbacks
                                    for (var i = 0; i < handlerArray.length; ++i) {
                                        if (typeof handlerArray[i].requestParams.complete == "function") {
                                            handlerArray[i].requestParams.complete(result, xmlHttpReq.status, xmlHttpReq);
                                        } // end if complete callback defined
                                    }
                                }
                                else {
                                    //Just invoke the handler functions
                                    if (xmlHttpReq.status == 200) {
                                        if (typeof params.success == "function")
                                            params.success(result, xmlHttpReq.status, xmlHttpReq);
                                    }
                                    else {
                                        if (typeof params.error == "function")
                                            params.error(result, xmlHttpReq.status, xmlHttpReq);
                                    }

                                    if (typeof params.complete == "function") {
                                        params.complete(result, xmlHttpReq.status, xmlHttpReq);
                                    }
                                }
                            } // end if readyState complete
                        } // end onreadystatechange function
                    } // end if asynchronous

                    //Set additional headers
                    if (this.requestParams.header !== undefined) {
                        for (headerName in requestParams.header) {
                            xmlHttpReq.setRequestHeader( headerName, this.requestParams.header[headerName]);
                        }
                    }

                    //Set content type if defined
                    //TODO: Handle this case in Internet Explorer
                    if (this.requestParams.serverMIMEType !== undefined) {
                        xmlHttpReq.overrideMimeType(this.requestParams.contentType);
                    }

                    //Store the xmlHttpRequest object in the cache
                    if (!this.requestParams.bypassCache) {
                        cache.addToCache(key, xmlHttpReq, this.requestParams);
                    }

                    xmlHttpReq.send(this.requestParams.data);

                    if (!this.requestParams.async) {
                        if (this.requestParams.dataType == "text")
                            result = xmlHttpReq.responseText;
                        else if (this.requestParams.dataType == "xml")
                            result = xmlHttpReq.responseXML;

                        //Store the result in the cache
                        if (!this.requestParams.bypassCache) {
                            //Store the result in the cache
                            cachedNode = cache.findNode(key);
                            cachedNode.result = result;
                        }
                    }

                    return xmlHttpReq;
                    
            } // end if result not in cache
        }
});

/**
 * Serves as cache
 */
libx.ajax.DocumentCache = libx.core.Class.create ( {

    /**
     * Constructor
     *
     * @param size integer representing maximum size of cache
     */
    initialize : function (maxSize) {
        this.maxSize = maxSize;
        this.cacheList = { };
        this.cacheList.begin = { };
        this.cacheList.end = { };

        this.cacheList.begin.next = this.cacheList.end;
        this.cacheList.end.previous = this.cacheList.begin;

        this.cacheTable = { };


        this.cacheLength = 0;
    },

   /**
    * Removes a given node from the cache.  Useful for cases where the result
    * wasn't valid, but the request had a 200 http code anyway.
    */
    removeFromCache : function (node) {

        node.previous.next = node.next;
        node.next.previous = node.previous;

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
     * @param param        parameters for xmlhttprequest
     *
     * @returns true if insertion was successful, false otherwise.
     */
    addToCache : function (keyContents, xhr, param) {

        //Node has the following structure
        //next     : points to next node
        //previous : points to previous node
        //data     : contents of node
        //
        //data has the following structure
        //xhr      : xml http request object
        //key      : unique key for each xhr
        //handlers : array of objects
        //
        //Each handler object contains a reference to the requestParams object.
        //That object contains three functions--two of which are invoked once the
        //request completes

        //First try to find if the cache contains the element
        var node = this.cacheTable[keyContents];

        //We found the node.  Add the handlers to the list
        if (node !== undefined) {

            node.data.handlers.push( { requestParams : param } );

            //Move this node to the beginning of list
            node.previous.next = node.next;
            node.next.previous = node.previous;

            node.next = this.cacheList.begin.next;
            node.previous = this.cacheList.begin;

            this.cacheList.begin.next.previous = node;
            this.cacheList.begin.next = node;

        }

        //Since we didn't find a node with the particular key, create a new one
        //and add it to the beginning of the list
        else {

            //Check whether the cache is full
            if (this.cacheLength >= this.maxSize) {
                //Start from the least recently accessed node and find the first
                //node whose xhr's state is complete

                var node = this.cacheList.end.previous;

                while (node !== this.cacheList.begin) {

                    if (node.data.xhr.readyState == 4) {
                        //Remove this node from the list
                        node.previous.next = node.next;
                        node.next.previous = node.previous;

                        //Remove from the hash table
                        delete this.cacheTable[node.data.key];

                        --this.cacheLength;

                        break;
                    }
                    node = node.previous;
                }
            }
            
            //We need to add this to the cache
            var newNode = { };
            newNode.data = { };

            newNode.data.xhr = xhr;
            newNode.data.key = keyContents;

            newNode.data.handlers = [ { requestParams : param } ];


            //Add the new node to the beginning of the list
            newNode.next = this.cacheList.begin.next;
            this.cacheList.begin.next.previous = newNode;

            newNode.previous = this.cacheList.begin;
            this.cacheList.begin.next = newNode;

            //Add a reference to this new node in the cacheTable
            this.cacheTable[keyContents] = newNode;

            ++this.cacheLength;
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
        
        var toReturn;

        if (this.cacheTable[keyValue] !== undefined)
            toReturn = this.cacheTable[keyValue];

        return toReturn;
    },

    
    /**
     * Moves given node to front of list
     *
     * @param {Object} node node to move to front of list
     */
    moveToFront : function (node) {

        //Move this node to the beginning of list
        node.previous.next = node.next;
        node.next.previous = node.previous;

        node.next = this.cacheList.begin.next;
        node.previous = this.cacheList.begin;

        this.cacheList.begin.next.previous = node;
        this.cacheList.begin.next = node;
    },

    /**
     * Adds handler functions to an existing node in the cache
     *
     * @param {Object} node node to add handlers to
     * @param {Object} param contains handlers
     */
    addHandlers : function (node, param) {

        node.data.handlers.push( { requestParams : param } );

        //Move node to front of list
        this.moveToFront(node);
    }
});

return DocumentRequest;

})();



