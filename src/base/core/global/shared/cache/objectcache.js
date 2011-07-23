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

function parseText(params) {
    try {
        var data;
        switch (params.type) {
            case 'xml': data = libx.utils.xml.loadXMLDocumentFromString(params.text); break;
            case 'json': data = libx.utils.json.parse(params.text); break;
            default: data = params.text;
        }
        params.success && params.success(data);
    } catch (e) {
        libx.log.write(e);
        params.error && params.error('parsererror');
    }
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

    if (retrievalType == RetrievalType.UPDATE && request.metadata && request.metadata.lastModified != null)
        headers["If-Modified-Since"] = request.metadata.lastModified;

    // For 304 responses, FF throws "No element found" errors; overriding the MIME
    // type fixes this
    var mimeType = "text/plain";
    
    var isImage = /\.(jpg|jpeg|tiff|gif|ico|bmp|png|webp)$/i.test(request.url);

    // for images, we must use the raw data, which we get by setting this mime type
    if (isImage && !request.serverMIMEType)
        mimeType = "text/plain; charset=x-user-defined";
        
    var url = trimQuery(request.ignoreQuery, request.url);

    libx.cache.defaultMemoryCache.get({
        dataType: 'text',
        header: headers,
        url: request.url,
        serverMIMEType: request.serverMIMEType || mimeType,
        bypassCache: true,
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
        success: function (text, status, xhr) {

            var contentType = xhr.getResponseHeader("Content-Type");
    
            isImage && (text = libx.utils.binary.binary2Base64(text));

            var metadata = {
                lastAccessed: Date.now(),
                lastModified: xhr.getResponseHeader('Last-Modified'),
                mimeType: contentType,
                sha1: libx.utils.hash.hashString(text),
                expired: false
            };

            isImage && (text = 'data:' + contentType + ';base64,' + text);

            parseText({
                text: text,
                type: request.dataType,
                success: function (data) {
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
                    if (request.validator) {
                        request.validator({
                            url: url,
                            metadata: metadata,
                            data: data,
                            success: function () {
                                // BRN: document this
                                if (request.delayWrite) {
                                    request.delayWrite(writeToCache);
                                    request.success && request.success(data, metadata, xhr);
                                    request.complete && request.complete();
                                } else
                                    writeToCache(request.success, request.complete);
                            },
                            error: function () {
                                // if the data is not valid, do not write to cache
                                request.error && request.error('failedvalidation');
                                request.complete && request.complete();
                            }
                        });
                    } else {
                        libx.log.write('warning: ' + url + ' added to object cache with no validation function');
                        writeToCache(request.success, request.complete);
                    }
                },
                error: function (err) {
                    request.error && request.error(err);
                    request.complete && request.complete();
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
     *  @param {Function} validator: function to validate the object's data and
     *      metadata before it is stored in the cache
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
                            parseText({
                                text: text,
                                type: request.dataType,
                                success: function (data) {
                                    request.success && request.success(data, metadata);
                                },
                                error: request.error
                            });
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

/**
 * Set of functions used to validate response data before storing in the cache.
 * This is necessary to detect the fake responses returned by captive portals
 * (such as web authentication login screens).
 */
libx.cache.defaultObjectCache.validators = {
    config: function (params) {
        if (/xml/.test(params.metadata.mimeType)
                && libx.utils.xpath.findSingleXML(params.data, '//edition/name'))
            params.success();
        else
            params.error();
    },
    bootstrapped: function (params) {
        function doValidation(updates) {
            libx.cache.defaultObjectCache.validators.bootstrapped.updates = updates;
            var bootstrapPath = libx.locale.getBootstrapURL('');
            var relPath = params.url.replace(bootstrapPath, '');
            if (updates.files && updates.files[relPath]
                    && updates.files[relPath].hash == params.metadata.sha1)
                params.success();
            else
                params.error();
        }

        // keep the updates object in memory so we don't need to fire an XHR for
        // each bootstrapped item to be validated.  this will also be updated in 
        // the scheduler when updates.json has changed.
        var updates = libx.cache.defaultObjectCache.validators.bootstrapped.updates;

        if (updates)
            doValidation(updates);
        else {
            // writing updates.json to the object cache here would incorrectly
            // indicate that all of its children have been successfully fetched
            // (since updates.json is the root), so use the memory cache instead
            libx.cache.defaultMemoryCache.get({
                url: libx.locale.getBootstrapURL('updates.json'),
                dataType: 'json',
                success: doValidation,
                error: function (status) {
                    libx.log.write('error ' + status + ' when fetching updates.json');
                    params.error();
                }
            });
        }
    },
    feed: function (params) {
        if (/xml/.test(params.metadata.mimeType) && libx.utils.xpath.findSingleXML(params.data,
                '//libx:package|//libx:libapp|//libx:module', null, { libx: 'http://libx.org/xml/libx2' } ))
            params.success();
        else
            params.error();
    },
    preference: function (params) {
        if (/xml/.test(params.metadata.mimeType)
                && libx.utils.xpath.findSingleXML(params.data, '//item|//preference|//category'))
            params.success();
        else
            params.error();
    },
    image: function (params) {
        if (/image/.test(params.metadata.mimeType))
            params.success();
        else
            params.error();
    }

};

}) ();
