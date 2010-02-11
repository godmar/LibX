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

(function () 
{
// The following function is taken from http://www.lib.k-state.edu/js/input.js
// based on Dale Askey's suggestion

//Script to insert AND into keyword searches. Implemented 4/20/2006.
//Original source code is
//copyright Regents of the University of California 2004,
//picked up with modifications from Yale University in 2006 (thanks, Kalee).

//Now extensively modified and condensed by Harish Maringanti at Kansas
//State University, 2006. Specific modifications include adding the ability to
//handle hyphenated terms, e.g.-Levi-Strauss, as well as terms joined by an ampersand.

//Other changes address handling searches that include explicit MARC fields (e.g.- 100A)
//as well as those Voyager index names (e.g.- TKEY), even though we think that less than
//.00005% of humanity knows how to do those searches! While the UCLA/Yale versions address
//this, Harish significantly condensed the code.

//Code below copyright Kansas State University, 2006. We like to share, though, so
//just ask and it's yours.

// insertAND does the basic function of inserting AND between terms for a keyword
// search and handles:
// Characters like &, | , and, or, not; all case insensitive wherever applicable
// The hypenated strings are inserted in quotes. eg: levi-strauss => "levi-strauss"
// Parantheses are addressed: All above should hold good inside parantheses in
// addition to being insensitive to spaces between (,) & any strings.

// Sample queries:
// var s="One two \"three four\" five six";
// var s = "xml ( databases | levi-strauss ) & \"computer\"\"science\"";
//
function insertAND(s) {

    // handle the parenthesis cases, we are forcing a space between brackets and terms.
    s = s.replace(/(\(|\))/g," $1 ");

    // Pick out words from the input query. Treat phrases as a single word.
    // used [a-zA-Z0-9_-] instead of \w since we need -&?(),etc

    // Fix to allow diacritics in query
    // var r=/(\"[^"]*\"|[a-zA-Z0-9_\-\)\(\?\&\']+)/g;
    var r=/(\"[^"]*\"|\S+)/g;
    // end of diacritic fix
    s=s.replace(r,"$1#");
    var a=s.split("#");
    var len = a.length - 1;

    // str will have the new modified query
    var str = "";

    //pword is to indicate if 'AND' needs to be inserted for a particular word.
    // Eg: pword would be set for words such as and,or,not where in no 'AND' is needed.
    var pword = 0;

    // Parsing through each of the input words individually
    for(var i=0;i<len;i++){

        //Test for words starting with quotes
        if(a[i].match(/^\s*"/)){
            if(i == 0 || pword == 1){
                str = str + a[i];
                pword = 0;
            }
            else{
                str = str + " AND " + a[i];
            }
        }
        // Implies words with no quotes
        else {
            // Test if the word matches - and, or, not
            if (a[i].match(/^\s*and\s*$/i)){
                if (pword == 1) {}
                else {
                    str = str + "AND";
                    pword = 1;
                }
            }
            else if(a[i].match(/^\s*or\s*$/i)){
                if (pword == 1){}
                else {
                    str = str + "OR";
                    pword = 1;
                }
            }
            else if(a[i].match(/^\s*not\s*$/i)){
                str = str + "NOT";
                pword = 1;
            }
            // If & exists by itself then combine the pre & post terms and treat as a phrase
            else if(a[i].match(/&/)){
                str = str.replace(/\s*([a-zA-Z0-9_\-\(\)\?]+)\s+$/," \"$1");
                str = str + " & " + a[i+1] + "\" ";
                i++;
            }
            // Looking for some keywords
            else if (a[i].match(/(^\s*GKEY\s*$|^\s*IALL\s*$|^\s*ISBN\s*$|^\s*ISSN\s*$|^\s*JKEY\s*$|^\s*KPPD\s*$|^\s*LSUB\s*$|^\s*NKEY\s*$|^\s*NOTE\s*$|^\s*SERI\s*$|^\s*SKEY\s*$|^\s*TKEY\s*$|^\s*\d{3}[ABCKLNT]\s*$)/)) {
                if (pword == 1 || i == 0) {
                    str = str + a[i];
                }
                else {
                    str = str + " AND " + a[i];
                }
                pword = 1;
            }
            // Handling paranthesis
            else if(a[i].match(/\(/)){
                if(pword == 1 || i == 0) {
                    str = str + " (";
                }
                else {
                    str = str + " AND" + " (";
                    pword = 1;
                }
                if (i == 0) {
                    pword = 1;
                }
            }
            else if(a[i].match(/\)/)){
                str = str + ")";
                pword = 0;
            }
            // Look for hypenated terms and put them in quotes.
            else if(a[i].match(/-/)){
                if (pword == 1 || i == 0) {
                    str = str + "\"" + a[i] + "\"";
                    pword = 0;
                }
                else {
                    str = str + " AND " + "\"" + a[i] + "\"";
                }
            }
            // all other cases
            else {
                if(i == 0 || pword == 1){
                    str = str + a[i];
                    pword = 0;
                }
                else {
                    str = str + " AND " + a[i];
                }
            }
        } // Closing else for no quote words
        str = str + " ";
    }
    return str;
}


/**
 *	Voyager OPAC Catalog Implementation
 *	Based in part on http://www.mines.edu/library/catalyst/canned.html
 *
 *	@name libx.catalog.factory.voyager
 *	@augments libx.catalog.Catalog
 *	@class 
 */
libx.catalog.factory["voyager"] = libx.core.Class.create(libx.catalog.Catalog, 
/** @lends libx.catalog.factory.voyager.prototype */
{
    keyword: "FT*",     // default keyword index
    count: 25,          // default number of hits returned
    relevanceranking: true,     // by default, use relevance ranking for keyword
    xisbn: { opacid: "voyager" },
    __init: function () {
        // activate different keyword index for Dale Askey's fix
        if (this.autoinsertand) {
            this.keyword = "CMD";
            this.relevanceranking = false;
        }
    },
	convert: function (stype) {
	    switch (stype) {
	        case 'd':   return "SUBJ_";
	        case 'a':   return "NAME_";
	        case 't':   return "TALL";
	        case 'jt':  return "JALL";
            case 'is':  return "ISSN";
	        case 'i':   return "ISBN";
	        case 'c':   return "CALL_";
	        case 'Y':   return this.keyword;
	        default:
	            return this.keyword;
	    }
	},
	convert2: function (stype) {
	    switch (stype) {
	        case 'd':   return "Subject (SKEY)";
	        case 'a':   return "Author (NKEY)";
            case 'jt':
	        case 't':   return "Title (TKEY)";
            case 'is':
	        case 'i':   return "ISSN/ISBN (ISSN)";
	        case 'Y':   return "Keyword Anywhere (GKEY)";
	        case 'c':   return "?not supported?";
	        default:
	            return "not supported";
	    }
	},
	supportsSearchType: function (stype) {  // if voyager supports article title searches, adjust
	    if (stype == 'at') {
	        alert(libxGetProperty("articletitle.alert"));
			return false;
	    }
	    return true;
	},
	makeSearch: function(stype, sterm) {
        if (this.autoinsertand && stype == 'Y') {
            sterm = insertAND(sterm);
        }
        if (this.relevanceranking && stype == 'Y') {
            // + does "find all" as in Google; we assume the user wants this 
            sterm = sterm.replace(/^(\S)/, "+$1");
            sterm = sterm.replace(/\s+(\S)/g, " +$1");
        }
        if (this.advancedsearchforissn && stype == 'is') {
            return this.makeAdvancedSearch([{searchType: stype, searchTerms: sterm}]);
        } 
        sterm = encodeURIComponent(sterm);
        // order of fields seems to matter here (!??!)
        return this.url + "/cgi-bin/Pwebrecon.cgi?Search_Arg=" 
                    + sterm + "&HIST=1&SL=None&Search_Code="
                    + this.convert(stype) + "&CNT=" + this.count + "&DB=local";
	},
	makeAdvancedSearch: function(fields) {
        // https://gil.gatech.edu/cgi-bin/Pwebrecon.cgi?
        // SAB1=KKKKKK&BOOL1=all+of+these&FLD1=Keyword+Anywhere+%28GKEY%29&GRP1=AND+with+next+set&
        // SAB2=TTTTTT&BOOL2=all+of+these&FLD2=ISSN%2FISBN+%28ISSN%29&GRP2=AND+with+next+set&
        // SAB3=AAAAAA&BOOL3=all+of+these&FLD3=Author+%28NKEY%29&
	    var url = this.url + "/cgi-bin/Pwebrecon.cgi?HIST=1&CNT=25&DB=local&SL=None";
		for (var i = 0; i < fields.length; i++) {
			url += "&SAB" + (i+1) + "=" + encodeURIComponent(fields[i].searchTerms)
                + "&BOOL1=all+of+these&FLD" + (i+1) + "=" 
                + this.convert2(fields[i].searchType);
            if (i < fields.length - 1) {
                url += "&GRP" + (i+1) + "=AND+with+next+set";
            }
		}
		return url;
	}
});

})();
// vim: ts=4
