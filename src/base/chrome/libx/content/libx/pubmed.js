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
 * Support PubMed Metadata Retrieval
 */
libx.services.pubmed = {

    /**
     * Retrieve info about Pubmed ID.
     *
     * @param {String} invofcc.pubmedid called with information
     * @param {Function} invofcc.ifFound(text, xml) called with information from NCBI.
     *          text is a brief description.  xml is full XML response.
     * @param {Function} invofcc.notFound (optional) function to be called on failure.
     */
    getPubmedMetadata: function (invofcc) {
        /* docsum is a XML document node at /eSummaryResult/DocSum */
        function formatPubmedMetadataAsText(docsum) {
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
                var node = libx.bd.xpath.findSingleXML(docsum.ownerDocument, xpath, docsum);
                return node ? node.nodeValue : null;
            }

            text += addIfPresent('"', get("./Item[@Name = 'Title']/text()"), '"');
            text += addIfPresent(', ', get("./Item[@Name = 'AuthorList']/Item[position() = 1 and @Name = 'Author']/text()"));
            if (get("./Item[@Name = 'AuthorList']/Item[position() = 2 and @Name = 'Author']/text()"))
                text += " et al.";
            text += addIfPresent(', ', get("./Item[@Name = 'FullJournalName']/text()"));
            text += addIfPresent(', ', get("./Item[@Name = 'SO']/text()"));
            return text;
        }

        if (!libx.utils.browserprefs.getBoolPref ('libx.pmid.ajaxpref', true))
            return;

        // xmlParam.error is not implemented since NCBI always returns 200 OK
        var xmlParam = {
            dataType : "text",
            type     : "POST",
            // see for example http://www.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=xml&id=16646082
            url      : "http://www.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=xml&id=" + invofcc.pubmedid,

            // NCBI returns a content type text/html
            success  : function (responsetext) {
                var xmlResponse = libx.bd.utils.loadXMLDocumentFromString(responsetext);
                var docsumxpath = '/eSummaryResult/DocSum[./Id/text() = ' + invofcc.pubmedid + ']';
                var node = libx.bd.xpath.findSingleXML(
                        xmlResponse, docsumxpath, xmlResponse);

                if (node) {
                    invofcc.ifFound(formatPubmedMetadataAsText(node), xmlResponse);
                } else {
                    if (invofcc.notFound) {
                        invofcc.notFound(responsetext);
                    }
                }
            }
        }

        //Send the request
        libx.cache.globalMemoryCache.get(xmlParam);
    },

    /** @private */
    unittests: function (out) {
        this.getPubmedMetadata({
            pubmedid: "16646082",
            ifFound: function (text) {
                out.write(this.pubmedid + " -> " + text);
            }
        });
    }
};

if (libx.utils.browserprefs.getBoolPref ('libx.run.unittests', false))
    libx.services.pubmed.unittests(libx.log);

// vim: ts=4

