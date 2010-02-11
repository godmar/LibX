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
 * Polaris ILS Implementation.
 *
 * Syntax based on Keith Belton's description:
 *
 * The general form of the search url is
 *
 *  http://{BaseUrl}/polaris/search/searchresults.aspx?ctx=1.1033.0.0.{1-n}&type={SearchType}&term={SearchTerm}&by={index}&limit=TOM=*
 *
 * where
 * + ctx=1.1033.0.0.{x} is the branch number for the search, usually 1 is the whole system, 
 *                  but this is localizable for the default search;
 *
 * + SearchType is Keyword, Browse, Phrase, Exact, Advanced, or Boolean (advanced seems to work 
 *      best, but type of Advanced with index of KW does not seem to work - for that, search 
 *      type of Keyword(or default) seems to be necessary);
 *
 * + Index is KW, TI, AU, SU, ISBN, ISSN, LCCN, SuDoc, CODEN, STRN, Publisher, etc. 
 *  The indexes available are localizable, but the abbreviations for them are not usually changed;
 *
 * + Limit=TOM (Type of Material)  these are localizable, so we just use *
 *
 * + &term is repeatable and is delimited by the following &by; &by is also repeatable
 *
 *	@name libx.catalog.factory.polaris
 *	@augments libx.catalog.Catalog
 *	@class 
 */

libx.catalog.factory["polaris"] = libx.core.Class.create(libx.catalog.Catalog, 
/** @lends libx.catalog.factory.polaris.prototype */
{ 
    ctx: "1.1033.0.0.1",
    searchtype: "Advanced",
    kwsearchtype: "Keyword",
    limit: "TOM=*",
    xisbn: { opacid: "polaris" },

	convert: function (stype) {
	    switch (stype) {
	        case 'Y':   return "KW";
	        case 'i':   return "ISBN";
	        case 'is':   return "ISSN";
	        case 'a':   return "AU";
	        case 't':   return "TI";
	        case 'd':   return "SU";
	        case 'c':   return "LCCN";  // Call number or Control number?
	        default:
	            return "KW";
	    }
	},
    baseURL: function () {
        return this.url + "/polaris/Search/searchresults.aspx?ctx=" + this.ctx;
    },
    /**
     * Single term search
     *	@return {URL} Search URL
     */
	makeSearch: function(stype, sterm) {
        return this.makeAdvancedSearch([{ searchType: stype, searchTerms: sterm }]);
    },
    /**
     * Advanced search
     *	@return {URL} Search URL
     */
	makeAdvancedSearch: function(fields) {
        // combine all search fields that share same type
        var searchField2Term = this.combineSameTypedFields(fields);

        var url = this.baseURL();
		for (var ftype in searchField2Term) {
            switch (ftype) {
            case 'Y':
                url += "&type=" + this.kwsearchtype;
                break;
            default:
                url += "&type=" + this.searchtype;
                break;
            }
            url += "&term=" + encodeURIComponent(searchField2Term[ftype]);
            url += "&by=" + this.convert(ftype);
        }
        return url + "&limit=" + this.limit;
    },
    /**
     * Implement xISBN search when no res_id is given - in this case, 
     * xISBN expects a res_id of http://catalog/polaris - slightly
     * different than normal.
     */
    makeXISBNRequest: function(isbn) {
        if (this.xisbn.res_id == null) {
            return "http://xisbn.worldcat.org/liblook/resolve.htm?res_id=" 
                + this.url.replace(/https/, "http") + "/polaris"
                + "&opactype=" + this.xisbn.opacid 
                + (this.xisbn.siteparam != null ? this.xisbn.siteparam : "") 
                + "&rft.isbn=" + isbn;
        } else {
            return this.parent(isbn);
        }
    }
});

// vim: ts=4
