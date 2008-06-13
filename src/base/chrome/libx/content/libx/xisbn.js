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
 * Initial draft of better xISBN support
 *
 * Tested in FF
 * Intended to be IE-compatible
 */
libxEnv.xisbn = {
    /* cache retrieved meta data to reduce load on xISBN service; 
     * maps ISBN to DOM Node '/rsp/isbn' in results.
     * Caches both successes and failures.
     */
    isbn2metadata: new Object(),

    /* xisbnrsp is a XML document node returned by xisbn.worldcat.org */
    formatISBNMetadataAsText: function (xisbnrspisbn, oncompletionobj, oncompletionfunc) {
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
        // has: lccn form year lang ed title author publisher city
        text += addIfPresent('"', xisbnrspisbn.getAttribute('title'), '"');
        text += addIfPresent(" ", xisbnrspisbn.getAttribute('author'));
        text += addIfPresent(", ", xisbnrspisbn.getAttribute('year'));
        text += addIfPresent(", ", xisbnrspisbn.getAttribute('publisher'));
        text += addIfPresent(", ", xisbnrspisbn.getAttribute('city'));
        oncompletionobj[oncompletionfunc](text);
    },

    // see http://xissn.worldcat.org/xissnadmin/doc/api.htm
    //
    // * title: Title
    // * publisher: Publisher
    // * rawcoverage: Human-readable Coverage
    // * peerreview: Peerreview, 'Y' if the ISSN is peer-reviewed, 
    //                           'N' if the ISSN is not peer-reviewed.
    // * form: Each ISSN has a production form, indicated by an ONIX production form code. 
    // Current supported values include: JB ( Printed serial ), 
    // JC ( Serial distributed electronically by carrier ),
    // JD ( Electronic serial distributed online ), 
    // MA ( Microform )
    //
    /* xissnrsp is a XML document node returned by xisbn.worldcat.org */
    formatISSNMetadataAsText: function (xissnrsp, oncompletionobj, oncompletionfunc) {
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

        text += addIfPresent('"', xissnrsp.getAttribute('title'), '"');
        text += addIfPresent(", ", xissnrsp.getAttribute('publisher'));
        text += addIfPresent(" ", 
            xissnrsp.getAttribute('peerreview') == 'Y' ? "(peer-reviewed)" : "(non-peer-reviewed)");
        switch (xissnrsp.getAttribute('form')) {
        case "JB": 
            var form = "Printed serial"; break;
        case "JC": 
            var form = "Serial distributed electronically by carrier"; break;
        case "JD": 
            var form = "Electronic serial distributed online"; break;
        case "MA": 
            var form = "Microform"; break;
        }
        text += addIfPresent(", ", form);
        oncompletionobj[oncompletionfunc](text);
    },

    /* retrieve info about ISBN from xISBN and format as text */
    getISBNMetadataAsText: function (isbn, completionhandlers) {
        this.process(isbn, 
                    "http://xisbn.worldcat.org/webservices/xid/isbn/" 
                        + isbn + "?method=getMetadata&format=xml&fl=*",
                    "//xisbn:rsp[@stat='ok']/xisbn:isbn", 
                    "http://worldcat.org/xid/isbn/",
                    this.formatISBNMetadataAsText, completionhandlers);
    },

    /* retrieve info about ISSN from xISSN and format as text */
    // NB: libx.org is the LibX affiliate account; these are limited to 100 requests a day.
    // either arrange for unlimited use with OCLC or ask that edition maintainers
    // enter an affiliate id via edition builder
    getISSNMetadataAsText: function (issn, completionhandlers) {
        this.process(issn, 
                    "http://xissn.worldcat.org/webservices/xid/issn/" 
                        + issn + "?method=getMetadata&format=xml&fl=*&ai=libx.org",
                    "//xissn:rsp[@stat='ok']//xissn:issn", 
                    "http://worldcat.org/xid/issn/",
                    this.formatISSNMetadataAsText, completionhandlers);
    },

    /* retrieve info about ISBN or ISSN from xISBN - either from cache or from service, and 
       call formatFunc(result, completion_func) */
    process: function (isbn, requestUrlPath, xpathResponseOk, xmlnsResponse, formatFunc, completionhandlers) {
        if (!libxEnv.getBoolPref ('libx.oclc.ajaxpref', 'true'))
            return;

        var cached = this.isbn2metadata[isbn];
        if (cached !== undefined) {
            if (cached != null) {
                formatFunc(cached, completionhandlers, 'ifFound');
            } else {
                if (completionhandlers.notFound)
                    completionhandlers.notFound();
            }
            return;
        }

        var isbn2metadata = this.isbn2metadata;

        // see http://xisbn.worldcat.org/xisbnadmin/doc/api.htm#getmetadata
        libxEnv.getXMLDocument(requestUrlPath,
            function (xmlhttp) {
                var node = libxEnv.xpath.findSingle(
                        xmlhttp.responseXML, 
                        xpathResponseOk,
                        xmlhttp.responseXML, 
                        function (prefix) {
                            // specify namespace for XPath
                            return xmlnsResponse;
                        });

                // cache result (even if ISBN was not found)
                isbn2metadata[isbn] = node;
                if (node) {
                    formatFunc(node, completionhandlers, 'ifFound');
                } else {
                    if (completionhandlers.notFound)
                        completionhandlers.notFound();
                }
            });
    }
};


// vim: ts=4
