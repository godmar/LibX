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
 * Support for proxies.  Currently, LibX support EZProxy and III's WAM
 *
 * @namespace
 */
libx.proxy = {
    /**
     *	Factory used to instantiate the various proxy types
     *	@namespace
     *	@example
     *		var ezproxy = new libx.proxy.factory["ezproxy"] ()
     */
    factory : { }
};

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
            libxEnv.writeLog("internal failure parsing proxy url: " + this.url + "...");
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
                var resp = libxEnv.xpath.findSingleXML(xmlhttp, 
                                                       "/proxy_url_response/proxy_urls/url[1]");
                    if (resp != null && libxNormalizeOption(resp.getAttribute("proxy"))) {
                        opt.onsuccess();
                        return;
                    }
                    opt.onfailure();
                }
        };
        libx.cache.memorycache.getRequest(xhrParams);
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

/**
 *	WAM implementation of a proxy	
 *	@name libx.proxy.factory.wam
 *	@constructor
 */
libx.proxy.factory["wam"] = libx.core.Class.create(
/**@lends libx.proxy.factory.wam.prototype */
{
    /**
     * Check if this URL could be proxied.
     * WAM does not support checking whether the site would be proxied as of now. 
     * @return false
     */
    canCheck: function () { return false; },

    /**
     * Rewrite a URL to access it via this proxy.
     *
     * @param {String} url URL to be proxied
     *
     *From the III documentation:
     *<pre>
     *http://<port>-<target server>.<Innovative server>/<rest of URL>
     *<port> The port number of the resource. 
     *       If the port number is 80, substitute 0 (zero) for the port number.
     *<target server> The address for the target resource.
     *<Innovative server> The address of your Innovative server.
     *<rest of URL> The rest of the URL for the target resource.
     *
     *    http://search.epnet.com:5670/a/acp/name/db/bgmi/search
     *    http://5670-search.epnet.com.my.lib.edu/a/acp/name/db/bgmi/search
     *</pre>
     */
    rewriteURL: function (url) {
        var proxybase = this.url;
        var m = url.match(/http:\/\/([^\/:]+)(:(\d+))?\/(.*)$/);
        if (m) {
            var host = m[1];
            var port = m[3];
            // missing port maps to undefined in FF, empty string "" in IE
            if (port === undefined || port == "" || port == 80) port = 0;
            var path = m[4];
            var newurl = "http://" + port + "-" + host + "." + proxybase + "/" + path;
            return newurl;
        }
        return url;
    }
});

// vim: ts=4


