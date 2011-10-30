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

    if (retrievalType == RetrievalType.UPDATE && request.metadata && request.metadata.lastModified != null)
        headers["If-Modified-Since"] = request.metadata.lastModified;

    var url = trimQuery(request.ignoreQuery, request.alias || request.url);

    libx.cache.defaultMemoryCache.get({
        header: headers,
        url: request.url,
        dataType: request.dataType,
        validator: request.validator,
        serverMIMEType: request.serverMIMEType,
        bypassCache: retrievalType == RetrievalType.UPDATE,
        error: function(data, status, xhr) {    
            // if we get a 304, update the lastAccessed field in the metadata
            if (RetrievalType.UPDATE && status == 304) {
                request.metadata.lastAccessed = Date.now();
                request.metadata.expired = false;
                self.putMetadata({
                    url: url,
                    metadata: request.metadata,
                    success: function () {
                        request.complete && request.complete();
                    }
                });
            } else {
                request.error && request.error(status);
                request.complete && request.complete();
            }
        },
        success: function (data, status, xhr, text) {

            var contentType = xhr.getResponseHeader("Content-Type");
    
            var metadata = {
                // when the item was last fetched from the server
                lastAccessed: Date.now(),
                // when the item was last modified on the server
                lastModified: xhr.getResponseHeader('Last-Modified'),
                // the data's mimetype
                mimeType: contentType,
                // a SHA1 hash of the data used for validation and updating
                sha1: libx.utils.hash.hashString(text),
                // if true, this item will be lazily updated on the next get()
                expired: false
            };

            var isImage = /\.(jpg|jpeg|tiff|gif|ico|bmp|png|webp)$/i.test(request.url);
            isImage && (data = text = 'data:' + contentType + ';base64,' + text);

            function writeToCache(success, complete) {
                libx.storage.cacheStore.setItem({
                    key: url,
                    value: text,
                    success: function () {
                        self.putMetadata({
                            url: url,
                            metadata: metadata,
                            success: function () {
                                success && success(data, metadata, xhr);
                                complete && complete();
                            }
                        });
                    }
                });
            }
            if (request.delayWrite) {
                request.delayWrite(writeToCache);
                request.success && request.success(data, metadata, xhr);
                request.complete && request.complete();
            } else
                writeToCache(request.success, request.complete);
        }
    });
}

/**
 * A backed cache for objects such as AtomPub XML documents, 
 * JavaScript files, and other resources such as images.
 * Resources are addressed by a URL.
 *
 * @namespace
 */
libx.cache.ObjectCache = libx.core.Class.create(

    /** @lends libx.cache.ObjectCache.prototype */ {
    initialize: function () {
        this.cachedRequests = new Array();
    },

    /**
     *  Get an object, based on its URL.
     *  Once retrieved, the object will be stored in the object cache.
     *
     *  @param {Object} request 
     *      Modeled after <a href="http://docs.jquery.com/Ajax/jQuery.ajax#options">jQuery._ajax</a>
     *      with the following additions:
     *  @config {String} alias  (optional) if set, the item will be stored in
     *      the cache under this alias URL instead of its actual URL
     *  @config {Boolean} cacheOnly  if true, success will only be called if the object
     *      is in the cache.  If the object is not in the cache, request.complete() is immediately
     *      fired.  No XHRs are triggered.
     *  @config {Boolean} ignoreQuery  if true, the get parameters for this
     *      request will not be used in the key for storing this item in the cache
     *  @config {Function(params)} validator  validator function used to prevent caching of captive portals.
     *      see {@link libx.cache.MemoryCache.validators} for examples.
     *  @config {Function(writeToCache)} delayWrite  callback function that is
     *      executed when the data would normally be written to cache.  this
     *      allows the caller to control when/if the data is written to the cache.
     *      accepts one argument, writeToCache, which is a function that writes
     *      the data to the cache.
     */
    get : function (request) {
    
        var self = this;
        var url = request.alias || request.url;

        // don't cache chrome URLs
        if (/^chrome.*:\/\//.test(url)) {
            libx.cache.defaultMemoryCache.get(request);
            return;
        }
    
        this.getMetadata({
            url: url,
            success: function (metadata) {

                function getFromCache() {
                    libx.storage.cacheStore.getItem({
                        key: trimQuery(request.ignoreQuery, url),
                        success: function (text) {

                            // all objects are stored as text, so we must parse
                            // them according to the specified dataType
                            var data;
                            switch (request.dataType) {
                            case 'json': data = libx.utils.json.parse(text); break;
                            case 'xml':  data = libx.utils.xml.loadXMLDocumentFromString(text); break;
                            default:     data = text;
                            }

                            request.success && request.success(data, metadata);
                            request.complete && request.complete();
                        },
                        notfound: function () {
                            retrieveRequest.call(self, request, RetrievalType.GET);
                        }
                    });
                }

                // if the object is marked as expired, update it.  if the update fails, or if
                // the object hasn't been modified, return the cached version.
                if (metadata.expired && !request.cacheOnly) {
                    var updated = false;
                    self.update({
                        url: request.url,
                        alias: request.alias,
                        metadata: metadata,
                        ignoreQuery: request.ignoreQuery,
                        validator: request.validator,
                        success: function (data, status, xhr) {
                            updated = true;
                            request.success && request.success(data, status, xhr);
                        },
                        error: getFromCache,
                        complete: function () {
                            if (updated) {
                                request.complete && request.complete();
                                return;
                            }
                            getFromCache();
                        }
                    });
                } else
                    getFromCache();

            },
            notfound: function () {
                if (request.cacheOnly)
                    request.complete && request.complete();
                else
                    retrieveRequest.call(self, request, RetrievalType.GET);
            }
        });
    },

    /**
     * Get metadata associated with a URL, or null if URL is not (or no longer!) cached
     * @config {String} url  the item to look up
     * @param {Object} paramObj  parameter object
     * @config {Boolean} ignoreQuery  whether the get query should be ignored
     *      when looking up this cached item
     * @config {Function(json)} success  callback function executed when the
     *      metadata has been found.  takes one argument, which is the JSON
     *      metadata.
     * @config {Function()} notfound  callback function executed if the URL was
     *      not found in the object cache
     */
    getMetadata : function (paramObj) {
        var url = trimQuery(paramObj.ignoreQuery, paramObj.url);
        libx.storage.metacacheStore.getItem({
            key: url,
            success: function(text) {
                paramObj.success && paramObj.success(libx.utils.json.parse(text));
            },
            notfound: paramObj.notfound,
        });
    },

    /**
     * Write metadata to storage.
     * @config {String} url  the item to look up
     * @param {Object} paramObj  parameter object
     * @config {Boolean} ignoreQuery  whether the get query should be ignored
     *      for the key of this cached item
     * @config {Function()} success  callback function executed when the
     *      metadata has been written
     */
    putMetadata : function (paramObj) {
        var url = trimQuery(paramObj.ignoreQuery, paramObj.url);
        libx.storage.metacacheStore.setItem({
            key: url,
            value: libx.utils.json.stringify(paramObj.metadata),
            success: paramObj.success
        });
    },

    /**
     * Remove all cached files.
     */
    purgeAll : function () {
        libx.storage.cacheStore.clear();
    },

    /**
     * Updates an item in the cache.
     * Accepts the same parameter object as {@link libx.cache.ObjectCache.get}.
     */
    update : function (request) {
        retrieveRequest.call(this, request, RetrievalType.UPDATE);
    }
        
});

libx.cache.defaultObjectCache = new libx.cache.ObjectCache();

}) ();
