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

// Support for Voyager7 OPAC
/**
 *	Voyager7 OPAC Catalog Implementation
 *
 *	@name libx.catalog.factory.voyager7
 *	@augments libx.catalog.Catalog
 *	@class 
 */
libx.catalog.factory["voyager7"] = libx.core.Class.create(libx.catalog.Catalog, 
/** @lends libx.catalog.factory.voyager7.prototype */
{
    count: 10,
    path: "/vwebv/search",
    limitto: "none",
    isbn: "ISBN",
    issn: "ISSN",
    subject: "SKEY",
    author: "NKEY",
    keyword: "GKEY",
    title: "TKEY",
    xisbn: { opacid: "webvoyager" },

	searchType2Index: function (stype) {
	    switch (stype) {
	        case 'd':   return this.subject;
	        case 'a':   return this.author;
	        case 't':   return this.title;
            case 'is':  return this.issn;
            case 'i':   return this.isbn;
	        case 'Y':   return this.keyword;
	        default:
                return this.keyword;
	    }
	},
	makeSearch: function(stype, sterm) {
        var url = this.url + this.path + "?";
        url += "searchArg=" + encodeURIComponent(sterm)
            + "&searchCode=" + this.searchType2Index(stype)
            + "&limitTo=" + this.limitto
            + "&recCount=" + this.count
            + "&searchType=1";
        return url;
	},
	makeAdvancedSearch: function(fields) {
        var url = this.url + this.path + "?";
        url += "searchArg1=" + encodeURIComponent(fields[0].searchTerms) 
                + "&argType1=any"
                + "&searchCode1=" + this.searchType2Index(fields[0].searchType);
		for (var i = 1; i < fields.length; i++) {
            url += "&combine" + (i+1) + "=and" 
                + "&searchArg" + (i+1) + "=" + encodeURIComponent(fields[i].searchTerms) 
                + "&argType" + (i+1) + "=any"
                + "&searchCode" + (i+1) + "=" + this.searchType2Index(fields[i].searchType);
		}
		return url
            + "&recCount=" + this.count
            + "&searchType=2";
	}
});

// vim: ts=4
