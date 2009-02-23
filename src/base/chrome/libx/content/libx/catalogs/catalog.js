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
 
 /**
  *	@fileoverview Implementation of LibX core Catalog classes
  *		Implements Catalog, bookmarklet, and scholar
  *	@author Annette Bailey <annette.bailey@gmail.com>
  *	@author Godmar Back <godmar@gmail.com>
  */

/** @namespace All catalog class definitions reside in this namespace */
libx.catalog = { 
    /**
     *	Used to instantiate the various catalog types
     *	All catalog types are accessed by there lowercase class names
     *	@namespace
     *	@example
     *		var alephCatalog = new libx.factory["aleph"] ()
     */
    factory : { }
};

/**
 *	Mixin used by catalogs and openurl resolvers
 * @class
 */
libx.catalog.CatalogUtils = {

    /* If the searchType is 'i', examine if user entered an ISSN
     * and if so, change searchType to 'is'.  This ensures that 'i' handles
     * both ISBNs and ISSNs.
     */
    adjustISNSearchType : function (f)
    {
        // if this is an ISSN, but not a ISBN, change searchType to 'is'
        if (f.searchType == 'i') {
            if (!libx.utils.stdnumsupport.isISBN(f.searchTerms) && libx.utils.stdnumsupport.isISSN(f.searchTerms)) {
                f.searchType = 'is';
            }
        }
    }
};

/**
 *	Base class for all catalogs
 *	@class
 */
libx.catalog.Catalog = libx.core.Class.create(
/** @lends libx.catalog.Catalog.prototype */{
	/** @augments libx.catalog.CatalogUtils */
    include: [ libx.catalog.CatalogUtils ],
	/**
	 *	Specifies whether the catalog should down convert ISBN-13
	 *	@property downconvertisbn13
	 *	@type Boolean
	 */
    downconvertisbn13: true,
    
    xisbn: { },
    
    /**
     *	Makes a search for provided subject
     *	@return {String} URL for requested search
     */
    makeSubjectSearch: function(/**String*/ subject) {
        return this.makeSearch("d", subject);
    },
    /**
     *	@return {URL} Search URL
     */
    makeTitleSearch: function(/**String*/title) {
        return this.makeSearch("t", title);
    },
    /**
     *	@return {URL} Search URL
     */
    makeISBNSearch: function(/**String*/isbn) {
        return this.makeSearch("i", isbn);
    },
    /**
     *	@return {URL} Search URL
     */
    makeISSNSearch: function(/**String*/isbn) {
        return this.makeSearch("is", isbn);
    },
    /**
     *	@return {URL} Search URL
     */
    makeAuthorSearch: function(/**String*/author) {
        return this.makeSearch("a", author);
    },
    /**
     *	@return {URL} Search URL
     */
    makeCallnoSearch: function(/**String*/callno) {
        return this.makeSearch("c", callno);
    },
    /**
     *	@return {URL} Search URL
     */
    makeKeywordSearch: function(/**String*/keyword) {
        return this.makeSearch("Y", keyword);
    },
    /**
     * Create a url that requests an item by ISBN from the xISBN service,
     * if the current catalog supports it.
     * @return {URL} xISBN liblookup URL
     */
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
                libx.log.write(this.name + " does not support search type " + fields[i].searchType);
                return;
            }
            this.adjustISNSearchType(fields[i]);
        }
        if (fields.length == 1) {//single search field
            var url = this.makeSearch(fields[0].searchType, fields[0].searchTerms);
        } else {// user requested multiple search fields, do advanced search
            var url = this.makeAdvancedSearch(fields);
        }
        if (url == null) {
            libx.log.write("Could not construct search");
        }
        return url;
    },
    /** Combine search fields of same type, concatenating them with 
     * an intermediate space.
     * Returns an unordered hash indexed by type.
     */
    combineSameTypedFields: function (fields) {
        // combine all search fields that share same type
        var searchField2Term = { };
        for (var i = 0; i < fields.length; i++) {
            with (fields[i]) {
                if (searchType in searchField2Term) {
                    searchField2Term[searchType] += " " + searchTerms;
                } else {
                    searchField2Term[searchType] = searchTerms;
                }
            }
        }
        return searchField2Term;
    },
    /**
     * the default implementation looks at the options property
     * to decide which options are supported.
     */
    supportsSearchType: function (stype) {
        return (";" + this.options + ";").match(";" + stype + ";");
    },
    options: "Y;t;a;d;i;c",
    
    /**
     *	Constructs a search for provided search type and search term.
     *
     *	Search type is a short code as described in the edition
     *	configuration's search option. Historically, the following codes
     *	are used:
     *	'i' - ISBN
     *	'Y' - Keyword
     *	't' - Title
     *	'a' - Author
     *	'c' - Call Number
     *	'd' - Subject
     *
     *	@abstract
     *	@return {URL} Search URL	
     */
    makeSearch : function (/**String*/stype, /**String*/sterm) { },

    /**
     *	Constructs a search URL from one or more fields
     *	@abstract
     *	@return {URL} Search URL
     */
    makeAdvancedSearch : function (fields) { }
});

 
/**
 * 	Support generic "bookmarklet" style searches
 * 	The id's %t, %jt etc. in the URL are being replaced with the entered terms
 *	@name libx.catalog.factory.bookmarklet
 *	@constructor
 *	@augments libx.catalog.Catalog
 */
