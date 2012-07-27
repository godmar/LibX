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

        function extractDOIMetadata (query) {
            // println(libx.utils.xml.convertXMLDocumentToString(query));

            var m = {}
            function addIfPresent(key, attr, sep) {
                if (attr != null) {
                    var content = libx.utils.xml.decodeEntities ( String(attr) );
                    if (key in m)
                        m[key] += (sep || "") + content;
                    else
                        m[key] = content;
                }
            }

            function get(xpath, s) {
                var node = libx.utils.xpath.findSingleXML(query.ownerDocument, xpath, s || query);
                return node ? node.nodeValue : null;
            }
            function getList(xpath) {
                return libx.utils.xpath.findNodesXML(query.ownerDocument, xpath, query);
            }
            function getAttr(xpath, attr) {
                var node = libx.utils.xpath.findSingleXML(query.ownerDocument, xpath, query);
                return node ? node.getAttribute(attr) : null;
            }

            addIfPresent('atitle', get("./conference/conference_paper/titles/title/text()"));
            addIfPresent('atitle', get("./conference/conference_paper/titles/subtitle/text()"), " ");
            addIfPresent('jtitle', get("./journal/journal_metadata/full_title/text()"));
            addIfPresent('issn', get("./journal/journal_metadata/issn/text()"));
            addIfPresent('isbn', get("./conference/proceedings_metadata/isbn/text()"));
            addIfPresent('ptitle', get("./conference/proceedings_metadata/proceedings_title/text()"));
            addIfPresent('publisher', get("./conference/proceedings_metadata/publisher/publisher_name/text()"));
            addIfPresent('volume', get("./journal/journal_issue/journal_volume/volume/text()"));
            addIfPresent('issue', get("./journal/journal_issue/issue/text()"));
            addIfPresent('atitle', get("./journal/journal_article/titles/title/text()"));
            addIfPresent('atitle', get("./journal/journal_article/titles/subtitle/text()"), " ");
            addIfPresent('spage', get("./journal/journal_article/pages/first_page/text()"), " ");
            addIfPresent('epage', get("./journal/journal_article/pages/last_page/text()"), " ");
            addIfPresent('year', get("./journal/journal_article/publication_date/year/text()"), " ");
            addIfPresent('url', get("./journal/journal_article/doi_data/resource/text()"), " ");
            if (get("./journal") || get("./conference"))
                m.genre = 'article';

            var con = getList("./conference/conference_paper/contributors");
            if (con == null)
                con = getList("./journal/journal_article/contributors");
            if (con != null) {
                for (var i = 0; i < con.length; i++) {
                    var ci = con[i];
                    addIfPresent('author', get("./person_name[@sequence='first']/given_name/text()", ci));
                    addIfPresent('author', get("./person_name[@sequence='first']/surname/text()", ci), " ");
                }
            }
            /* XXX add more authors etc. here. */
            return m;
        }

        /* query is a XML document node at //query */
        function formatDOIMetadataAsText (metadata, query) {
            var text = '';
            function addIfPresent(before, attr, after) {
                var s = "";
                if (metadata[attr] != null) {
                    s = before + metadata[attr];
                    if (after !== undefined)
                        s += after;
                }
                return s;
            }

            // create an ad-hoc reference format here.
            // XXX since some may be absent, use of a separator
            // should really depend on presence of previous element.
            // (write a small custom formatting engine?)
            text += addIfPresent('"', 'atitle', '",');

            // schema says choice of author/contributors
            /*
            var author = get("./qr:author/text()");
            if (author == null) {
                var author = get("./qr:contributors/qr:contributor[@first-author = 'true']/qr:surname/text()");
                author += addIfPresent(", ", get("./qr:contributors/qr:contributor[@first-author = 'true']/qr:given_name/text()"));
            }
            */
            text += addIfPresent(" ", 'author');

            text += addIfPresent("; ", 'vtitle');
            text += addIfPresent("; ", 'jtitle');
            text += addIfPresent("; ", 'stitle');
            text += addIfPresent(" ", 'volume');
            text += addIfPresent("(", 'issue', ")");
            text += addIfPresent(":", 'spage', "-");
            text += addIfPresent("", 'epage');
            text += addIfPresent(" (", "year", ")");

            return text;
        }

        // format-unixref gives full metadata rather than short metadata, but uses a completely different response format
        var requestUrlPath = "http://www.crossref.org/openurl/?url_ver=Z39.88-2004&req_dat=libx.org&multihit=true&format=unixref&rft_id=info:doi/" + encodeURIComponent(invofcc.doi);

        // xmlParam.error is not implemented since CrossRef returns 200 OK
        // even for DOI that are not known to it.
        var xmlParam = {
            dataType : "xml",
            type     : "POST",
            url      : requestUrlPath,

            success  : function (xmlhttp) {
                var querypath = "/doi_records/doi_record/crossref[.//doi_data/doi/text() = '" + invofcc.doi + "']";

                var node = libx.utils.xpath.findSingleXML(xmlhttp, querypath, xmlhttp);
                if (node) {
                    var metadata = extractDOIMetadata(node);
                    invofcc.ifFound(formatDOIMetadataAsText(metadata, node), metadata, xmlhttp);
                } else {
                    if (invofcc.notFound)
                        invofcc.notFound(xmlhttp);
                }
            }
        }

        //Send the request
        libx.cache.defaultMemoryCache.get(xmlParam);
    },

    /** @private */
    unittests: function (out) {
        var dois = [ "10.1145/268998.266642", "10.1038/nature00967", "10.1145/1075382.1075383", "10.1126/science.1157784", "10.1145/1047915.1047919" ];

        for (var i = 0; i < dois.length; i++) {
            this.getDOIMetadata({
                doi: dois[i],
                ifFound: function (text, metadata) {
                    out.write(this.doi + " -> " + text + "\n");
                    out.write(this.doi + " -> " + libx.utils.json.stringify(metadata) + "\n");
                }
            });
        }
    }
};

if (libx.utils.browserprefs.getBoolPref ('libx.run.unittests', false))
    libx.services.crossref.unittests(libx.log);

// vim: ts=4
