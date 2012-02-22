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
 *  Sirsi OPAC Catalog Implementation
 *
 *  @name libx.catalog.factory.sirsi
 *  @augments libx.catalog.Catalog
 *  @class
 */
libx.catalog.factory["sirsi"] = libx.core.Class.create(libx.catalog.Catalog, 
/** @lends libx.catalog.factory.sirsi.prototype */
{

    path: "/uhtbin/cgisirsi/x/0/0/5/",
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
            case 'd':   return "&srchfield1=" + this.convert2(stype);
            case 'a':   return "&srchfield1=" + this.convert2(stype);
            case 'jt':
            case 't':   return "&srchfield1=" + this.convert2(stype);
            /* It's not clear what to place here. Up to 2/21/12 it was return ""
             *  mgoddard@calbaptist.edu suggests that for their installation, 'srchfield1' is required.
             * Historically, we had return "{022}"; here.
             */
            case 'is':
            case 'i':   return "&srchfield1=" + this.convert2(stype); 
            case 'c':   return ""; //                                    return "{050}";
            case 'Y':   return "&srchfield1=" + this.convert2(stype);
            default:
                return "";
        }
    },
    convert2: function (stype) {
        switch (stype) {
            case 'd':   return "SU^SUBJECT^SUBJECTS^^subject";
            case 'a':   return "AU^AUTHOR^AUTHORS^Author Processing^author";
            case 't':   return "TI^TITLE^TITLES^Title Processing^title";
            case 'jt':  return "PER^PERTITLE^TITLES^Title Processing^periodical title";
            case 'is': 
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
    // You can limit the search to a specific library
    scopeField: function (query) {
        if (this.searchscope != 1) {
            return "&library=" + this.searchscope;
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
    // Include user_id and password if given
    userId: function (query) {
        if (this.user_id) {
            return "&user_id=" + this.user_id 
                + "&password=" + ((this.password != null) ? this.password : "");
        }
        return "";
    },
    makeSearch: function(stype, sterm) {
        return this.url + this.path + "?searchdata1=" + encodeURIComponent(sterm) + this.convert(stype)
            + this.scopeField() + this.sortField() + this.userId();
    },
    makeAdvancedSearch: function(fields) {
        var url = this.url + this.path + "?";
        for (var i = 0; i < fields.length; i++) {
            url += "srchfield" + (i+1) + "=" + this.convert2(fields[i].searchType) 
                + "&searchdata" + (i+1) + "=" + encodeURIComponent(fields[i].searchTerms);
            if (i < fields.length - 1) {
                url += "&searchoper" + (i+1) + "=AND&";
            }
        }
        return url + this.scopeField() + this.sortField() + this.userId();
    }
});

// vim: ts=4
