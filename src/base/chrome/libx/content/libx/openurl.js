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

/* OpenURL Resolver prototype 
 * 
 * Author: Annette Bailey <annette.bailey@gmail.com>
 *         Godmar Back <godmar@gmail.com>
 *
 * Most of OpenURL's functionality is standardized, such as the transport used to run
 * a OpenURL query against a resolver.  However, there are peculiarities: some resolvers
 * only support articles, some require certain fields.
 *
 * OpenURL.prototype contains properties that we expect to be common to all OpenURL
 * resolvers.  It is possible to create a usable OpenURL object.
 *
 * ArticleLinker and SFX are subclasses that inherit from OpenURL and provide
 * functionality specific to the Serials Solutions's Article Linker product
 * and the SFX product.
 */

function OpenURL() { }

// Functions shared by all openurl resolvers
OpenURL.prototype = {
    makeOpenURLFromFields: function(fields) {
	    var url = this.url + "?__char_set=utf8";
	    this.haveTitleOrIssn = false;
	    for (var i = 0; i < fields.length; i++) {
		    switch (fields[i].searchType) {
		    case 'doi':
                url += "&id=doi:" + fields[i].searchTerms;
                break;
		    case 'pmid':
                url += "&id=pmid:" + fields[i].searchTerms;
                break;
		    case 'jt':
		    case 't':
			    // replace removes everything that is not letter, digit, _, or whitespace
			    // and replaces multiple whitespaces with a single one
			    url += "&title=" + fields[i].searchTerms.replace(/[^A-Za-z0-9_\s]/g, " ").replace(/\s+/, " ");
			    this.haveTitleOrIssn = true;
			    break;
		    case 'at':
			    url += "&atitle=" + fields[i].searchTerms.replace(/[^A-Za-z0-9_\s]/g, " ").replace(/\s+/, " ");
			    break;
		    case 'i':
		    case 'is':
                var pureISN;
			    if (pureISN = isISSN(fields[i].searchTerms)) {
				    url += "&issn=" + pureISN;
			    } else {
				    alert(libxGetProperty("openurlissn.alert", [fields[i].searchTerms]));
				    return;
			    }
			    this.haveTitleOrIssn = true;
			    break;
		    case 'a':
			    var sterm = fields[i].searchTerms;
			    var hasComma = sterm.match(/,/);
			    sterm = sterm.replace(/[^A-Za-z0-9_\-\s]/g, " ");
			    var names = sterm.split(/\s+/);
			    if (names.length == 1) {// if author is single word, use as aulast field
				    url += "&aulast=" + names[0];
			    } else {// if author name is multiple words, see in which order to use fields
				    if (hasComma || names[names.length-1].match(/^[A-Z][A-Z]?$/i)) {// assume it is already last, first middle
					    url += "&aulast=" + names[0];
					    url += "&aufirst=" + names[1];
					    // XXX do not discard middle names/initials 2 and up
				    } else {
					    url += "&aulast=" + names[names.length-1];
					    url += "&aufirst=" + names[0];
					    // XXX do not discard middle names/initials 1 through names.length-2
				    }
				    // XXX investigate if we need to properly set auinit, auinit1, and auinitm here
				    // if authors first name is abbreviated
			    }
			    break;
		    case 'Y':
			    alert(libxGetProperty("openurlarticlekeyword.alert", 
                                    [this.name]));
			    return null;
			}//switch
	    }//for
        return this.addSid(url);
    },
    addSid: function (url) {
        /* append correct sid
         * to support flaky systems such as WB, which support only one global
         * identifier lookup per sid, we append a different sid
         * if this OpenURL contains a DOI if so configured.
         */
        if (this.pmidsid != null && url.match(/id=pmid:/i)) {
            url += "&sid=" + this.pmidsid;
        } else
        if (this.xrefsid != null && url.match(/id=doi:/i)) {
            url += "&sid=" + this.xrefsid;
        } else {
            url += "&sid=" + this.sid;
        }
        return url;
    },
    /* by default, we are adding "genre=article", but 
     * subclasses can change that. */
    makeOpenURLSearch: function(fields) {
        var path = this.makeOpenURLFromFields(fields);
        if (path != null)
            path += "&genre=article";
        return path;
    },
    makeOpenURLForISSN: function(issn) {
        return this.completeOpenURL("genre=journal&issn=" + issn);
    },
    makeOpenURLForDOI: function(doi) {
        return this.completeOpenURL("id=doi:" + doi);
    },
    makeOpenURLForPMID: function(pmid) {
        return this.completeOpenURL("id=pmid:" + pmid);
    },
    completeOpenURL: function(path) {
        var url = this.url + "?" + path;
        return this.addSid(url);
    },
    // implement searchable catalog functionality
    options: "jt",  // if used as a search catalog, show only Journal Title by default
    search: function (fields) {
        var url = this.makeOpenURLSearch(fields);
        if (url) {
            libxEnv.openSearchWindow(url);
        }
    }
}

