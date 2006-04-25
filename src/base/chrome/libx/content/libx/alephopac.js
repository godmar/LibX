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
 * Contributor(s): Godmar Back (godmar@gmail.com), Sean Chen (chen@law.duke.edu)
 *
 *
 * ***** END LICENSE BLOCK ***** */

function AlephOPAC(catprefix) {
	//this is a constructor
    this.libraryCatalogURL = libxGetProperty(catprefix + "catalog.url");
	this.libraryCatalogSid = libxGetProperty(catprefix + 'catalog.sid');
	this.libraryCatalogAlephLocalBase = libxGetProperty(catprefix + 'aleph.localbase');
	this.libraryCatalogAlephTitle = libxGetProperty(catprefix + 'aleph.title');
	this.libraryCatalogAlephAuthor = libxGetProperty(catprefix + 'aleph.author');
	this.libraryCatalogAlephISBN = libxGetProperty(catprefix + 'aleph.isbn');
	this.libraryCatalogAlephISSN = libxGetProperty(catprefix + 'aleph.issn');
	this.libraryCatalogAlephCallNo = libxGetProperty(catprefix + 'aleph.callno');
	this.libraryCatalogAlephKeyword = libxGetProperty(catprefix + 'aleph.keyword');
	this.libraryCatalogAlephFindFunc = libxGetProperty(catprefix + 'aleph.findfunc');
	this.libraryCatalogAlephAdvFindFunc = libxGetProperty(catprefix + 'aleph.advfindfunc');
	this.libraryCatalogAlephScanFunc = libxGetProperty(catprefix + 'aleph.scanfunc');
}

AlephOPAC.prototype = {
	xisbnOPACID: "aleph",
	supportsSearchType: function (stype) {
	    if (stype == 'at') {
	        alert(libxGetProperty("articletitle.alert"));
			return false;
	    }
	    return true;
	},
	searchCodeLookup: function(stype) {
		switch(stype) {
			case 't':	return this.libraryCatalogAlephTitle;
			case 'c':	return this.libraryCatalogAlephCallNo;
			case 'a':	return this.libraryCatalogAlephAuthor;
			case 'Y': 	return this.libraryCatalogAlephKeyword;
			case 'is': 	return this.libraryCatalogAlephISSN;
			case 'i':	return this.libraryCatalogAlephISBN;
			default : return this.libraryCatalogAlephKeyword;
		}
	},
	makeSearch: function(stype, query) {
		//split between heading indexes and straight keyword indexes
		//aleph handles then both the same way but displays them in different
		//ways.  
    	switch(stype) {
			case 't':
			case 'c':
				return this.libraryCatalogURL + "/F?func=" 
					+ this.libraryCatalogAlephScanFunc
					+ "&sourceid=" + this.libraryCatalogSid
					+ "&local_base=" + this.libraryCatalogAlephLocalBase 
					+ "&scan_code=" + this.searchCodeLookup(stype)
					+ "&scan_start=" + query;
			case 'a':
			case 'Y':
			case 'i':
			case 'is':
			default: 
				return this.libraryCatalogURL + "/F?func="
					+ this.libraryCatalogAlephFindFunc 
					+ "&sourceid=" + this.libraryCatalogSid
					+ "&local_base=" + this.libraryCatalogAlephLocalBase
					+ "&find_code=" + this.searchCodeLookup(stype)
					+ "&request=" + query;
    	}
    },
	makeTitleSearch: function(title) {
		return this.makeSearch("t", title);
	},
	makeISBNSearch: function(isbn) {
		return this.makeSearch("i", isbn);
	},
	makeISSNSearch: function(issn) {
		return this.makeSearch("is", issn);
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
		//assumption that we're only doing AND sets.  
		var url = this.libraryCatalogURL + "/F?func="
				+ this.libraryCatalogAlephAdvFindFunc
				+ "&sourceid=" + this.libraryCatalogSid
				+ "&local_base=" + this.libraryCatalogAlephLocalBase;
		url += "&find_code=" + this.searchCodeLookup(fields[0].searchType) 
			+ "&request=" + fields[0].searchTerms;
		for (var i = 1; i < fields.length; i++) {
			url += "&request_op=AND&find_code=" 
				+ this.searchCodeLookup(fields[i].searchType) 
				+ "&request=" + fields[i].searchTerms; 
		}
		return url;
	}
}

// vim: ts=4