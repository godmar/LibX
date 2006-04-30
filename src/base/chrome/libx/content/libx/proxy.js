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

function libxEZProxy() {
}

libxEZProxy.prototype = {
    /* Rewriting URLs for EZProxy is eazy. */
    rewriteURL: function (url) {
        return this.url.replace(/%S/, url);
    }
}

function libxWAMProxy() {
}

libxWAMProxy.prototype = {
    /* From the III documentation:

      http://<port>-<target server>.<Innovative server>/<rest of URL>
      <port> The port number of the resource. 
             If the port number is 80, substitute 0 (zero) for the port number.
      <target server> The address for the target resource.
      <Innovative server> The address of your Innovative server.
      <rest of URL> The rest of the URL for the target resource.

          http://search.epnet.com:5670/a/acp/name/db/bgmi/search
          http://5670-search.epnet.com.my.lib.edu/a/acp/name/db/bgmi/search
    */
    rewriteURL: function (url) {
        var proxybase = this.url;
        var m = url.match(/http:\/\/([^\/:]+)(:(\d+))?\/(.*)$/);
        if (m) {
            m[0];
            var host = m[1];
            var port = m[3];
            if (port === undefined || port == 80) port = 0;
            var path = m[4];
            var newurl = "http://" + port + "-" + host + "." + proxybase + "/" + path;
            return newurl;
        }
        return url;
    }
}

// vim: ts=4
