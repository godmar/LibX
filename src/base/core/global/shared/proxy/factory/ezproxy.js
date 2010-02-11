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

/**
 *	EZProxy implementation of a proxy	
 *	@name libx.proxy.factory.ezproxy
 *	@constructor
 */
libx.proxy.factory["ezproxy"] = libx.core.Class.create(
/**@lends libx.proxy.factory.ezproxy.prototype */
{
    /**
     * Can this proxy check whether a URL could be proxied
     * @return true if urlcheckpassword is configured
     */
    canCheck: function () { 
        // TBD: we should check the user's preference here as well.
        return this.urlcheckpassword != null; 
    },

    /**
     * Check if a given URL could be proxied.
     *
     * See http://blog.ryaneby.com/archives/ezproxy-url-webservice/
     *
     * @param {Object} opt  Object describing requested check, must contain:
     * <pre>
     *          .url - URL to be checked
     *          .onsuccess - method to be called if URL can be proxied
     *          .onfailure - method to be called if URL cannot be proxied or 
     *                       if result couldn't be obtained.
     * </pre>
     */
    checkURL: function (opt) {
        var m = this.url.match(/(https?:\/\/[^\/]+)\/(.*)$/);
        if (!m) {
            libx.log.write("internal failure parsing proxy url: " + this.url + "...");
            opt.onsuccess();
            return;
        }

        /* Chris Zagar points out that ezproxy logs all requests, but no POST data,
         * so posting the URL to be queried reduces log size and slightly increases
         * privacy.
         */
        var purl = m[1] + "/proxy_url";
        var postdata = "xml=" + encodeURIComponent('<?xml version="1.0"?>' 
                + '<proxy_url_request password="' + this.urlcheckpassword + '"><urls>'
                + '<url>' + opt.url + '</url>'
                + '</urls></proxy_url_request>'
            );
        var xhrParams = {
            url         : purl,
            dataType    : "xml",
            type        : "POST",
            data        : postdata,
            bypassCache : true,
            success     : function (xmlhttp) {
                var resp = libx.utils.xpath.findSingleXML(xmlhttp, 
                                                       "/proxy_url_response/proxy_urls/url[1]");
                    if (resp != null && libx.utils.types.normalize(resp.getAttribute("proxy"))) {
                        opt.onsuccess();
                        return;
                    }
                    opt.onfailure();
                }
        };
        libx.cache.defaultMemoryCache.get(xhrParams);
    },

    /**
     * Should the option to proxy a URL be disabled if checkURL fails?
     * suggested by Matthias Liffers.
     *
     * @return true if edition maintainer configured disableifcheckfails
     */
    disableIfCheckFails: function() {
        return this.disableifcheckfails == true;
    },

    /**
     * Rewrite a URL to access it via this proxy.
     * @param {String} url URL to be proxied
     */
    rewriteURL: function (url) {
        /* Rewriting URLs for EZProxy is eazy. */
        return this.url.replace(/%S/, url);
    }
});