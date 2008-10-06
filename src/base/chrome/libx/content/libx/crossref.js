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

/*
 * Support CrossRef Metadata Retrieval
 *
 * Tested in FF
 * Intended to be IE-compatible
 */
libxEnv.crossref = {
    /* cache retrieved meta data to reduce load on service; 
     * maps DOI to DOM Node '//query' in results.
     * Caches both successes and failures.
     */
    doi2metadata: new Object(),

    /* query is a XML document node at //query */
    formatDOIMetadataAsText: function (query, oncompletionobj, oncompletionfunc) {
        var text = '';
        function addIfPresent(before, attr, after) {
            var s = "";
            if (attr != null) {
                s = before + attr.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
                if (after !== undefined)
                    s += after;
            }
            return s;
        }

        function get(xpath) {
            var node = libxEnv.xpath.findSingleXML(query.ownerDocument, xpath, query, { 'qr' : 'http://www.crossref.org/qrschema/2.0' });
                    
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

        oncompletionobj[oncompletionfunc](text);
    },

    /* retrieve info about DOI - either from cache or from service, and 
       call formatFunc(result, completion_func) */
    getDOIMetadataAsText: function (doi, completionhandlers) {
        if (!libxEnv.getBoolPref ('libx.doi.ajaxpref', 'true'))
            return;

        var cached = this.doi2metadata[doi];
        if (cached !== undefined) {
            if (cached != null) {
                this.formatDOIMetadataAsText(cached, completionhandlers, 'ifFound');
            } else {
                if (completionhandlers.notFound)
                    completionhandlers.notFound();
            }
            return;
        }

        var doi2metadata = this.doi2metadata;

        // see for example 
        // http://www.crossref.org/openurl/?url_ver=Z39.88-2004&req_dat=libx.org&multihit=true&rft_id=info:doi/10.1145/268998.266642
        // http://www.crossref.org/openurl/?url_ver=Z39.88-2004&req_dat=libx.org&multihit=true&rft_id=info:doi/10.1038/nature00967
        var requestUrlPath = "http://www.crossref.org/openurl/?url_ver=Z39.88-2004&req_dat=libx.org&multihit=true&rft_id=info:doi/" + encodeURIComponent(doi);

        libxEnv.getXMLDocument(requestUrlPath,
            function (xmlhttp) {
                var xmlResponse = xmlhttp.responseXML;
                var querypath = "//qr:query[@status = 'resolved' and ./qr:doi/text() = '" + doi + "']";

                var node = libxEnv.xpath.findSingleXML(xmlResponse, querypath, xmlResponse, { 'qr' : 'http://www.crossref.org/qrschema/2.0' });
                // cache result (even if Crossref DOI was not found)
                doi2metadata[doi] = node;
                if (node) {
                    libxEnv.crossref.formatDOIMetadataAsText(node, completionhandlers, 'ifFound');
                } else {
                    if (completionhandlers.notFound)
                        completionhandlers.notFound();
                }
            });
    }
};


// vim: ts=4
