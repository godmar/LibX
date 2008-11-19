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
 *	Horizon Catalog Implementation
 *
 *	@name libx.catalog.factory.horizon
 *	@augments libx.catalog.Catalog
 *	@class 
 *	@see Use libx.catalog.factory["horizon"] to create a new instance
 */
libx.catalog.factory["horizon"] = libx.core.Class.create(libx.catalog.Catalog, 
/** @lends libx.catalog.factory.horizon.prototype */
{
    xisbn: { opacid: "ipac" },
    path: "/ipac20/ipac.jsp",
    /* default values for properties - 
       isbn and issn do not have default values */
    subject: ".SW",
    author: ".AW",
    keyword: ".GW",
    title: ".TW",
    journaltitle: ".JK",
    callno: "CALLLC",
	convert: function (stype) {
	    switch (stype) {
	        case 'd':   return this.subject;
	        case 'a':   return this.author;
	        case 't':   return this.title;
	        case 'jt':  return this.journaltitle;
	        case 'i':   return this.isbn;
	        case 'is':  return this.issn;
	        case 'c':   return this.callno;
	        case 'Y':   return this.keyword;
	        default:
	            return this.keyword;
	    }
	},
    // if/once horizon supports article title searches, adjust below
	supportsSearchType: function (stype) {  
	    if (stype == 'at') {
	        alert(libxGetProperty("articletitle.alert"));
			return false;
	    }
	    return true;
	},
	makeSearch: function(stype, sterm) {
	    return this.url + this.path + "?" 
            + (this.profile ? ("profile=" + this.profile + "&") : "")
	    + ((this.sid != null) ? "sid=" + this.sid + "&" : "")
            + "index=" + this.convert(stype) + "&term=" + encodeURIComponent(sterm);
	},
	makeAdvancedSearch: function(fields) {
	    var url = this.url + this.path + "?";
            url += (this.profile ? ("profile=" + this.profile + "&") : "");
            url += (this.sid ? ("sid=" + this.sid + "&") : "");
		url += "index=" + this.convert(fields[0].searchType) + "&term=" + encodeURIComponent(fields[0].searchTerms);
		for (var i = 1; i < fields.length; i++) {
			url += "&oper=and&index=" + this.convert(fields[i].searchType) + "&term=" + encodeURIComponent(fields[i].searchTerms);
		}
		return url;
	}
});

// vim: ts=4
