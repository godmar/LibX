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
 * Contributor(s): Tobias Wieschnowsky (frostyt@vt.edu)
 * Contributor(s): Arif Khokar (aikhokar@cs.vt.edu)
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * @fileoverview
 *
 * Implement custom cache libx.cache.ObjectCache.
 *
 */
(function () {

/* XXX these should not be global. They should be instance fields on ObjectCache */
var cacheStore = new libx.storage.Store('cache');
var metaStore = new libx.storage.Store('metacache');

/* 
 * Retrieve a cached item from cacheStore. 
 * Called only after hit in metaStore.
 */
function getCachedItem (request, metadata) {
    cacheStore.getItem({
        key: trimQuery(request.ignoreQuery, request.url),
        success: function (text) {
            if (request.success) {
                var data = text;
                if (request.dataType == 'xml') {
                    try {
                        data = libx.utils.xml.loadXMLDocumentFromString(text);
                    } catch (e) {
                        request.error && request.error('parsererror');
                        return;
                    }
                }
                else if (request.dataType == 'json') {
                    try {
                        data = libx.utils.json.parse(text);
                    } catch (e) {
                        request.error && request.error('parsererror');
                        return;
                    }
                }
                request.success(data, metadata);
            }
        },
        complete: request.complete
    });
}

var RetrievalType = { 
    GET : 1,    // get an item and invoke 'success'
    UPDATE : 2  // check for updates
}; 

function trimQuery(doTrim, url) {
    if (doTrim) {
        var idx = url.indexOf("?");
        url = (idx == -1 ? url : url.substr(0, idx));
    }
    return url;
}

function retrieveRequest(request, retrievalType) {
    var headers = {};
    var self = this;

    if (retrievalType == RetrievalType.UPDATE && request.lastModified != null)
        headers["If-Modified-Since"] = request.lastModified;

    // For 304 responses, FF throws "No element found" errors; overriding the MIME
    // type fixes this
    var mimeType = "text/plain";

    // for some reason, images can only be converted to data URIs if this mime type is given
    if (/\.(jpg|gif|ico|bmp)$/i.test(request.url) && !request.serverMIMEType)
        mimeType = "text/plain; charset=x-user-defined";
        
    var url = trimQuery(request.ignoreQuery, request.url);
       
    libx.cache.defaultMemoryCache.get({
        dataType: 'text',
        header: headers,
        url: request.url,
        serverMIMEType: request.serverMIMEType || mimeType,
        bypassCache: true,
        error: function(data, status, xhr) {    

            if (!(RetrievalType.UPDATE && status == 304)) {
                if (request.error)
                    request.error(status);
            }

            if (request.complete)
                request.complete();
        },
        success: function (data, status, xhr) {

            var contentType = xhr.getResponseHeader("Content-Type");
            // XXX store 'expires' date on disk
            var metadata = {
                lastModified : xhr.getResponseHeader('Last-Modified'),
                mimeType : contentType,
                sha1 : libx.utils.hash.hashString(data)
            };
    
            if (/image/.test(contentType)) {
                data = 'data:' + contentType + ';base64,' + libx.utils.binary.binary2Base64(data);
            }
            
            // write the data first, then its metadata
            cacheStore.setItem({
                key: url,
                value: data,
                complete: function () {
                    self.putMetadata({
                        url: url,
                        metadata: metadata,
                        complete: function () {
                            getCachedItem(request, metadata);
                        }
                    });
                }
            });
            

        }
    });
}

/**
 * A backed cache for objects such as AtomPub XML documents, 
 * JavaScript files, and other resources such as images.
 * Resources are addressed by a URL.
 *
 * Automatic update functionality: a resource can be "auto-updated,"
 * in which case the cache will periodically check if a newer version
 * is available.  If a newer version is available, it will be fetched,
 * added to the cache, and an onUpdate event for that resource will
 * be fired.
 *
 * Dependent resources: resources may have dependent resources.
 * If a newer version of a resource that has dependent resources is available,
 * dependent resources are checked.  This process is repeated transivitely
 * until all resources have been checked.  Then the 'onUpdate' event is
 * fired.  This ensures that a new version of all dependent resources is
 * available when the onUpdate event for a resource with dependents is fired.
 *
 * @namespace
 */
libx.cache.ObjectCache = libx.core.Class.create(
    /** @lends libx.cache.ObjectCache.prototype */ {
    initialize: function () {

        var self = this;
        this.cachedRequests = new Array();

    },

    /**
     *  Get an object, based on its URL.
     *  @param {Options} request 
     *      Modeled after <a href="http://docs.jquery.com/Ajax/jQuery.ajax#options">jQuery._ajax</a>
     *      with the following additions:
     *
        BRN: OBSOLETE
     *  @param {Boolean} request.fetchDataUri: if true, data is returned
     *      and stored as a data URI instead of raw data
     *  @param {Boolean} request.cacheOnly: if true, success will only be called if the object
     *      is in the cache.  If the object is not in the cache, request.complete() is immediately
     *      fired.  No XHRs are triggered.
     *
     *  @param {String} extension (optional) required extension, if any.  If not given, the
     *      extension is computed from the returned Content-Type.
     *
     */
    get : function (request) {
    
        // don't cache chrome URLs
        if (/^chrome.*:\/\//.test(request.url)) {
            libx.cache.defaultMemoryCache.get(request);
            return;
        }
    
        var self = this;

        this.getMetadata({
            url: request.url,
            success: function(metadata) {
                getCachedItem (request, metadata);
            },
            notfound: function() {
                if (request.cacheOnly)
                    request.complete && request.complete();
                else
                    retrieveRequest.call(self, request, RetrievalType.GET);
            }
        });
        
    },

    /*
     * Get metadata associated with a URL, or null if URL is not (or no longer!) cached
     */
    getMetadata : function (paramObj) {
        var url = trimQuery(paramObj.ignoreQuery, paramObj.url);
        metaStore.getItem({
            key: url,
            success: function(text) {
                if(paramObj.success)
                    paramObj.success(libx.utils.json.parse(text));
            },
            notfound: paramObj.notfound,
            complete: paramObj.complete
            
        });
    },

    /*
     * Write metadata to disk
     */
    putMetadata : function (paramObj) {
        var url = trimQuery(paramObj.ignoreQuery, paramObj.url);
        metaStore.setItem({
            key: url,
            value: libx.utils.json.stringify(paramObj.metadata),
            complete: paramObj.complete
        });
    },

    /**
     * Remove all cached files
     */
    purgeAll : function () {
        cacheStore.clear();
    },

    // BRN: change this!
    /**
     * Update all requests that have the 'keepUpdated' flag set.
     */
    updateRequests : function () {
        updateRequests(this.cachedRequests);
    },

    update : function (request) {
        retrieveRequest.call(this, request, RetrievalType.UPDATE);
    }
        
});

libx.cache.defaultObjectCache = new libx.cache.ObjectCache();

}) ();
