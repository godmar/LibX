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

libx.catalog.factory["primo"] = libx.core.Class.create(libx.catalog.Catalog, 
/** @lends libx.catalog.factory.primo.prototype */
{
    
    xisbn: { opacid: "primo" },
    
	convert: function (stype) {
        /* XXX: these only apply to Waterloo, probably */
	    switch (stype) {
            case 'Y':  return "any";
            case 't':  return "title";
            case 'a':  return "creator";
            case 'd':  return "sub";
            case 'c':  return "lsr01";
            case 'ut': return "usertag";
            case 'i':  return "isbn";
            case 'is': return "issn";
            case 'p':  return "lsr03";
	    }
	},

	makeSearch: function(stype, sterm) {
        var url = this.url + this.path + "/action/search.do?fn=go&ct=search";
        url += "&vid=" + this.vid;
        url += "&mode=Basic";
        url += "&indx=0";
        url += "&dum=true";
        url += "&vl(freeText0)=" + encodeURIComponent(sterm);
        url += "&" + this.materialvar + "=" + this.defaultmaterial;
        url += "&vl(1UI0)=" + this.defaultsearchmode;
        url += "&" + this.searchvar + "=" + this.convert(stype);
        url += "&scps=" + this.scps;
        return url;
    },
    
    makeAdvancedSearch: function(fields) {
        var url = this.url + this.path + "/action/search.do?frbg=&ct=search&indx=1";
        for(var i = 0; i < fields.length; i++) {
            url += '&' + this['advsearchvar' + (i+1)] + '=' + this.convert(fields[i].searchType);
            url += '&' + 'vl(1UI' + i + ')=' + this.defaultsearchmode;
            url += '&' + 'vl(freeText' + i + ')=' + encodeURIComponent(fields[i].searchTerms);
        }
        url += '&' + this.langvar + '=' + this.defaultlanguage;
        url += '&mode=Advanced';
        url += '&vid=' + this.vid;
        url += '&scp.scps=' + this.scps;
        url += '&srt=' + this.defaultsort;
        url += '&tab=default_tab';
        url += '&dum=true';
        url += "&" + this.advmaterialvar + "=" + this.defaultmaterial;
        url += '&fn=search';
        url += '&' + this.datevar + '=' + this.defaultdaterange;
        return url;
    }
});

// vim: ts=4
