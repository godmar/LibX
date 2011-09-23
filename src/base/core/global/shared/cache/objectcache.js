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

    var url = trimQuery(request.ignoreQuery, request.url);

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
                lastAccessed: Date.now(),
                lastModified: xhr.getResponseHeader('Last-Modified'),
                mimeType: contentType,
                sha1: libx.utils.hash.hashString(text),
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
            // BRN: document this
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
        this.cachedRequests = new Array();
    },

    /**
     *  Get an object, based on its URL.
     *  @param {Options} request 
     *      Modeled after <a href="http://docs.jquery.com/Ajax/jQuery.ajax#options">jQuery._ajax</a>
     *      with the following additions:
     *  @param {Boolean} request.cacheOnly: if true, success will only be called if the object
     *      is in the cache.  If the object is not in the cache, request.complete() is immediately
     *      fired.  No XHRs are triggered.
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
            success: function (metadata) {

                function getFromCache() {
                    libx.storage.cacheStore.getItem({
                        key: trimQuery(request.ignoreQuery, request.url),
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

    /*
     * Get metadata associated with a URL, or null if URL is not (or no longer!) cached
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

    /*
     * Write metadata to storage
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
     * Remove all cached files
     */
    purgeAll : function () {
        libx.storage.cacheStore.clear();
    },

    update : function (request) {
        retrieveRequest.call(this, request, RetrievalType.UPDATE);
    }
        
});

libx.cache.defaultObjectCache = new libx.cache.ObjectCache();

}) ();
