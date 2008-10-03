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
 * Support PubMed Metadata Retrieval
 *
 * Tested in FF
 * Intended to be IE-compatible
 */
libxEnv.pubmed = {
    /* cache retrieved meta data to reduce load on service; 
     * maps Pubmed Id to DOM Node '/eSummaryResult/DocSum' in results.
     * Caches both successes and failures.
     */
    pubmedid2metadata: new Object(),

    /* docsum is a XML document node at /eSummaryResult/DocSum */
    formatPubmedMetadataAsText: function (docsum, oncompletionobj, oncompletionfunc) {
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
            var node = libxEnv.xpath.findSingleXML(docsum.ownerDocument, xpath, docsum);
            return node ? node.nodeValue : null;
        }

        text += addIfPresent('"', get("./Item[@Name = 'Title']/text()"), '"');
        text += addIfPresent(', ', get("./Item[@Name = 'AuthorList']/Item[position() = 1 and @Name = 'Author']/text()"));
        if (get("./Item[@Name = 'AuthorList']/Item[position() = 2 and @Name = 'Author']/text()"))
            text += " et al.";
        text += addIfPresent(', ', get("./Item[@Name = 'FullJournalName']/text()"));
        text += addIfPresent(', ', get("./Item[@Name = 'SO']/text()"));
        oncompletionobj[oncompletionfunc](text);
    },

    /* retrieve info about Pubmed ID - either from cache or from service, and 
       call formatFunc(result, completion_func) */
    getPubmedMetadataAsText: function (pubmedid, completionhandlers) {
        if (!libxEnv.getBoolPref ('libx.pmid.ajaxpref', 'true'))
            return;

        var cached = this.pubmedid2metadata[pubmedid];
        if (cached !== undefined) {
            if (cached != null) {
                this.formatPubmedMetadataAsText(cached, completionhandlers, 'ifFound');
            } else {
                if (completionhandlers.notFound)
                    completionhandlers.notFound();
            }
            return;
        }

        var pubmedid2metadata = this.pubmedid2metadata;

        // see for example http://www.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=xml&id=16646082
        var requestUrlPath = "http://www.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=xml&id=" + pubmedid;
        // NCBI returns a content type text/html
        libxEnv.getDocument(requestUrlPath,
            function (responsetext) {
                var xmlResponse = libxEnv.loadXMLString(responsetext);
                var docsumxpath = '/eSummaryResult/DocSum[./Id/text() = ' + pubmedid + ']';
                var node = libxEnv.xpath.findSingleXML(
                        xmlResponse, docsumxpath, xmlResponse);

                // cache result (even if Pubmed ID was not found)
                pubmedid2metadata[pubmedid] = node;
                if (node) {
                    libxEnv.pubmed.formatPubmedMetadataAsText(node, completionhandlers, 'ifFound');
                } else {
                    if (completionhandlers.notFound)
                        completionhandlers.notFound();
                }
            });
    }
};


// vim: ts=4
