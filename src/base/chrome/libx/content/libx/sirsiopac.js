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

// Support for Sirsi OPAC
function SirsiOPAC(catprefix) {
    this.libraryCatalogURL = libxGetProperty(catprefix + "catalog.url");
	this.libraryCatalogURLRegExp = "";
    this.sirsiPath = "/uhtbin/cgisirsi/x/0/0/5/?";
}

SirsiOPAC.prototype = {
    xisbnOPACID: "sirsi6",
/*
      <option value="GENERAL^SUBJECT^GENERAL^^keywords anywhere">keyword anywhere</option>
      <option value="AU^AUTHOR^AUTHORS^Author Processing^author">author</option>
      <option value="TI^TITLE^TITLES^Title Processing^title">title</option>
      <option value="SU^SUBJECT^SUBJECTS^^subject">subject</option>
      <option value="SER^SERIES^TITLES^Title Processing^series">series</option>
      <option value="PER^PERTITLE^TITLES^Title Processing^periodical title">periodical title
*/

	convert: function (stype) {
	    switch (stype) {
	        case 'a':   return "&srchfield1=" + this.convert2(stype);
	        case 't':   return "&srchfield1=" + this.convert2(stype);
            case 'is':
	        case 'i':   return ""; // maybe nothing will do better here? return "{022}";
	        case 'c':   return ""; //                                    return "{050}";
	        case 'Y':   return "&srchfield1=" + this.convert2(stype);
	        default:
	            return "";
	    }
	},
	convert2: function (stype) {
	    switch (stype) {
	        case 'a':   return "AU^AUTHOR^AUTHORS^Author Processing^author";
	        case 't':   return "TI^TITLE^TITLES^Title Processing^title";
            case 'is':  return 
	        case 'i':   return "GENERAL^SUBJECT^GENERAL^^keywords anywhere";    // ???
	        case 'Y':   return "GENERAL^SUBJECT^GENERAL^^keywords anywhere";
	        case 'c':   return "GENERAL^SUBJECT^GENERAL^^keywords anywhere";    // ???
	        default:
	            return "GENERAL^SUBJECT^GENERAL^^keywords anywhere";
	    }
	},
    // if sirsi supports article title searches, adjust
	supportsSearchType: function (stype) {  
	    if (stype == 'at') {
	        alert(libxGetProperty("articletitle.alert"));
			return false;
	    }
	    return true;
	},
	makeSearch: function(stype, sterm) {
        return this.libraryCatalogURL + this.sirsiPath + "searchdata1=" + sterm + this.convert(stype);
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
        var url = this.libraryCatalogURL + this.sirsiPath;
		for (var i = 0; i < fields.length; i++) {
			url += "srchfield" + (i+1) + "=" + this.convert2(fields[i].searchType) 
                + "&searchdata" + (i+1) + "=" + fields[i].searchTerms;
            if (i < fields.length - 1) {
                url += "&searchoper" + (i+1) + "=AND&";
            }
		}
		return url;
	}
}

// vim: ts=4