libx.catalog.factory["bookmarklet"] = libx.core.Class.create( libx.catalog.Catalog, 
	 /** @lends libx.catalog.factory.bookmarklet.prototype */{
	 
    makeSearch: function (/**String*/ stype, /**String*/ sterm) {
        return this.makeAdvancedSearch([{searchType: stype, searchTerms: sterm}]);
    },
    
    makeAdvancedSearch: function (/**[{searchType: {String}, searchTerms: {String}}]*/fields) {
        var usePost = this.postdata != null;
        if (usePost) {
            var argtemplate = this.postdata;
        } else {
            var argtemplate = this.url;
        }

        /* Example of URL that uses %SWITCH statement and %termN:
            url="http://www.lib.umich.edu/ejournals/ejsearch.php?searchBy=%SWITCH{%type1}{t:KT}{d:KS}{sot:TV}{soi:IV}&AVterm1=%term1&Cnect2=AND&AVterm2=%term2&Cnect3=AND&AVterm3=%term3&New=All&submit=Find"
        */
        var swtch;
        var swtchre = /%SWITCH\{(%[a-z0-9]+)\}\{(([^}]+(\}\{)?)+)}/i;
        while ((swtch = argtemplate.match(swtchre)) != null) {
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
                    libx.log.write("invalid switch_arg '" + s + "', must be %termX or %typeX");
            }
            for (var i = 0; switch_arg != null && i < caseargs.length; i++) {
                var re = new RegExp("^" + switch_arg + ":(\\S*)$");
                var m = re.exec(caseargs[i]);
                if (m) {
                    repl = m[1];
                    break;
                }
            }
            argtemplate = argtemplate.replace(swtchre, repl);
        }

        // replace %termN with corresponding search terms
        for (var i = 0; i < fields.length; i++) {
           argtemplate = argtemplate.replace("%term" + (i+1), encodeURIComponent(fields[i].searchTerms), "g");
        }
        // clear out remaining %termN
        argtemplate = argtemplate.replace(/%term\d+/g, "");

        // combine all search fields that share same type
        var searchField2Term = this.combineSameTypedFields(fields);

        /*
         * Process JOIN statement has the form %JOIN{JOINEXPR}{code|VALUE with %code}*
         * Replaces {code|VALUE with %code} with either empty (if %code is not included)
         * or to "VALUE with %code" if not.  Uses "JOINEXPR" as a connector a la 'join'.
         * Example:
         *
         * options="Y;t;a" 
         * url="http://ezproxy.lib.vt.edu:8080/login?url=http://firstsearch.oclc.org/dbname=WorldCat;FSIP;query=%JOIN{%20and%20}{Y|kw%3A%Y}{t|ti%3A%t}{a|au%3A%a}" 
         */
        var join;
        var joinre = /%JOIN{(([^}]+(\}\{)?)+)}/i;
        while ((join = argtemplate.match(joinre)) != null) {
            var caseargs = join[1].split("}{");
            var joiner = caseargs[0];
            var repl = "";
            for (var i = 1; i < caseargs.length; i++) {
                var ca = caseargs[i].split("|");
                if (searchField2Term[ca[0]]) {
                    if (repl != "")
                        repl += joiner;

                    repl += ca[1];
                }
            }
            argtemplate = argtemplate.replace(joinre, repl);
        }

        // replace %X with terms
        for (var stype in searchField2Term) {
           argtemplate = argtemplate.replace("%" + stype, encodeURIComponent(searchField2Term[stype]));
        }

        // clear out other %values if defined
        for (var option in libx.edition.searchoptions) {
            // to allow %is, %i, and %issue require that label be followed by a non-letter
            // XXX not very robust.
            argtemplate = argtemplate.replace(new RegExp("%" + option + "(?![a-zA-Z0-9])"), "", "g");
        }

        if (usePost) {
            return [ this.url, argtemplate ];
        } else {
            return argtemplate;
        }
    }
});

/**
 * 	Google Scholar Catalog Implementation
 *	@name libx.catalog.factory.scholar
 *	@augments libx.catalog.Catalog
 *	@constructor 
 */
libx.catalog.factory["scholar"] = libx.core.Class.create( libx.catalog.Catalog, 
	/** @lends libx.catalog.factory.scholar.prototype */
	{

    options: "Y;at;jt;a",
    /**
     *	Constructs a search URL for Google Scholar
     */
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
        var author = "";     // authors
        var keyword = "";     // keywords
        var atitle = "";    // article title
        var journaltitle = "";     // title (of journal)
        for (var i = 0; i < fields.length; i++) {
            switch (fields[i].searchType) {
            case 'a':
                author += fields[i].searchTerms + " ";
                break;
            case 'at':
                atitle += fields[i].searchTerms + " ";
                break;
            case 'Y':
            case 'i':
                keyword += fields[i].searchTerms + " ";
                break;
            case 't':
            case 'jt':
                journaltitle += fields[i].searchTerms;
                break;
            }
        }
        var query = "";
        if (keyword == "" && atitle != "") {
            // we cannot use allintitle: when keywords are given also
            query = "allintitle: " + atitle;
        } else {
            query = keyword + " " + atitle;
        }
        if (author != "") {
            query += " author:" + author;
        }

        var baseurl = 'http://scholar.google.com/scholar?hl=en&lr=';
        if (journaltitle) {
            baseurl += '&as_publication=' + encodeURIComponent(journaltitle);
        }
        return baseurl + '&q=' + encodeURIComponent(libx.utils.string.trim(query));
    }
});
