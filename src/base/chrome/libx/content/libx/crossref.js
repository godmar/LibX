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
 * @namespace
 *
 * Support CrossRef Metadata Retrieval
 */
libx.services.crossref = {

    /**
     * Retrieve info about CrossRef ID.
     *
     * @param {String} invofcc.doi called with information
     * @param {Function} invofcc.ifFound(text, xml) called with information from CrossRef.
     *          text is a brief description.  xml is full XML response.
     * @param {Function} invofcc.notFound (optional) function to be called on failure.
     */
    getDOIMetadata: function (invofcc) {
        if (!libx.utils.browserprefs.getBoolPref ('libx.doi.ajaxpref', true))
            return;

        var crossrefNSResolver = { 'qr' : 'http://www.crossref.org/qrschema/2.0' };

        /* query is a XML document node at //query */
        function formatDOIMetadataAsText (query) {
            var text = '';
            function addIfPresent(before, attr, after) {
                var s = "";
                if (attr != null) {
                    s = before + libx.utils.xml.decodeEntities ( String(attr) );
                    if (after !== undefined)
                        s += after;
                }
                return s;
            }

            function get(xpath) {
                var node = libx.utils.xpath.findSingleXML(query.ownerDocument, xpath, query, crossrefNSResolver);
                return node ? node.nodeValue : null;
            }

            // create an ad-hoc reference format here.
            var atitle = get("./qr:article_title/text()");
            var vtitle = get("./qr:volume_title/text()");
            var stitle = get("./qr:series_title/text()");
            var jtitle = get("./qr:journal_title/text()");
            if (atitle) {
                text += addIfPresent('"', atitle, '",');
            }

            // schema says choice of author/contributors
            var author = get("./qr:author/text()");
            if (author == null) {
                var author = get("./qr:contributors/qr:contributor[@first-author = 'true']/qr:surname/text()");
                author += addIfPresent(", ", get("./qr:contributors/qr:contributor[@first-author = 'true']/qr:given_name/text()"));
            }
            text += addIfPresent(" ", author);

            text += addIfPresent("; ", vtitle);
            text += addIfPresent("; ", jtitle);
            text += addIfPresent("; ", stitle);
            text += addIfPresent(" ", get("./qr:volume/text()"));
            text += addIfPresent("(", get("./qr:issue/text()"), ")");
            text += addIfPresent(":", get("./qr:first_page/text()"), "-");
            text += addIfPresent(" (", get("./qr:year/text()"), ")");

            return text;
        }

        var requestUrlPath = "http://www.crossref.org/openurl/?url_ver=Z39.88-2004&req_dat=libx.org&multihit=true&rft_id=info:doi/" + encodeURIComponent(invofcc.doi);

        // xmlParam.error is not implemented since CrossRef returns 200 OK
        // even for DOI that are not known to it.
        var xmlParam = {
            dataType : "xml",
            type     : "POST",
            url      : requestUrlPath,

            success  : function (xmlhttp) {
                var querypath = "//qr:query[@status = 'resolved' and ./qr:doi/text() = '" + invofcc.doi + "']";

                var node = libx.utils.xpath.findSingleXML(xmlhttp, querypath, xmlhttp, crossrefNSResolver);
                if (node) {
                    invofcc.ifFound(formatDOIMetadataAsText(node), xmlhttp);
                } else {
                    if (invofcc.notFound)
                        invofcc.notFound(xmlhttp);
                }
            }
        }

        //Send the request
        libx.cache.globalMemoryCache.get(xmlParam);
    },

    /** @private */
    unittests: function (out) {
        var dois = [ "10.1145/268998.266642", "10.1038/nature00967", "10.1145/1075382.1075383" ];

        for (var i = 0; i < dois.length; i++) {
            this.getDOIMetadata({
                doi: dois[i],
                ifFound: function (text) {
                    out.write(this.doi + " -> " + text + "\n");
                }
            });
        }
    }
};

if (libx.utils.browserprefs.getBoolPref ('libx.run.unittests', false))
    libx.services.crossref.unittests(libx.log);

// vim: ts=4
