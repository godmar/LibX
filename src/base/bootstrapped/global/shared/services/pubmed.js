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
        function extractPubmedMetadata(docsum) {
            function get(xpath, s) {
                var node = libx.utils.xpath.findSingleXML(docsum.ownerDocument, xpath, s || docsum);
                return node ? node.nodeValue : null;
            }

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

            addIfPresent('atitle', get("./Item[@Name = 'Title']/text()"));
            addIfPresent('author', get("./Item[@Name = 'AuthorList']/Item[position() = 1 and @Name = 'Author']/text()"));
            /*
            if (get("./Item[@Name = 'AuthorList']/Item[position() = 2 and @Name = 'Author']/text()"))
                text += " et al.";
            */
            addIfPresent('jtitle', get("./Item[@Name = 'FullJournalName']/text()"));
            addIfPresent('volume', get("./Item[@Name = 'Volume']/text()"));
            addIfPresent('issue', get("./Item[@Name = 'Issue']/text()"));
            addIfPresent('pages', get("./Item[@Name = 'Pages']/text()"));
            addIfPresent('year', get("./Item[@Name = 'PubDate']/text()"));
            m.genre = 'article';

            if ('pages' in m) {
                try {
                    m.spage = m.pages.split(/-/)[0];
                    m.epage = m.pages.split(/-/)[1];
                    var s = Number(m.spage);
                    var e = Number(m.epage);
                    // 1323-7 means 1323 to 1327
                    if (s > e) {
                        m.epage = m.spage.substring(0, m.spage.length - m.epage.length) + m.epage;
                    }
                } catch (er) { }
            }

            addIfPresent('so', get("./Item[@Name = 'SO']/text()"));
            return m;
        }

        /* docsum is a XML document node at /eSummaryResult/DocSum */
        function formatPubmedMetadataAsText(metadata, docsum) {
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

            text += addIfPresent('"', 'atitle', '"');
            text += addIfPresent(', ', 'author');
            text += addIfPresent(', ', 'jtitle');
            text += addIfPresent(', ', 'so');
            /*
            if (get("./Item[@Name = 'AuthorList']/Item[position() = 2 and @Name = 'Author']/text()"))
                text += " et al.";
            */
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
                var xmlResponse = libx.utils.xml.loadXMLDocumentFromString(responsetext);
                var docsumxpath = '/eSummaryResult/DocSum[./Id/text() = ' + invofcc.pubmedid + ']';
                var node = libx.utils.xpath.findSingleXML(
                        xmlResponse, docsumxpath, xmlResponse);

                if (node) {
                    var metadata = extractPubmedMetadata(node);
                    invofcc.ifFound(formatPubmedMetadataAsText(metadata, node), metadata, xmlResponse);
                } else {
                    if (invofcc.notFound) {
                        invofcc.notFound(responsetext);
                    }
                }
            }
        }

        //Send the request
        libx.cache.defaultMemoryCache.get(xmlParam);
    },

    /** @private */
    unittests: function (out) {
        var pmids = ["12541934", "1234432", "22592717", "12344321", "16646082"];

        for (var i = 0; i < pmids.length; i++) {
            this.getPubmedMetadata({
                pubmedid: pmids[i],
                ifFound: function (text, metadata) {
                    out.write(this.pubmedid + " -> " + text + "\n");
                    out.write(this.pubmedid + " -> " + libx.utils.json.stringify(metadata) + "\n");
                }
            });
        }
    }
};

if (libx.utils.browserprefs.getBoolPref ('libx.run.unittests', false))
    libx.services.pubmed.unittests(libx.log);

// vim: ts=4