// Initialize OpenURL support if so configured
function libxInitializeOpenURL() 
{
    libxConfig.resolvers = new Array();
    var resolvers = libxEnv.xpath.findNodes ( libxEnv.xmlDoc.xml, "/edition/openurl/*" );
    libxEnv.openUrlResolvers = new Object();
    for ( var i = 0; i < resolvers.length; i++ ) {
        
        var pnode = resolvers[i];
        var ourltype = pnode ? pnode.getAttribute("type") : null;
       
        switch (ourltype) {
        case "sersol":
            libxEnv.openUrlResolvers[i] = new ArticleLinker();
            break;
        case "sfx":
            libxEnv.openUrlResolvers[i] = new SFX();
            break;
        case "generic":
        case "webbridge":
            libxEnv.openUrlResolvers[i] = new OpenURL();
            break;
        default:
            libxEnv.writeLog("Unsupported OpenURL type: " + ourltype);
            /* FALLTHROUGH */
        case "":
        case null:
            libxEnv.openUrlResolvers[i] = null;
            return;
        }
        libxEnv.xmlDoc.copyAttributes(pnode, libxEnv.openUrlResolvers[i]);
        libxConfig.resolvers[libxEnv.openUrlResolvers[i].name] = libxEnv.openUrlResolvers[i];
    }
    libxEnv.openUrlResolver = libxEnv.openUrlResolvers[0];
}

// ---------------------------------------------------------------------------------
// Article Finder is a subclass of OpenURL
// 
function ArticleLinker() { }

// make ArticleLinker a "subclass" of OpenURL
// everything that's in OpenURL.prototype shall now be accessible via
// ArticleLinker.prototype.
ArticleLinker.prototype = new OpenURL();

// if used as a search catalog, show only Journal Title + ISBN/ISSN
ArticleLinker.prototype.options = "jt;i";

ArticleLinker.prototype.makeOpenURLSearch = function (fields) {
    // if the user specifies only the journal title/issn, use sersol's search function
    if (fields.length == 1) {
        var stype = fields[0].searchType;
        if (stype == 'jt') {
            // http://su8bj7jh4j.search.serialssolutions.com/?V=1.0&S=T_W_A&C=business
            return this.url + '?V=1.0&S=T_W_A&C=' + fields[0].searchTerms;
        }
        if (stype == 'is') {
            return this.url + '?V=1.0&S=I_M&C=' + fields[0].searchTerms;
        }
    }

    // super.makeOpenURLFromFields()
    var url = OpenURL.prototype.makeOpenURLSearch.call(this, fields);   
	/*if (this.haveTitleOrIssn != true) {
		alert(libxGetProperty("aftitleissn.alert", [this.name]));
		return null;
	}*/

	return url;
}

// ---------------------------------------------------------------------------------
// SFX is a subclass of OpenURL
// 
function SFX() { }

// make SFX a "subclass" of OpenURL
SFX.prototype = new OpenURL();

SFX.prototype.makeOpenURLSearch = function (fields) {
    // super.makeOpenURLFromFields()
    var url = OpenURL.prototype.makeOpenURLFromFields.call(this, fields);   
    if (url == null)
        return null;

    /* SFX appears to look at the genre when deciding how to interpret 
     * the other fields; also, it seems it supports searching for a
     * journal title using "contains"
     */
    var genre = "journal";
    for (var i = 0; i < fields.length; i++) {
        switch (fields[i].searchType) {
        case 'jt':
            url += "&sfx.title_search=contains";
            /* FALL THROUGH */
        case 'is':
        case 'i':
            url += "&sfx.ignore_date_threshold=1";
            break;
        case 'a':
            genre = "article";
            break;
        }
    }
    url += "&genre=" + genre;
	return url;
}

SFX.prototype.makeOpenURLForISSN = function (issn) {
    return this.makeOpenURLSearch([{ searchType: 'is', searchTerms: issn }]);
}

// vim: ts=4
