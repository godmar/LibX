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
    formatISBNMetadataAsText: function (xisbnrspisbn, oncompletion_func) {
        var text = '';
        function addIfPresent(before, attr, after) {
            var s = "";
            if (attr != null) {
                s = before + attr;
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
        oncompletion_func(text);
    },

    /* retrieve info about ISBN from xISBN and format as text */
    getISBNMetadataAsText: function (isbn, completionhandlers) {
        this.doWithXIsbn(isbn, this.formatISBNMetadataAsText, completionhandlers);
    },

    /* retrieve info about ISBN from xISBN - either from cache or from xisbn, and 
       call formatFunc(result, completion_func) */
    doWithXIsbn: function (isbn, formatFunc, completionhandlers) {
        if (!libxEnv.getBoolPref ('libx.oclc.ajaxpref', 'true'))
            return;

        var cached = this.isbn2metadata[isbn];
        if (cached !== undefined) {
            if (cached != null) {
                formatFunc(cached, completionhandlers.ifFound);
            } else {
                if (completionhandlers.notFound)
                    completionhandlers.notFound();
            }
            return;
        }

        var isbn2metadata = this.isbn2metadata;

        // see http://xisbn.worldcat.org/xisbnadmin/doc/api.htm#getmetadata
        libxEnv.getXMLDocument("http://xisbn.worldcat.org/webservices/xid/isbn/" + isbn + "?method=getMetadata&format=xml&fl=*",
            function (xmlhttp) {
                var node = libxEnv.xpath.findSingle(
                        xmlhttp.responseXML, 
                        "//xisbn:rsp[@stat='ok']/xisbn:isbn", 
                        xmlhttp.responseXML, 
                        function (prefix) {
                            // only 1 namespace is used;
                            return "http://worldcat.org/xid/isbn/";
                        });

                // cache result (even if ISBN was not found)
                isbn2metadata[isbn] = node;
                if (node) {
                    formatFunc(node, completionhandlers.ifFound);
                } else {
                    if (completionhandlers.notFound)
                        completionhandlers.notFound();
                }
            });
    }
};


// vim: ts=4
