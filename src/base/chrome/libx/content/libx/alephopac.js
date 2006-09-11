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

function AlephOPAC() { }

AlephOPAC.prototype = new libxCatalog();

libxAddToPrototype(AlephOPAC.prototype, {
	xisbn: { opacid: "aleph" },
    // unless specified otherwise, we use the scan index for 
    // title 't' & call number 'c'
    // we use the find index for the rest, that is
    // author 'a', keyword 'Y', isbn 'i' and issn 'is', and subject 'd'
    scanindexlist: "t;c",
	supportsSearchType: function (stype) {
	    if (stype == 'at') {
	        alert(libxGetProperty("articletitle.alert"));
			return false;
	    }
	    return true;
	},
    // escape spaces using + rather than %20
    escape: function(sterm) {
        return sterm.replace(/\s/g, "+");
    },
	searchCodeLookup: function(stype) {
		switch(stype) {
			case 'd':	return this.subject;
			case 'jt':	return this.journaltitle;
			case 't':	return this.title;
			case 'c':	return this.callno;
			case 'a':	return this.author;
			case 'Y': 	return this.keyword;
			case 'is': 	return this.issn;
			case 'i':	return this.isbn;
			default : return this.keyword;
		}
	},
	makeSearch: function(stype, query) {
		//split between heading indexes and straight keyword indexes
		//aleph handles then both the same way but displays them in different
		//ways.  
        var s = ";" + this.scanindexlist + ";";
        if (s.match(";" + stype + ";")) {
            return this.url + "/F?func=" 
                + this.scanfunc
                + (this.sid != null ? ("&sourceid=" + this.sid) : "")
                + "&local_base=" + this.localbase 
                + "&scan_code=" + this.searchCodeLookup(stype)
                + "&scan_start=" + this.escape(query);
        }

        // default
        return this.url + "/F?func="
            + this.findfunc 
            + (this.sid != null ? ("&sourceid=" + this.sid) : "")
            + "&local_base=" + this.localbase
            + "&find_code=" + this.searchCodeLookup(stype)
            + "&request=" + this.escape(query);
    },
	makeAdvancedSearch: function(fields) {
		//assumption that we're only doing AND sets.  
		var url = this.url + "/F?func="
				+ this.advfindfunc
				+ "&sourceid=" + this.sid
				+ "&local_base=" + this.localbase;
		url += "&find_code=" + this.searchCodeLookup(fields[0].searchType) 
			+ "&request=" + this.escape(fields[0].searchTerms);
		for (var i = 1; i < fields.length; i++) {
			url += "&request_op=AND&find_code=" 
				+ this.searchCodeLookup(fields[i].searchType) 
				+ "&request=" + this.escape(fields[i].searchTerms); 
		}
		return url;
	}
});

// vim: ts=4
