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
