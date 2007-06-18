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
 * LibX toolbar extension
 *
 * Author: Annette Bailey <annette.bailey@gmail.com>
 */ 

// Base class for all catalogs
function libxCatalog() { }

libxCatalog.prototype = {
    xisbn: { },
    setIf: function (prop, what) {
        if (what != null)
            this[prop] = libxConvertToBoolean(what);
    },
    makeSubjectSearch: function(subject) {
        return this.makeSearch("d", subject);
    },
    makeTitleSearch: function(title) {
        return this.makeSearch("t", title);
    },
    makeISBNSearch: function(isbn) {
        return this.makeSearch("i", isbn);
    },
    makeISSNSearch: function(isbn) {
        return this.makeSearch("is", isbn);
    },
    makeAuthorSearch: function(author) {
        return this.makeSearch("a", author);
    },
    makeCallnoSearch: function(callno) {
        return this.makeSearch("c", callno);
    },
    makeKeywordSearch: function(keyword) {
        return this.makeSearch("Y", keyword);
    },
    // Create a url that requests an item by ISBN from the xISBN service,
    // if the current catalog supports it
    makeXISBNRequest: function(isbn) {
        if (this.xisbn.res_id) {
            // new service described at http://xisbn.worldcat.org/liblook/howtolink.htm
            return "http://xisbn.worldcat.org:80/liblook/resolve.htm?res_id="
                + this.xisbn.res_id
                + "&rft.isbn=" + isbn
                + "&url_ver=Z39.88-2004&rft_val_fmt=info:ofi/fmt:kev:mtx:book";
        } else
        if (this.xisbn.opacid) {
            // new service as per http://xisbn.worldcat.org/liblook/howtolinkbyopactype.htm
            return "http://xisbn.worldcat.org/liblook/resolve.htm?res_id=" 
                + this.url.replace(/https/, "http")
                + "&opactype=" + this.xisbn.opacid 
                + (this.xisbn.siteparam != null ? this.xisbn.siteparam : "") 
                + "&rft.isbn=" + isbn;
        } else {
            return this.makeISBNSearch(isbn);
        }
    },
    linkByISBN: function (isbn) {
        if (this.xisbn.cues) {
            return this.makeXISBNRequest(isbn);
        } else {
            return this.makeISBNSearch(isbn);
        }
    },

    // given an array of {searchType: xxx, searchTerms: xxx } items
    // formulate a query against this catalog
    search: function (fields) {
        if (fields.length == 0) {//nothing entered
            fields = [{searchType: 'Y', searchTerms: ""}];
        }
        for (var i = 0; i < fields.length; i++) {
            if (!this.supportsSearchType(fields[i].searchType)) {
                libxEnv.writeLog(this.name + " does not support search type " + fields[i].searchType);
                return;
            }
            libxAdjustISNSearchType(fields[i]);
        }
        if (fields.length == 1) {//single search field
            var url = this.makeSearch(fields[0].searchType, fields[0].searchTerms);
        } else {// user requested multiple search fields, do advanced search
            var url = this.makeAdvancedSearch(fields);
        }
        if (url != null) {
            libxEnv.openSearchWindow(url, this.doNotURIEncode);
        } else {
            libxEnv.writeLog("Could not construct search");
        }
    },
    /* the default implementation looks at the options property
     * to decide which options are supported.
     */
    supportsSearchType: function (stype) {
        return (";" + this.options + ";").match(";" + stype + ";");
    },
    options: "Y;t;a;d;i;c"
}

function libxAddToPrototype(prototype, addedmethods) 
{
    for (var m in addedmethods) {
        prototype[m] = addedmethods[m];
    }
}

/*
 * Support generic "bookmarklet" style searches
 * The id's %t, %jt etc. in the URL are being replaced with the entered terms
 */
function libxBookmarklet() { }

libxBookmarklet.prototype = new libxCatalog();

