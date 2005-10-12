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

// Support for Voyager OPAC
function VoyagerOPAC(catURL) {
	this.libraryCatalogURL = catURL;
	this.libraryCatalogURLRegExp = "";
}

// taken in part from http://www.mines.edu/library/catalyst/canned.html
VoyagerOPAC.prototype = {
    xisbnOPACID: "voyager",
	convert: function (stype) {
	    switch (stype) {
	        case 'a':   return "NAME_";
	        case 't':   return "TALL";
	        case 'i':   return "ISBN";
	        case 'c':   return "CALL_";
	        case 'Y':   return "FT*";
	        default:
	            return "FT*";
	    }
	},
	convert2: function (stype) {
	    switch (stype) {
	        case 'a':   return "Author (NKEY)";
	        case 't':   return "Title (TKEY)";
	        case 'i':   return "ISSN/ISBN (ISSN)";
	        case 'Y':   return "Keyword Anywhere (GKEY)";
	        case 'c':   return "?not supported?";
	        default:
	            return "not supported";
	    }
	},
	supportsSearchType: function (stype) {  // if voyager supports article title searches, adjust
	    if (stype == 'at') {
	        alert(libxGetProperty("articletitle.alert"));
			return false;
	    }
	    return true;
	},
	makeSearch: function(stype, sterm) {
        if (stype == 'Y') {
            // + does "find all" as in Google; we assume the user wants this 
            sterm = sterm.replace(/^(\S)/, "%2B$1");
            sterm = sterm.replace(/\s+(\S)/, " %2B$1");
        }
        // order of fields seems to matter here (!??!)
        return this.libraryCatalogURL + "/cgi-bin/Pwebrecon.cgi?Search_Arg=" + sterm + "&HIST=1&SL=None&Search_Code="+ this.convert(stype) + "&CNT=25&DB=local";
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
        // https://gil.gatech.edu/cgi-bin/Pwebrecon.cgi?
        // SAB1=KKKKKK&BOOL1=all+of+these&FLD1=Keyword+Anywhere+%28GKEY%29&GRP1=AND+with+next+set&
        // SAB2=TTTTTT&BOOL2=all+of+these&FLD2=ISSN%2FISBN+%28ISSN%29&GRP2=AND+with+next+set&
        // SAB3=AAAAAA&BOOL3=all+of+these&FLD3=Author+%28NKEY%29&
	    var url = this.libraryCatalogURL + "/cgi-bin/Pwebrecon.cgi?HIST=1&CNT=25&DB=local&SL=None";
		for (var i = 0; i < fields.length; i++) {
			url += "&SAB" + (i+1) + "=" + fields[i].searchTerms + "&BOOL1=all+of+these&FLD" + (i+1) + "=" + this.convert2(fields[i].searchType);
            if (i < fields.length - 1) {
                url += "&GRP" + (i+1) + "=AND+with+next+set";
            }
		}
		return url;
	}
}

// vim: ts=4
