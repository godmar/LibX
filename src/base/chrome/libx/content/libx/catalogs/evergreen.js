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
 *	Evergreen Catalog Implementation
 *	Developed during Hackfest 2008
 *	with Grant Johnson and Dan Scott
 *
 *	@name libx.catalog.factory.evergreen
 *	@augments libx.catalog.Catalog
 *	@class 
 */
libx.catalog.factory["evergreen"] = libx.core.Class.create(libx.catalog.Catalog, 
/** @lends libx.catalog.factory.evergreen.prototype */
{
    locale: "en-US",        // default to en-US locale 
    skin: "default",        // default to 'default' skin
    scope: "",              // scope, default to 'empty'
    sortby: "",             // sortby, defaults to nothing (means relevance)
    sortdirection: "asc",   // sort direction
    xisbn: { opacid: "evergreen" },

	convert: function (stype) {
	    switch (stype) {
	        case 'Y':   return "keyword";
	        case 'i':   return "isbn";
	        case 'is':   return "issn";
	        case 'a':   return "author";
	        case 't':   return "title";
	        case 'd':   return "subject";
	        default:
	            return "keyword";
	    }
	},
    baseURL: function () {
        return this.url + "/opac/" + this.locale + "/skin/" + this.skin + "/xml/";
    },
    // rresult.xml is used for all but Call Number searches
    rresultBaseURL: function () {
        return this.baseURL()
                    + "rresult.xml" + "?"
                    + "l=" + this.scope
                    + "&s=" + this.sortby
                    + "&sd=" + this.sortdirection;
    },
	makeSearch: function(stype, sterm) {
        sterm = encodeURIComponent(sterm);
        switch (stype) {
        case 'c':
            return this.baseURL() 
                    + "cnbrowse.xml" + "?"
                    + "l=" + this.scope
                    + "&cn=" + sterm;
        case 'i':
        case 'is':
            return this.rresultBaseURL() 
                    + "&rt=" + this.convert(stype)
                    + "&adv=" + sterm;
        default:
            return this.rresultBaseURL() 
                    + "&rt=" + this.convert(stype)
                    + "&tp=" + this.convert(stype)
                    + "&t=" + sterm;
        }
	},
	makeAdvancedSearch: function(fields) {
        // combine all search fields that share same type
        var searchField2Term = this.combineSameTypedFields(fields);

        var url = this.rresultBaseURL() + "&rt=multi&tp=multi&adv=&t=";

        var combinedTerm = "";
		for (var ftype in searchField2Term) {
            combinedTerm += this.convert(ftype) + ":" + searchField2Term[ftype] + " ";
        }
        url += encodeURIComponent(combinedTerm);
		return url;
	}
});

// vim: ts=4