libxAddToPrototype(libxBookmarklet.prototype, {
    doNotURIEncode: true,
    makeSearch: function (stype, sterm) {
        return this.makeAdvancedSearch([{searchType: stype, searchTerms: sterm}]);
    },
    makeAdvancedSearch: function (fields) {
        var url = this.url;
        /* Example of URL that uses %SWITCH statement and %termN:
            $catalog1.catalog.url=http://www.lib.umich.edu/ejournals/ejsearch.php?searchBy=%SWITCH{%type1}{t:KT}{d:KS}{sot:TV}{soi:IV}&AVterm1=%term1&Cnect2=AND&AVterm2=%term2&Cnect3=AND&AVterm3=%term3&New=All&submit=Find
        */
        var swtch;
        var swtchre = /%SWITCH\{(%[a-z0-9]+)\}\{(([^}]+(\}\{)?)+)}/i;
        while ((swtch = url.match(swtchre)) != null) {
            var s = swtch[1];
            var repl = "";
            var caseargs = swtch[2].split("}{");
            var m = s.match(/^%type(\d+)/);
            var switch_arg = null;
            if (m) {
                if (m[1] <= fields.length)
                    switch_arg = fields[m[1] - 1].searchType;
            } else {
                m = s.match(/^%term(\d+)/);
                if (m) {
                    if (m[1] <= fields.length)
                        switch_arg = fields[m[1] - 1].searchTerms;
                } else
                    libxEnv.writeLog("invalid switch_arg '" + s + "', must be %termX or %typeX");
            }
            for (var i = 0; switch_arg != null && i < caseargs.length; i++) {
                var re = new RegExp("^" + switch_arg + ":(\\S*)$");
                var m = re.exec(caseargs[i]);
                if (m) {
                    repl = m[1];
                    break;
                }
            }
            url = url.replace(swtchre, repl);
        }

        // replace %termN with corresponding search terms
        for (var i = 0; i < fields.length; i++) {
           url = url.replace("%term" + (i+1), encodeURIComponent(fields[i].searchTerms), "g");
        }
        // clear out remaining %termN
        url = url.replace(/%term\d+/g, "");

        // replace %X as with terms
        for (var i = 0; i < fields.length; i++) {
           url = url.replace("%" + fields[i].searchType, encodeURIComponent(fields[i].searchTerms));
        }

        // clear out other %values if defined
        for (var option in libxDropdownOptions) {
            // to allow %is, %i, and %issue require that label be followed by a non-letter
            // XXX not very robust.
            url = url.replace(new RegExp("%" + option + "(?![a-zA-Z0-9])"), "", "g");
        }
        return url;
    }
});

function libxScholarSearch() { }

libxScholarSearch.prototype = new libxCatalog();

libxAddToPrototype(libxScholarSearch.prototype, {
    doNotURIEncode: true,
    options: "Y;at;jt;a",
    makeSearch: function (stype, sterm) {
        return this.makeAdvancedSearch([{searchType: stype, searchTerms: sterm}]);
    },
    makeAdvancedSearch: function (fields) {
        return this.libxScholarSearch(fields);
    },

    /*
     * Formulate a google scholar search from entered search fields
     * when user presses the Scholar button.
     */
    libxScholarSearch: function (fields) {
        var a = "";     // authors
        var k = "";     // keywords
        var at = "";    // article title
        var t = "";     // title (of journal)
        for (var i = 0; i < fields.length; i++) {
            switch (fields[i].searchType) {
            case 'a':
                a += fields[i].searchTerms + " ";
                break;
            case 'at':
                at += fields[i].searchTerms + " ";
                break;
            case 'Y':
            case 'i':
                k += fields[i].searchTerms + " ";
                break;
            case 't':
            case 'jt':
                t += fields[i].searchTerms;
                break;
            }
        }
        var q = "";
        if (k == "" && at != "") {
            // we cannot use allintitle: when keywords are given also
            q = "allintitle: " + at;
        } else {
            q = k + " " + at;
        }
        if (a != "") {
            q += " author: " + a;
        }
        return magicSearch(q, t, true);    // true means suppress heuristics
    }
});
