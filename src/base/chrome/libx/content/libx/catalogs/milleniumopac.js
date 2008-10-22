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

(function () 
{

function MilleniumOPAC() { }

libxEnv.catalogClasses["millenium"] = MilleniumOPAC;

MilleniumOPAC.prototype = new libxCatalog();

libxAddToPrototype(MilleniumOPAC.prototype, {
	xisbn: { opacid: "innovative" },
    // default values for millenium catalogs
    sort: 'R',  //sort by relevance, use 'D' for date
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
        case 1:
            query += stype + "?" + encodeURIComponent(sterm);
            break;
        case 2:
            query += stype + "?SEARCH=" + encodeURIComponent(sterm);
            break;
        case 3:
            query += "?/searchtype=" + stype + "&searcharg=" + encodeURIComponent(sterm);
            break;
        }

        query += "&startLimit=" + (this.searchscope != null ? "&searchscope=" + this.searchscope : "")
                + "&SORT=" + this.sort + "&endLimit="
                + ((this.sid != null) ? "&sid=" + this.sid : "");
        return query;
	},
	makeAdvancedSearch: function(fields) {
		var url = this.url + "/search"  + this.language + "/" 
                + this.advancedcode + "?SEARCH=";
		url += this.normalizeSearchType(fields[0].searchType) + ":(" + encodeURIComponent(fields[0].searchTerms) + ")";
		for (var i = 1; i < fields.length; i++) {
			url += "+and+" + this.normalizeSearchType(fields[i].searchType) 
                            + ":(" + encodeURIComponent(fields[i].searchTerms) + ")"; 
		}
        url += (this.searchscope != null ? "&searchscope=" + this.searchscope : "");
		url += "&SORT=" + this.sort;
        if (this.sid)
            url += "&sid=" + this.sid;
		url = url.replace(/Y:\(/g, "(");	// keyword == "Any Field"
		return url;
	}
});

})();

// vim: ts=4
