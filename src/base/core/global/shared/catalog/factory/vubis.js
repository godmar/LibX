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

/*
 * Michael Vandenburg <mvandenburg@kfpl.ca> contributed the URL format
 * Example catalogs:
 * 
 * http://catalog.volusialibrary.org/vcplvw/LinkToVubis.csp?Database=1&Language
 * =eng&SearchMethod=Find_1&SearchTerm=Rowling&Index=1*Authorbib
 *
 * http://catalogue.kfpl.ca/kfplvw/LinkToVubis.csp?Database=1&Language=eng&Sear
 * chMethod=Find_1&SearchTerm=Rowling&Index=1*Authorbib
 *
 * http://opac.kenosha.lib.wi.us/kenoshavw/LinkToVubis.csp?Database=1&Language=
 * eng&SearchMethod=Find_1&SearchTerm=Rowling&Index=1*Authorbib
 *
 * http://vubis.lewisandclarklibrary.org/lclvw/LinkToVubis.csp?Database=1&Langu
 * age=eng&SearchMethod=Find_1&SearchTerm=Rowling&Index=1*Authorbib
 *
 *
 * http://catalogue.kfpl.ca/kfplvw/List.csp?SearchTerm1=monster+of+Florence&Ind
 * ex1=1*Titlebib&Database=1&BoolOp2=AND&SearchTerm2=Preston&Index2=1*authorbib
 * &OpacLanguage=eng&NumberToRetrieve=50&SearchMethod=Find_4&&Profile=publicAcc
 * ess&PreviousList=Start&PageType=Start&WebPageNr=1&WebAction=NewSearch&StartV
 * alue=1&RowRepeat=1
 *
 * http://services.nflibrary.ca/niagvw/Vubis.csp
 *
 * Web Services API (SRU server)
 *
 * http://services.nflibrary.ca/niagvw/VubisSmartHttpAPI.csp?fu=BibSearch&Appli
 * cation=Bib&Database=1&Index=1*Keywordsbib&Language=eng&NumberToRetrieve=10&P
 * rofile=Default&RequestType=ResultSet_DisplayList&SearchTechnique=Find&StartV
 * alue=1&Request=harry%20potter
 */
// Support for Vubis OPAC

/**
 *	Vubis OPAC Catalog Implementation
 *
 *	@name libx.catalog.factory.vubis
 *	@augments libx.catalog.Catalog
 *	@class 
 */
libx.catalog.factory["vubis"] = libx.core.Class.create(libx.catalog.Catalog, 
/** @lends libx.catalog.factory.vubis.prototype */
{
    profile: 'Default',
    opaclanguage: 'eng',
    searchmethod: 'Find_1',
    authorindex: "1*Authorbib",
    keywordindex: "1*Keywordsbib",
    subjectindex: "1*Subjectbib",
    titleindex: "1*Titlebib",
    issnindex: "1*Issn",
    isbnindex: "1*Isbn",
    xisbn: { opacid: "vubis" },

	searchType2Index: function (stype) {
	    switch (stype) {
            case 'd':   return this.subjectindex;
            case 'a':   return this.authorindex;
            case 't':   return this.titleindex;
            case 'is':  return this.issnindex;
            case 'i':   return this.isbnindex;
            case 'Y':   return this.keywordindex;
            default:
                return this.keywordindex;
	    }
	},
	makeSearch: function(stype, sterm) {
        var url = this.url + this.path + "/LinkToVubis.csp?";
        url += "Database=1"
            + "&Language=" + this.opaclanguage
            + "&SearchTerm=" + encodeURIComponent(sterm) 
            + "&Index=" + this.searchType2Index(stype)
            + "&SearchMethod=" + this.searchmethod
            + "&Profile=" + this.profile;
        return url;
	},
	makeAdvancedSearch: function(fields) {
        var url = this.url + this.path + "/List.csp?";
        url += "SearchTerm1=" + encodeURIComponent(fields[0].searchTerms) 
                + "&Index1=" + this.searchType2Index(fields[0].searchType);
        url += "&Database=1";
		for (var i = 1; i < fields.length; i++) {
            url += "&BoolOp" + (i+1) + "=AND" 
                + "&SearchTerm" + (i+1) + "=" + encodeURIComponent(fields[i].searchTerms) 
                + "&Index" + (i+1) + "=" + this.searchType2Index(fields[i].searchType);
		}
		return url + 
            "&OpacLanguage=" + this.opaclanguage +
            "&NumberToRetrieve=50" +
            "&SearchMethod=" + this.searchmethod +
            "&Profile=" + this.profile +
            "&PreviousList=Start" +
            "&PageType=Start" +
            "&WebPageNr=1" +
            "&WebAction=NewSearch" +
            "&StartValue=1" +
            "&RowRepeat=1" +
            "&EncodedRequest=a";
	}
    // XXX may have to override makeXISBNRequest to send url+path along to xisbn.worldcat
});

// vim: ts=4
