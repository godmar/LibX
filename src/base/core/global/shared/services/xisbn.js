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

(function () {

/* namespaces used in xISBN responses */
var xisbnNSResolver = { 
    'xissn' : 'http://worldcat.org/xid/issn/',
    'xisbn' : 'http://worldcat.org/xid/isbn/' 
};

/* Helper:
 * retrieve info about ISBN or ISSN from xISBN - either from cache or from service, and 
   call extractFunc(result); then pass result to formatFunc  */
function retrieve(requestUrlPath, xpathResponseOk, formatFunc, extractFunc, invofcc) {
    var xmlParam = {
        dataType : "xml",
        type     : "POST",
        url      : requestUrlPath,

        // see http://xisbn.worldcat.org/xisbnadmin/doc/api.htm#getmetadata
        success  : function (xmlhttp) {
            var node = libx.utils.xpath.findSingleXML(
                    xmlhttp, 
                    xpathResponseOk,
                    xmlhttp, 
                    xisbnNSResolver);

            if (node) {
                var metadata = extractFunc(node);
                invofcc.ifFound(formatFunc(metadata, node), metadata, xmlhttp);
            } else {
                if (invofcc.notFound)
                    invofcc.notFound(xmlhttp);
            }
        }
    }

    //Send request
    libx.cache.defaultMemoryCache.get(xmlParam);
}

/**
 * @namespace libx.services.xisbn
 *
 * Support for OCLC's xISBN/xISSN services
 */
libx.services.xisbn = {
    getISBNEditions: function (invofcc) {
        /* Return comma-separated list of editions */
        function formatISBNEditions(editions, xisbnrspisbn) {
            return editions.join(",");
        }

        function extractISBNEditions(xisbnrspisbn) {
            return libx.utils.xpath.findNodesXML(xisbnrspisbn.ownerDocument, "./xisbn:isbn/text()", xisbnrspisbn, xisbnNSResolver).map(function (r) { return r.nodeValue; });
        }

        retrieve("http://xisbn.worldcat.org/webservices/xid/isbn/" 
                        + invofcc.isbn + "?method=getEditions&format=xml&fl=*",
                 "//xisbn:rsp[@stat='ok']", 
                 formatISBNEditions, extractISBNEditions, invofcc);
    },

    /** 
     * Retrieve information about ISBN from xISBN and format as text 
     *
     * @param {String} invofcc.isbn ISBN
     * @param {Function} invofcc.ifFound(text, xml) function to be called on success.
     *          text is a brief description.  xml is full XML response.
     * @param {Function} invofcc.notFound (optional) function to be called on failure.
     */ 
    getISBNMetadata: function (invofcc) {
        /* xisbnrsp is a XML document node returned by xisbn.worldcat.org */
        function formatISBNMetadataAsText(metadata, xisbnrspisbn) {
            var text = '';
            function addIfPresent(before, key, after) {
                var s = "";
                if (key in metadata) {
                    s = before + metadata[key];
                    if (after !== undefined)
                        s += after;
                }
                return s;
            }
            // has: lccn form year lang ed title author publisher city
            text += addIfPresent('"', 'title', '"');
            text += addIfPresent(" ", 'author');
            text += addIfPresent(", ", 'year');
            text += addIfPresent(", ", 'publisher');
            text += addIfPresent(", ", 'city');
            return text;
        }

        function extractISBNMetadata(xisbnrspisbn) {
            var metadata = { };
            function addIfPresent(key, attr) {
                if (attr != null) {
                    metadata[key] = libx.utils.xml.decodeEntities ( String(attr) );
                }
            }

            // has: lccn form year lang ed title author publisher city
            addIfPresent('title', xisbnrspisbn.getAttribute('title'));
            addIfPresent('author', xisbnrspisbn.getAttribute('author'));
            addIfPresent('year', xisbnrspisbn.getAttribute('year'));
            addIfPresent('publisher', xisbnrspisbn.getAttribute('publisher'));
            addIfPresent('city', xisbnrspisbn.getAttribute('city'));
            addIfPresent('oclcnum', xisbnrspisbn.getAttribute('oclcnum'));  // space separated list if multiple
            return metadata;
        }

        retrieve("http://xisbn.worldcat.org/webservices/xid/isbn/" 
                        + invofcc.isbn + "?method=getMetadata&format=xml&fl=*",
                 "//xisbn:rsp[@stat='ok']/xisbn:isbn", 
                 formatISBNMetadataAsText, extractISBNMetadata, invofcc);
    },

    /** 
     * Retrieve information about ISSN from xISSN and format as text 
     *
     * @param {String} invofcc.issn ISSN
     * @param {Function} invofcc.ifFound(text, xml) function to be called on success.
     *          text is a brief description.  xml is full XML response.
     * @param {Function} invofcc.notFound (optional) function to be called on failure.
     */ 
    getISSNMetadataAsText: function (invofcc) {
        // NB: libx.org is the LibX affiliate account; these are limited to 100 requests a day.
        // either arrange for unlimited use with OCLC or ask that edition maintainers
        // enter an affiliate id via edition builder.

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
        function extractISSNMetadata(xissnrsp) {
            var metadata = { };
            function addIfPresent(key, attr) {
                if (attr != null) {
                    metadata[key] = libx.utils.xml.decodeEntities ( String(attr) );
                }
            }
            addIfPresent('title', xissnrsp.getAttribute('title'));
            addIfPresent('rssurl', xissnrsp.getAttribute('rssurl'));
            addIfPresent('form', xissnrsp.getAttribute('form'));
            addIfPresent('rawcoverage', xissnrsp.getAttribute('rawcoverage'));
            addIfPresent('peerreview', xissnrsp.getAttribute('peerreview'));
            addIfPresent('oclcnum', xissnrsp.getAttribute('oclcnum'));  // space separated list if multiple

            return metadata;
        }

        function formatISSNMetadataAsText(metadata, xissnrsp) {
            var text = '';
            function addIfPresent(before, key, after) {
                var s = "";
                if (key in metadata) {
                    s = before + metadata[key];
                    if (after !== undefined)
                        s += after;
                }
                return s;
            }

            text += addIfPresent('"', 'title', '"');
            text += addIfPresent(", ", 'publisher');
            if (metadata.peerreview != null) {
                text += metadata.peerreview == 'Y' ? "(peer-reviewed)" : "(non-peer-reviewed)";
            }

            switch (metadata.form) {
            case "JB": 
                var form = "Printed serial"; break;
            case "JC": 
                var form = "Serial distributed electronically by carrier"; break;
            case "JD": 
                var form = "Electronic serial distributed online"; break;
            case "MA": 
                var form = "Microform"; break;
            }
            text += ", " + form;
            return text;
        }

        retrieve("http://xissn.worldcat.org/webservices/xid/issn/" 
                  + invofcc.issn + "?method=getMetadata&format=xml&fl=*&ai=libx.org",
                 "//xissn:rsp[@stat='ok']//xissn:issn", 
                 formatISSNMetadataAsText, extractISSNMetadata, invofcc);
    },

    /** @private */
    unittests: function (out) {
        this.getISSNMetadataAsText({
            issn: "1940-5758",
            ifFound: function (text, metadata) {
                out.write(this.issn + " -> " + text + "\n");
                out.write(this.issn + " -> " + libx.utils.json.stringify(metadata) + "\n");
            }
        });

        this.getISBNMetadata({
            isbn: "0060731338",
            ifFound: function (text, metadata) {
                out.write(this.isbn + " -> " + text + "\n");
                out.write(this.isbn + " -> " + libx.utils.json.stringify(metadata) + "\n");
            }
        });

        this.getISBNMetadata({
            isbn: "9780060731335",
            ifFound: function (text, metadata) {
                out.write(this.isbn + " -> " + text + "\n");
                out.write(this.isbn + " -> " + libx.utils.json.stringify(metadata) + "\n");
            }
        });

        this.getISBNEditions({
            isbn: "0596002815",
            ifFound: function (text, asarray) {
                out.write("Editions: " + this.isbn + " -> " + text + "\n");
                out.write("Editions: " + this.isbn + " -> " + asarray + "\n");
            }
        });

        this.getISBNEditions({
            isbn: "0596002816",
            notFound: function (text) {
                out.write("Editions: " + this.isbn + " -> not found\n");
            }
        });
    }
};

if (libx.utils.browserprefs.getBoolPref ('libx.run.unittests', false))
    libx.services.xisbn.unittests(libx.log);

})();

// vim: ts=4
