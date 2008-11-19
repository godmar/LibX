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
 *	Talis Prism OPAC Catalog Implementation
 *
 *	@name libx.catalog.factory.talisprism
 *	@augments libx.catalog.Catalog
 *	@class 
 */
libx.catalog.factory["talisprism"] = libx.core.Class.create(libx.catalog.Catalog, 
/** @lends libx.catalog.factory.talisprism.prototype */
{

    collections: "1",
    location: "talislms",
    sites: "-1",
    path: "/TalisPrism",
    callnumber: "classNumber",
    controlnr: "controlNumber",
    author: "author",
    keyword: "keyword",
    title: "title",
    xisbn: { opacid: "talisPrism" },

	searchType2Index: function (stype) {
	    switch (stype) {
	        case 'a':   return this.author;
	        case 't':   return this.title;
            case 'i':
            case 'is':  return this.controlnr;
            case 'c':   return this.callnumber;
	        case 'Y':   return this.keyword;
	        default:
                return this.keyword;
	    }
	},
	makeSearch: function(stype, sterm) {
        return this.makeAdvancedSearch([ { searchType: stype, searchTerms: sterm }]);
	},
	makeAdvancedSearch: function(fields) {
        var url = this.url + this.path + "/doSearch.do?";
        url += "searchCollections=" + this.collections
            +  "&searchSites=" + this.sites
            +  "&searchDates="
            +  "&searchType=" + "briefSearch"
		for (var i = 0; i < fields.length; i++) {
            url += "&st" + (i+1) + "=" + this.searchType2Index(fields[i].searchType)
                + "&sb" + (i+1) + "=And"
                + "&sv" + (i+1) + "=" + encodeURIComponent(fields[i].searchTerms); 
		}
        url += "&searchLocation=" + this.location;
		return url;
	}
});

// vim: ts=4
