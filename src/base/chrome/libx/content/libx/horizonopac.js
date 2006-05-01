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

// Support for Horizon OPAC
function HorizonOPAC(catprefix) {
    this.url = libxGetProperty(catprefix + "catalog.url");
    // some catalogs use ISBNBR+ISSNBR (e.g., JHU)
    // others have an index ISBNEX that does exact matching on both ISSN & ISBN
    this.isbn = libxGetProperty(catprefix + "horizon.isbn");
    this.issn = libxGetProperty(catprefix + "horizon.issn");
}

HorizonOPAC.prototype = {
    xisbnOPACID: "ipac",
	convert: function (stype) {
	    switch (stype) {
	        case 'a':   return ".AW";
	        case 't':   return ".TW";
	        case 'i':   return this.isbn;
	        case 'is':  return this.issn;
	        case 'c':   return "CALLLC";
	        case 'Y':   return ".GW";
	        default:
	            return ".GW";
	    }
	},
	supportsSearchType: function (stype) {  // if horizon supports article title searches, adjust
	    if (stype == 'at') {
	        alert(libxGetProperty("articletitle.alert"));
			return false;
	    }
	    return true;
	},
	makeSearch: function(stype, sterm) {
	    return this.url + "/ipac20/ipac.jsp?index=" + this.convert(stype) + "&term=" + sterm;
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
	    var url = this.url + "/ipac20/ipac.jsp?";
		url += "index=" + this.convert(fields[0].searchType) + "&term=" + fields[0].searchTerms;
		for (var i = 1; i < fields.length; i++) {
			url += "&oper=and&index=" + this.convert(fields[i].searchType) + "&term=" + fields[i].searchTerms; 
		}
		return url;
	}
}

// vim: ts=4
