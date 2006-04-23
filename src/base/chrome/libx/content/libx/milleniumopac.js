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

function MilleniumOPAC(catprefix) {//this is a constructor
	this.libraryCatalogURL = libxGetProperty(catprefix + "catalog.url");
    this.libraryCatalogURLRegExp = new RegExp(libxGetProperty(catprefix + "catalog.urlregexp"));
    this.catalogSid = libxGetProperty(catprefix + "catalog.sid");
    this.searchScope = libxGetProperty(catprefix + "catalog.searchscope");
    this.keywordSearchType = libxGetProperty(catprefix + "millenium.keywordcode");

    var sortby = libxGetProperty(catprefix + "millenium.sort");
    if (sortby == null)
        sortby = "R";   //sort by relevance, use 'D' for date
	this.catalogSort = sortby;

    this.searchform = libxGetProperty(catprefix + "millenium.searchform");
    if (this.searchform == null)
        this.searchform = 1;
}

MilleniumOPAC.prototype = {
	xisbnOPACID: "innovative",
	supportsSearchType: function (stype) {
	    if (stype == 'at') {
	        alert(libxGetProperty("articletitle.alert"));
			return false;
	    }
	    return true;
	},
    handleISSN: function (stype) {
        if (stype == 'is')  // both issn and isbn are 'i'
            return 'i';
        return stype;
    },
	makeSearch: function(stype, sterm) {
        stype = this.handleISSN(stype);

        // substitute special code for keyword searches if defined
        // some III catalogs prefer to use X for keyword searches, apparently.
        if (stype == 'Y' && this.keywordSearchType != null) {
            stype = this.keywordSearchType;
        }

        // it's not quite clear which format Millenium prefers.
        // Either (1) /search/<TYPE>/?....&startLimit= ...
        // or     (2) /search/<TYPE>/?SEARCH=....&startLimit= ...
        // or     (3) /search/?searchtype=<TYPE>&searcharg= ...
        // We have seen III use the first, second, and third form
    
        var query = this.libraryCatalogURL + "/search/";

        switch (this.searchform) {
        case 1:
            query += stype + "?" + sterm;
            break;
        case 2:
            query += stype + "?SEARCH=" + sterm;
            break;
        case 3:
            query += "?/searchtype=" + stype + "&searcharg=" + sterm;
            break;
        }

        query += "&startLimit=&searchscope=" + this.searchScope 
                + "&SORT=" + this.catalogSort + "&endLimit="
                + ((this.catalogSid != null) ? "&sid=" + this.catalogSid : "");
        return query;
	},
	makeTitleSearch: function(title) {
		return this.makeSearch("t", title);
	},
	makeISBNSearch: function(isbn) {
		return this.makeSearch("i", isbn);
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
	makeAdvancedSearch: function(fields) {
		var url = this.libraryCatalogURL + "/search/X?SEARCH=";
		url += this.handleISSN(fields[0].searchType) + ":(" + fields[0].searchTerms + ")";
		for (var i = 1; i < fields.length; i++) {
			url += "+and+" + this.handleISSN(fields[i].searchType) 
                            + ":(" + fields[i].searchTerms + ")"; 
		}
		url += "&SORT=" + this.catalogSort;
        if (this.catalogSid)
            url += "&sid=" + this.catalogSid;
		url = url.replace(/Y:\(/g, "(");	// keyword == "Any Field"
		return url;
	}
}

// vim: ts=4
