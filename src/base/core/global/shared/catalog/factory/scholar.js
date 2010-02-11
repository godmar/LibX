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
 * 	Google Scholar Catalog Implementation
 *	@name libx.catalog.factory.scholar
 *	@augments libx.catalog.Catalog
 *	@constructor 
 */
libx.catalog.factory["scholar"] = libx.core.Class.create( libx.catalog.Catalog, 
	/** @lends libx.catalog.factory.scholar.prototype */
	{

    options: "Y;at;jt;a",
    /**
     *	Constructs a search URL for Google Scholar
     */
    makeSearch: function (stype, sterm) {
        return this.makeAdvancedSearch([{searchType: stype, searchTerms: sterm}]);
    },
    makeAdvancedSearch: function (fields) {
        return this.libxScholarSearch(fields);
    },

    /*
     * Formulate a google scholar search from entered search fields
     * when user presses the Scholar button.
     */
    libxScholarSearch: function (fields) {
        var author = "";     // authors
        var keyword = "";     // keywords
        var atitle = "";    // article title
        var journaltitle = "";     // title (of journal)
        for (var i = 0; i < fields.length; i++) {
            switch (fields[i].searchType) {
            case 'a':
                author += fields[i].searchTerms + " ";
                break;
            case 'at':
                atitle += fields[i].searchTerms + " ";
                break;
            case 'Y':
            case 'i':
                keyword += fields[i].searchTerms + " ";
                break;
            case 't':
            case 'jt':
                journaltitle += fields[i].searchTerms;
                break;
            }
        }
        var query = "";
        if (keyword == "" && atitle != "") {
            // we cannot use allintitle: when keywords are given also
            query = "allintitle: " + atitle;
        } else {
            query = keyword + " " + atitle;
        }
        if (author != "") {
            query += " author:" + author;
        }

        var baseurl = 'http://scholar.google.com/scholar?hl=en&lr=';
        if (journaltitle) {
            baseurl += '&as_publication=' + encodeURIComponent(journaltitle);
        }
        return baseurl + '&q=' + encodeURIComponent(libx.utils.string.trim(query));
    }
});
