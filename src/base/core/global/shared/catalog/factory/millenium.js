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
 *	Millenium Catalog Implementation
 *
 *	@name libx.catalog.factory.millenium
 *	@augments libx.catalog.Catalog
 *  @class 
 */
(function () {

function cleanColon(stype, sterm) {
    if (stype != 'Y')
        return sterm;

    // III's keyword searches don't like a colon, it's interpreted as index
    return sterm.replace(/:/g,"");
}

libx.catalog.factory["millenium"] = libx.core.Class.create(libx.catalog.Catalog, 
/** @lends libx.catalog.factory.millenium.prototype */
{

	xisbn: { opacid: "innovative" },
    // we no longer provide a default for 'sort'
    // default values for millenium catalogs
    searchform: 1,
    advancedcode: 'X',
    keywordcode: 'Y',
    journaltitlecode: 't',
    language: '',
	supportsSearchType: function (stype) {
	    if (stype == 'at') {
	        alert(libxGetProperty("articletitle.alert"));
			return false;
	    }
	    return true;
	},
    normalizeSearchType: function (stype) {
        if (stype == 'is')  // both issn and isbn are 'i'
            return 'i';
        if (stype == 'jt')  // both title and journal title are 't'
            return this.journaltitlecode;
        return stype;
    },
	makeSearch: function(stype, sterm) {
        stype = this.normalizeSearchType(stype);
        sterm = cleanColon(stype, sterm);

        // substitute special code for keyword searches if defined
        // some III catalogs prefer to use X for keyword searches, apparently.
        if (stype == 'Y') {
            stype = this.keywordcode;
        }

        // it is not quite clear which format Millenium prefers.
        // Either (1) /search/<TYPE>/?....&startLimit= ...
        // or     (2) /search/<TYPE>/?SEARCH=....&startLimit= ...
        // or     (3) /search/?searchtype=<TYPE>&searcharg= ...
        // We have seen III use the first, second, and third form
    
        var query = this.url + "/search" + this.language + "/";

        switch (this.searchform) {
        default:
        case '1':
            query += stype + "?" + encodeURIComponent(sterm);
            break;
        case '2':
            query += stype + "?SEARCH=" + encodeURIComponent(sterm);
            break;
        case '3':
            query += "?/searchtype=" + stype + "&searcharg=" + encodeURIComponent(sterm);
            break;
        }

        // 2011/01/06 - for author searches, including startLimit/endLimit screws up the
        // reversal function - search for Smith, Joe instead of Joe, Smith
        var includeLimit = stype != 'a';
        if (includeLimit)
            query += "&startLimit=";
            
        query += (this.searchscope != null ? "&searchscope=" + this.searchscope : "");
        query += (this.sort != null ? "&SORT=" + this.sort : "");
        if (includeLimit)
            query += "&endLimit=";
            
        return query;
	},
	makeAdvancedSearch: function(fields) {
		var url = this.url + "/search"  + this.language + "/" 
                + this.advancedcode + "?SEARCH=";
		url += this.normalizeSearchType(fields[0].searchType) + ":(" + encodeURIComponent(cleanColon(fields[0].searchType, fields[0].searchTerms)) + ")";
		for (var i = 1; i < fields.length; i++) {
			url += "+and+" + this.normalizeSearchType(fields[i].searchType) 
                            + ":(" + encodeURIComponent(cleanColon(fields[i].searchType, fields[i].searchTerms)) + ")"; 
		}
        url += (this.searchscope != null ? "&searchscope=" + this.searchscope : "");
		url += "&SORT=" + this.sort;
        if (this.sid)
            url += "&sid=" + this.sid;
		url = url.replace(/Y:\(/g, "(");	// keyword == "Any Field"
		return url;
	}
});

}) ();  // end anonymous scope

// vim: ts=4
