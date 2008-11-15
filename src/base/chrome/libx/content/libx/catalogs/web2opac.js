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
 * Contributor(s): Jared Whiklo whikloj@cc.umanitoba.ca
 *
 * ***** END LICENSE BLOCK ***** */

// contributed by whikloj@cc.umanitoba.ca - 2007-06-20
//

// Support for Sirsi Web2 OPAC
/**
 *	Sirsi Web2 OPAC Catalog Implementation
 *
 *	@name libx.catalog.Web2
 *	@augments libx.catalog.Catalog
 *	@private
 *	@constructor 
 *	@see Use libx.catalog.factory["web2"] to create a new instance
 */
libx.catalog.factory["web2"] = libx.core.Class.create(libx.catalog.Catalog, 
/** @lends libx.catalog.Web2.prototype */
{

    path: "/web2/tramp2.exe/do_keyword_search/log_in?guest=guest&",
    searchscope: 1,
    xisbn: { opacid: "sirsi6" },
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
	        case 'd':   return "SU";
	        case 'a':   return "AU";
            case 'jt':  return "PER";
	        case 't':   return "TI";
            case 'is':
	        case 'i':   //return ""; // maybe nothing will do better here? return "{022}";
	        case 'c':   //return ""; //                                    return "{050}";
	        case 'Y':   //return "&srchfield1=" + this.convert2(stype);
	        default:
	            return "default";
	    }
	},
	
	convert2: function (stype) {
	    switch (stype) {
            case 'd':   return "SU";
	        case 'a':   return "AU";
	        case 't':   return "TI";
	        case 'jt':  return "PER";
            case 'is': 
	        case 'i':  // return "GENERAL^SUBJECT^GENERAL^^keywords anywhere";    // ???
	        case 'Y':  // return "GENERAL^SUBJECT^GENERAL^^keywords anywhere";
	        case 'c':  // return "GENERAL^SUBJECT^GENERAL^^keywords anywhere";    // ???
	        default:
	            return "";
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
    // You can limit the search to a specific library
    scopeField: function (query) {
        if (this.searchscope != 1) {
            //return "&library=" + this.searchscope;
						return "&location_group_filter=" + this.searchscope;
        }
        return "";
    },
    // You can change the sort method
    sortField: function (query) {
        if (this.sort) {
            return "&sort_by=" + this.sort;
        }
        return "";
    },
	makeSearch: function(stype, sterm) {
        return this.url + this.path + "setting_key=" + this.setting_key + "&index=" + this.convert(stype) + "&servers=" + this.servers + "&query=" + encodeURIComponent(sterm) + this.scopeField() + this.sortField();
	},
	makeAdvancedSearch: function(fields) {
		var url = this.url + this.path + "setting_key=" + this.setting_key + "&servers=" + this.servers + "&index=default&query=";
		for (var i = 0; i < fields.length; i++) {
			url += "(" + this.convert2(fields[i].searchType) + " " + encodeURIComponent(fields[i].searchTerms) + ")";
			if (i < fields.length - 1) {
      	url += " AND ";
			}
		}
		return url + this.scopeField() + this.sortField();
	}
});

// vim: ts=4
