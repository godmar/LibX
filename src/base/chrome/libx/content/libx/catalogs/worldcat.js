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

// Support for Worldcat OPAC, including various Worldcat Local installs
/**
 *	Worldcat OPAC Support, including various WorldCat local installs
 *	
 *	@name libx.catalog.WorldCat
 *	@augments libx.catalog.Catalog
 *	@private
 *	@constructor 
 *	@see Use libx.catalog.factory["worldcat"] to create a new instance
 */
libx.catalog.factory["worldcat"] = libx.core.Class.create(libx.catalog.Catalog, 
/** @lends libx.catalog.WorldCat.prototype */
{

    xisbn: { opacid: "worldcat" },

	convert: function (stype) {
	    switch (stype) {
	        case 'Y':   return "kw";
	        case 'a':   return "au";
	        case 't':   return "ti";
	        default:
	            return "";
	    }
	},
    // see http://www.worldcat.org/links/default.jsp#embedsearch
    baseURL: function () {
        return this.url + "/search?qt=" + this.qt + "&q=";
    },
    // see http://www.worldcat.org/links/default.jsp#isbn
    specialBaseURL: function (what, id) {
        return this.url + "/" + what + "/" + id;
    },
	makeSearch: function(stype, sterm) {
        sterm = encodeURIComponent(sterm);
        switch (stype) {
        case 'Y':
            return this.baseURL() + sterm;
        case 'i':
            return this.specialBaseURL('isbn', sterm);
        case 'is':
            return this.specialBaseURL('issn', sterm);
        default:
            return this.baseURL() + this.convert(stype) + ":" + sterm;
        }
	},
	makeAdvancedSearch: function(fields) {
        // combine all search fields that share same type
        var searchField2Term = this.combineSameTypedFields(fields);

        var url = this.baseURL();

        var combinedTerm = "";
		for (var ftype in searchField2Term) {
            combinedTerm += this.convert(ftype) + ":" + searchField2Term[ftype] + " ";
        }
        url += encodeURIComponent(combinedTerm);
		return url;
	}
});

// vim: ts=4
