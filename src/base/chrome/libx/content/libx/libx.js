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
 * LibX toolbar extension
 *
 * Author: Annette Bailey <annette.bailey@gmail.com>
 */ 
const libx_version = "1.0.2";

var libxProps;          // a string bundle in the XUL file from which we read properties
var searchCatalogs;     // Array of search catalogs for drop-down search menu
var libraryCatalog;     // the library catalog object, see MilleniumOPAC for an example
                        // searchCatalogs[0] is libraryCatalog
var openUrlResolver;    // OpenURL resolver or null if no OpenURL support, see openurl.js
var libxProxy;          // Proxy object or null if no proxy support, see proxy.js
var libxOptions;        // an options objects

var libxSelectedCatalog;// currently selected search type
var libxSearchFieldVbox;    // global variable to hold a reference to vbox with search fields.
var libxDropdownOptions = new Object(); // hash for a bunch of XUL menuitems, keyed by search type
var popuphelper = new ContextPopupHelper();

// get a property, returning null if property does not exist
function libxGetProperty(prop, args) {
	try {
		if (args) {
		    return libxProps.getFormattedString(prop, args);
		} else {
		    return libxProps.getString(prop);
		}
	} catch (e) {
	    return null;
	}
}

// Base class for all catalogs
function libxCatalog() { }

libxCatalog.prototype = {
    makeSubjectSearch: function(subject) {
        return this.makeSearch("d", subject);
    },
    makeTitleSearch: function(title) {
        return this.makeSearch("t", title);
    },
    makeISBNSearch: function(isbn) {
        return this.makeSearch("i", isbn);
    },
    makeISSNSearch: function(isbn) {
        return this.makeSearch("is", isbn);
    },
    makeAuthorSearch: function(author) {
        return this.makeSearch("a", author);
    },
    makeCallnoSearch: function(callno) {
        return this.makeSearch("c", callno);
    },
    makeKeywordSearch: function(keyword) {
        return this.makeSearch("Y", keyword);
    },
    // Create a url that requests an item by ISBN from the xISBN service,
    // if the current catalog supports it
    makeXISBNRequest: function(isbn) {
        if (this.useOAIxISBN) {
            // jeff young from OCLC says to use this URL for libraries registered
            // with their service, see http://alcme.oclc.org/bookmarks/
            return "http://alcme.oclc.org/bookmarks/servlet/OAIHandler/extension"
                + "?verb=FRBRRedirect&identifier=" + this.useOAIxISBN
                + "&isbn=" + isbn;
        } else
        if (this.xisbnOPACID) {
            // xISBN barks at https URLs
            return "http://labs.oclc.org/xisbn/liblook?baseURL=" 
                + this.url.replace(/https/, "http")     
                + "&opacID=" + this.xisbnOPACID + "&isbn=" + isbn;
        } else {
            return this.makeISBNSearch(isbn);
        }
    },

    // given an array of {searchType: xxx, searchTerms: xxx } items
    // formulate a query against this catalog
    search: function (fields) {
        for (var i = 0; i < fields.length; i++) {
            if (!this.supportsSearchType(fields[i].searchType)) {
                return;
            }
        }	
        if (fields.length == 1) {//single search field
            var url = this.makeSearch(fields[0].searchType, fields[0].searchTerms);
            openSearchWindow(url);
        } else {// user requested multiple search fields, do advanced search
            var url = this.makeAdvancedSearch(fields);
            openSearchWindow(url);
        }
    }
}

function libxAddToPrototype(prototype, addedmethods) 
{
    for (var m in addedmethods) {
        prototype[m] = addedmethods[m];
    }
}

/*
 * Support generic "bookmarklet" style searches
 * The id's %t, %jt etc. in the URL are being replaced with the entered terms
 */
function libxBookmarklet(catprefix) { }

libxBookmarklet.prototype = new libxCatalog();

libxAddToPrototype(libxBookmarklet.prototype, {
    supportsSearchType: function (stype) {
        // alternatively, could check options
        return this.url.match("%" + stype);
    },
    makeSearch: function (stype, sterm) {
        return this.makeAdvancedSearch([{searchType: stype, searchTerms: sterm}]);
    },
    makeAdvancedSearch: function (fields) {
        var url = this.url;
        for (var i = 0; i < fields.length; i++) {
           url = url.replace("%" + fields[i].searchType, fields[i].searchTerms);
        }
        return url;
    }
});

/*
 * Construct a new catalog, return reference to it, based on settings
 * prefixed by catprefix (which is "" for primary catalog, "catalog1.", etc.)
 */
function libxInitializeCatalog(cattype, catprefix)
{
    var cat = null;
    switch (cattype) {
	case "bookmarklet":
        cat = new libxBookmarklet(catprefix);
        break;
	case "millenium":
		cat = new MilleniumOPAC(catprefix);
        break;
	case "horizon":
	    cat = new HorizonOPAC(catprefix);
        break;
	case "aleph":
	    cat = new AlephOPAC(catprefix);
        break;
	case "voyager":
	    cat = new VoyagerOPAC(catprefix);
        break;
	case "sirsi":
	    cat = new SirsiOPAC(catprefix);
        break;
	case "sersol":
	    cat = new ArticleLinker(catprefix);
        break;
	case "sfx":
	    cat = new SFX(catprefix);
        break;
    default:
		libxLog("Catalog type " + cattype + " not supported.");
    case null:
    case "":
        return null;
    }
    cat.url = libxGetProperty(catprefix + "catalog.url");
    cat.sid = libxGetProperty(catprefix + "catalog.sid");
    cat.name = libxGetProperty(catprefix + "catalog.name"); 
    var copt = libxGetProperty(catprefix + "catalog.options"); 
    if (cat.options == null)
        cat.options = copt;

    if (cat.options == null)
        cat.options = "Y;t;a;d;i;c";
    cat.urlregexp = new RegExp(libxGetProperty(catprefix + "catalog.urlregexp"));

    // override xisbn opac id if it's not the default
    var xisbn = libxGetProperty(catprefix + "catalog.xisbn.opacid");
    if (xisbn) {
        cat.xisbnOPACID = xisbn;
    }
    cat.prefix = catprefix;
    var oai = libxGetProperty(catprefix + "catalog.xisbn.oai");
    if (oai != "")
        cat.useOAIxISBN = oai;

    libxLog("registered " + cat.name + " (type=" + cattype + ")");
    return cat;
}

// initialize the catalogs we'll use, including the 
// default library catalog
function libxInitializeCatalogs() 
{
    searchCatalogs = new Array();
    var cattype = libxGetProperty("catalog.type");
    libraryCatalog = libxInitializeCatalog(cattype, "");
    searchCatalogs.push(libraryCatalog);

    // we insert additional catalogs before the openurl button for now
    var catdropdown = document.getElementById("libxcatalogs");
    var openurlsbutton = document.getElementById("libx-openurl-search-menuitem");

    for (var addcat = 1; 
         (cattype = libxGetProperty("catalog" + addcat + ".catalog.type")) != null; 
         addcat++)
    {
        var cat = libxInitializeCatalog(cattype, "catalog" + addcat + ".");
        searchCatalogs.push(cat);

        var newbutton = document.createElement("menuitem");
        newbutton.setAttribute("oncommand", "libxSelectCatalog(this,event);");
        newbutton.setAttribute("value", addcat);
        newbutton.setAttribute("label", "Search " + libxGetProperty("catalog" + addcat + ".catalog.name") + " ");
        catdropdown.insertBefore(newbutton, openurlsbutton);
    }

    // record initially selected catalog and activate its search options
    catdropdown.firstChild.value = 0;  
    libxSelectedCatalog = searchCatalogs[0];
    libxActivateCatalogOptions(libxSelectedCatalog);

    // copy initial label to toolbarbutton parent from menuitem first child
    catdropdown.firstChild.setAttribute("label", "Search " + libraryCatalog.name + " ");
    catdropdown.parentNode.label = catdropdown.firstChild.label;
}

// Initialize OpenURL support if so configured
function libxInitializeOpenURL() 
{
/*
    var configurl = new XMLHttpRequest();
    configurl.open('GET', "chrome://libx/content/config.xml", false);
    configurl.send(null);
    var config = configurl.responseXML;
    var openurls = xpathFindNodes(config, "/edition/openurl/resolver");
    libxLog("# of openurl configured: " + openurls.length);
    var ourltype = openurls[0].getAttribute('type');
*/
	var ourltype = libxGetProperty("openurl.type");
    var openurlsbutton = document.getElementById("libx-openurl-search-menuitem");
    switch (ourltype) {
    case "sersol":
	    openUrlResolver = new ArticleLinker();
        break;
    case "sfx":
	    openUrlResolver = new SFX();
        break;
    case "generic":
    case "webbridge":
	    openUrlResolver = new OpenURL();
        break;
    default:
        libxLog("Unsupported OpenURL type: " + ourltype);
        /* FALLTHROUGH */
    case "":
    case null:
        openUrlResolver = null;
        openurlsbutton.hidden = true;
        return;
    }

    openUrlResolver.type = ourltype;
    openUrlResolver.url = libxGetProperty("openurl.url");
    openUrlResolver.sid = libxGetProperty("openurl.sid");
    openUrlResolver.name = libxGetProperty("openurl.name");
    openUrlResolver.version = libxGetProperty("openurl.version");
    openUrlResolver.autolinkissn = libxGetProperty("openurl.autolinkissn");
    var copt = libxGetProperty("openurl.options");
    if (copt != null)
        openUrlResolver.options = copt;

    if (libxGetProperty("openurl.dontshowintoolbar") == "true") {
        openurlsbutton.hidden = true;
    }

    var searchlabel = libxGetProperty("openurl.searchlabel");
    if (searchlabel == null)
        searchlabel = "Search " + openUrlResolver.name;
    openurlsbutton.setAttribute("label", searchlabel);
}

// Initialize options
function libxInitializeOptions()
{
    libxOptions = new Object();
    libxOptions.sersolisbnfix = libxGetProperty("libx.sersolisbnfix");
    libxOptions.supportcoins = libxGetProperty("libx.supportcoins");
    libxOptions.rewritescholarpage = libxGetProperty("libx.rewritescholarpage");
    libxOptions.autolink = libxGetProperty("libx.autolink");
    libxOptions.autolinkstyle = libxGetProperty("libx.autolinkstyle");
    if (!libxOptions.autolinkstyle)
        libxOptions.autolinkstyle = "1px dotted";
        
}

// Initialization - this code is executed when extension is loaded
function libxInit() 
{
	// this function is called after the entire overlay has been built
	// we must wait until here before calling document.getElementById
	libxProps = document.getElementById("libx-string-bundle");

    // initialize menu at top left of toolbar
    // these are now additional properties:
    // link1.label=...
    // link1.url=...
    // and so on.
    var libxmenu = document.getElementById("libxmenu");
    var libxmenusep = document.getElementById("libxmenu.separator");
    var label = null;
    for (var link = 1;
            (label = libxGetProperty("link" + link + ".label")) != null;
            link++) 
    {
        var url = libxGetProperty("link" + link + ".url");
        var mitem = document.createElement("menuitem");
        mitem.setAttribute("label", label);
        mitem.setAttribute("oncommand", "openSearchWindow('" + url + "');");
        libxmenu.insertBefore(mitem, libxmenusep);
    }

	libxSearchFieldVbox = document.getElementById("search-field-vbox");
	var ddOptions = document.getElementById("libx-dropdown-menupopup");
    for (var i = 0; i < ddOptions.childNodes.length; i++) {
        var d = ddOptions.childNodes.item(i);
        libxDropdownOptions[d.value] = d;
    }

    libxInitializeOptions();
    libxInitializeOpenURL();    
    libxInitializeCatalogs();
	libxProxyInit();
    libxInitializeAutolink();
	libxInitializeDFU();
	
	var menu = document.getElementById("contentAreaContextMenu");
    menu.addEventListener("popupshowing", libxContextPopupShowing, false);
    new TextDropTarget(magicSearch).attachToElement(document.getElementById("libx-magic-button"));
    libxInitializePreferences("libx.displaypref");
}

/*
 * initialize/record a change in preference
 * We assume 
 * - that properties are choices offered in a menupopup wrapping menuitems
 * - that the name of the property is also the id of the surrounding menupopup
 * - that the name of the value is also the id of the menuitem child reflecting the choice
 */
function recordPreference(property, value)
{
    var parent = document.getElementById(property);
    for (var i = 0; i < parent.childNodes.length; i++) {
        parent.childNodes.item(i).setAttribute('checked', parent.childNodes.item(i).getAttribute('id') == value);
    }
    nsPreferences.setUnicharPref(property, value);
}

function libxInitializePreferences(property)
{
    var menuchild = nsPreferences.getLocalizedUnicharPref(property, "libx.newtabswitch");
    document.getElementById(menuchild).setAttribute("checked", true);
}

//this function is called right before the right click context menu is shown
//in this function we must adjust the hidden attributes of the context menu items we would like the user to see
function libxContextPopupShowing() {
	var isbnsearch = document.getElementById("libx-isbn-search");
	var keywordsearch = document.getElementById("libx-keyword-search");
	var titlesearch = document.getElementById("libx-title-search");
	var authorsearch = document.getElementById("libx-author-search");
	var xisbnsearch = document.getElementById("libx-xisbn-search");
	var openurlissnsearch = document.getElementById("libx-openurl-issn-search");
	var doisearch = document.getElementById("libx-doi-search");
	var pmidsearch = document.getElementById("libx-pmid-search");
	var libxproxify = document.getElementById("libx-proxify");
	var scholarsearch = document.getElementById("libx-magic-search");
	//conservatively assume no button is shown
	keywordsearch.hidden = titlesearch.hidden = authorsearch.hidden = true;
	isbnsearch.hidden = xisbnsearch.hidden = true;
	openurlissnsearch.hidden = doisearch.hidden = pmidsearch.hidden = true;
	scholarsearch.hidden = true;
	
    if (libxProxy) {
        // activate proxify link whenever user right-clicked over hyperlink
        if (popuphelper.isOverLink()) {
            libxproxify.label = libxGetProperty("proxy.follow.label", [libxProxy.name]);
        } else {
            libxproxify.label = libxGetProperty("proxy.reload.label", [libxProxy.name]);
        }
    }
            
    var openurlName = openUrlResolver ? openUrlResolver.name : null;
	pureISN = null;//forget pureISN
	pureDOI = null;//forget pureDOI
	purePMID = null;//forget purePMID
	if (!popuphelper.isTextSelected()) {//no selection
		keywordsearch.hidden = titlesearch.hidden = authorsearch.hidden = false;
        keywordsearch.label = libxGetProperty("contextmenu.keywordsearch.label", [libraryCatalog.name]);
        titlesearch.label = libxGetProperty("contextmenu.titlesearch.label", [libraryCatalog.name]);
        authorsearch.label = libxGetProperty("contextmenu.authorsearch.label", [libraryCatalog.name]);

		if (popuphelper.isOverLink()) {
			pureDOI = isDOI(decodeURI(popuphelper.getNode().href));//does href of hyperlink over which user right-clicked contain a doi?
			if (pureDOI != null && openUrlResolver) {
				doisearch.label = libxGetProperty("openurldoisearch.label", [openurlName, pureDOI]);
				doisearch.hidden = false;
			}
		}
		return;// skip rest of function
	}
	//end of no selection, code below assumes there is a selection
	//check selection for ISBN or ISSN or DOI and activate appropriate menuitems
	var s = popuphelper.getSelection();
	if (pureISN = isISBN(s)) {
		isbnsearch.label = libxGetProperty("isbnsearch.label", [libraryCatalog.name, pureISN]);
		xisbnsearch.label = libxGetProperty("xisbnsearch.label", [pureISN]);
		isbnsearch.hidden = false;
		if (libraryCatalog.xisbnOPACID) {   // only true if xISBN is supported for this catalog
		    xisbnsearch.hidden = false;
		}
	} else
	if (pureISN = isISSN(s)) {
		isbnsearch.label = libxGetProperty("issnsearch.label", [libraryCatalog.name, pureISN]);
		isbnsearch.hidden = false;
		if (openUrlResolver) {
		    openurlissnsearch.label = libxGetProperty("openurlissnsearch.label", [openurlName, pureISN]);
		    openurlissnsearch.hidden = false;
		}
	}

    if (openUrlResolver) {
        purePMID = isPMID(s);
    }
	if (purePMID != null) {
		pmidsearch.label = libxGetProperty("openurlpmidsearch.label", [openurlName, purePMID]);
		pmidsearch.hidden = false;
	}

    // show keyword, title, author only if none of IS*N or PMID was recognized
	if (pureISN == null && purePMID == null) {
		keywordsearch.hidden = titlesearch.hidden = authorsearch.hidden = false;
		scholarsearch.hidden = false;
        keywordsearch.label = libxGetProperty("contextmenu.keywordsearch.label", [libraryCatalog.name]);
        titlesearch.label = libxGetProperty("contextmenu.titlesearch.label", [libraryCatalog.name]);
        authorsearch.label = libxGetProperty("contextmenu.authorsearch.label", [libraryCatalog.name]);
    }

    // DOI displays in addition to keyword, title, author
	pureDOI = isDOI(s);
	if (pureDOI != null && openUrlResolver) {
		doisearch.label = libxGetProperty("openurldoisearch.label", [openurlName, pureDOI]);
		doisearch.hidden = false;
	}
}

// does this selection contain a pubmed id?
function isPMID(s) {
	var m = s.match(/PMID[^\d]*(\d+)/i);
    if (m != null) {
        return m[1];
    }
    m = s.match(/PubMed\s*ID[^\d]*(\d+)/i);
    if (m != null) {
        return m[1];
    }
    return null;
}

// run a search against Scholar from the current selection
function doMagicSearchBySelection() {
	var s = popuphelper.getSelection();
	magicSearch(s);
}

// output a message to the JS console
function libxLog(msg) {
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage("LibX: " + msg);
}

// open search results, according to user preferences
function openSearchWindow(url) {
    var what = nsPreferences.getLocalizedUnicharPref("libx.displaypref", "libx.newtabswitch");
    switch (what) {
    case "libx.newwindow":
	    window.open(encodeURI(url));
        break;
    case "libx.sametab":
		_content.location.href = url;
        break;
    case "libx.newtab":
    default:
	    getBrowser().addTab(encodeURI(url));
        break;
    case "libx.newtabswitch":
	    var tab = getBrowser().addTab(encodeURI(url));
        getBrowser().selectedTab = tab;
        break;
    }

/* fix this later should it be necessary - so far, we were able to get at every catalog via GET
   this code is intended should POST be necessary in the future.
*/
//    if (typeof url == "string") {
//	    getBrowser().addTab(encodeURI(url));
//	} else
//   if (url.constructor.name == "Array") {  // for catalog that require POST - UNTESTED code
//	    getBrowser().addTab(encodeURI(url[0]), null, null, /*aPostData*/url[1]);
//    }
}


//this function is called if the user presses the search button, 
//it performs a search in the catalog which the user previously selected
function doSearch() {
	var fields = extractSearchFields();
    if (!libxSelectedCatalog.search)
        alert("Internal error, invalid catalog object: " + libxSelectedCatalog);
    libxSelectedCatalog.search(fields);
}

/*
 * Formulate a google scholar search from entered search fields
 * when user presses the Scholar button.
 */
function doMagicSearch() {
	var fields = extractSearchFields();
	var a = "";     // authors
	var k = "";     // keywords
	var at = "";    // article title
	var t = "";     // title (of journal)
	for (var i = 0; i < fields.length; i++) {
		switch (fields[i].searchType) {
		case 'a':
			a += fields[i].searchTerms + " ";
			break;
		case 'at':
			at += fields[i].searchTerms + " ";
			break;
		case 'Y':
		case 'i':
			k += fields[i].searchTerms + " ";
			break;
		case 't':
		case 'jt':
			t += fields[i].searchTerms + " ";
			break;
		}
	}
	var q = "";
	if (k == "" && at != "") {
	    // we can't use allintitle: when keywords are given also
		q = "allintitle: " + at;
	} else {
		q = k + " " + at;
	}
	if (a != "") {
		q += " author: " + a;
	}
	magicSearch(q, t, true);    // true means suppress heuristics
}

// This function is called for the "Search Addison Now!" right-click
// menu entries.
function doSearchBy(stype) {
	if (!popuphelper.isTextSelected()) {
		alert(libxGetProperty("selectterm.alert"));
		return;
	}
	var sterm = popuphelper.getSelection();
	var hasComma = sterm.match(/,/);
	
	// clean up search term by removing unwanted characters
    // should leave &, and single apostrophe in - what about others?
	// and replaces multiple whitespaces with a single one
	sterm = sterm.replace(/[^A-Za-z0-9_&:\222\'\-\s]/g, " ").replace(/\s+/g, " ");
	// split author into names, turns "arthur conan doyle" into ["arthur", "conan", "doyle"]
	var names = sterm.split(/\s+/);
	// switch author's first and last name unless there's a comma or the last name is an initial
	if (stype == "a" && !hasComma && !names[names.length-1].match(/^[A-Z][A-Z]?$/i)) {
		sterm = names[names.length-1] + " " + names.slice(0,names.length-1).join(" ");
		// creates "doyle arthur conan"
	}

    // if this is an ISSN, but not a ISBN, change searchtype to 'is'
	if (stype == 'i') {
	    sterm = pureISN;
        if (!isISBN(pureISN) && isISSN(pureISN)) {
            stype = 'is';
        }
	}
		
	// create a makeshift array of a single element - we do this solely 
	// to be able to reuse the "doCatalogSearch" function which expects an array
	// of objects with a searchType/searchTerms property each.
	libraryCatalog.search([{searchType: stype, searchTerms: sterm}]);	
}

// use OCLC's xisbn's search
// XXX investigate processing these results better - otherwise the user has to click through
// dozens or more results
function doXisbnSearch() {
	openSearchWindow(libraryCatalog.makeXISBNRequest(pureISN)); 
}

// this function is called if the user right-clicks and an ISSN was previously
// detected in the selection.  It will pass that ISSN to Article Finder to get an
// appropriate copy
function doOpenurlSearchByISSN() {
	var openUrlByIssn = openUrlResolver.makeOpenURLForISSN(pureISN);
	openSearchWindow(openUrlByIssn);
}

// this function is called if the user right-clicks and a DOI was previously
// detected either in the selection or in a href-link
// It will pass that DOI to Article Finder to get an appropriate copy
function doDoiSearch() {
	var openUrlByDoi = openUrlResolver.makeOpenURLForDOI(pureDOI);
	openSearchWindow(openUrlByDoi);
}

function doPmidSearch() {
	var openUrlByPmid = openUrlResolver.makeOpenURLForPMID(purePMID);
	openSearchWindow(openUrlByPmid);
}

/*
 * This function is called when the user hits reload this page/follow a link
 * through the proxy.  
 */
function libxProxify() {
    // this function should not be called if no proxy is defined
    if (libxProxy == null) {
        alert("no proxy defined");
        return;
    }

	if (popuphelper.isOverLink()) {
		var href = popuphelper.getNode().href;
		openSearchWindow(libxProxy.rewriteURL(href));
    } else {
		_content.location.href = libxProxy.rewriteURL(_content.location.toString());
    }
}

/*
 * Initialize proxy support.
 */
function libxProxyInit() {
	var proxytype = libxGetProperty("proxy.type");
    switch (proxytype) {
    case "ezproxy":
		libxProxy = new libxEZProxy();
        break;
    case "wam":
		libxProxy = new libxWAMProxy();
        break;
    default:
		libxLog("Unsupported proxy.type=" + proxytype);
        /* FALLTHROUGH */
    case null:
    case "":
        // hide proxy entry in context menu if no proxy is defined
		var libxproxify = document.getElementById("libx-proxify");
		libxproxify.hidden = true;
        return;
	}
    libxProxy.name = libxGetProperty("proxy.name");
    libxProxy.url = libxGetProperty("proxy.url");
    libxProxy.type = proxytype;
}

// for all catalogs transfer search field contents into 'fields' array
// and return this array
function extractSearchFields() {
	var fields = new Array();
	for (var i = 0; i < libxSearchFieldVbox.childNodes.length; i++) {// iterate over all search fields
		var f = libxSearchFieldVbox.childNodes.item(i);
		if (f.firstChild.value == null) f.firstChild.value = "Y";
		//alert(f.firstChild.value + " " + f.firstChild.label + " " + f.firstChild.nextSibling.firstChild.value);
		var field = {searchType: f.firstChild.value, searchTerms: f.firstChild.nextSibling.firstChild.value};
        if (field.searchType == 'i' && isISSN(field.searchTerms) && !isISBN(field.searchTerms)) {
            field.searchType = 'is';
        }
		fields.push(field);
	}
	return fields;
}

// this function is called when the user switches the search field type for a given search field
function setFieldType(menuitem) {
	//propagate label and value of menuitem to grandparent (toolbarbutton)
	menuitem.parentNode.parentNode.label = menuitem.label;
	menuitem.parentNode.parentNode.value = menuitem.value;
}

// switch the current search type (addison, openurl, etc.)
function libxSelectCatalog(mitem, event) {
	event.stopPropagation();

/*
<vbox id="search-field-vbox" flex="1">
    <hbox id="search-field-hbox"> <!-- this element is being cloned when user selects the down button -->
    <!-- child number 0 aka firstChild -->
    <toolbarbutton label="Keyword" ...
    <menupopup id="libx-dropdown-menupopup">
        <menuitem value="Y" label="Keyword" oncommand="setFieldType(this)
*/
	var sb = document.getElementById("search-button");
	sb.label = mitem.label;
    if (mitem.value == "openurl")
        libxSelectedCatalog = openUrlResolver;
    else
        libxSelectedCatalog = searchCatalogs[mitem.value];

    libxActivateCatalogOptions(libxSelectedCatalog);
}

/*
 * adjust drop-down menus based on catalog.options
 */
function libxActivateCatalogOptions(catalog) {
    var opt = catalog.options.split(/;/);
    // for each open search field
	for (var i = 0; i < libxSearchFieldVbox.childNodes.length; i++) {
		var f = libxSearchFieldVbox.childNodes.item(i);
        var tbb = f.firstChild;
        var oldvalue = tbb.value;   // try to retain old selection
        var newvalue = null;
        var mpp = tbb.firstChild;
        // clear out the old ones
        while (mpp.childNodes.length > 0)
            mpp.removeChild(mpp.firstChild);
        // clone in the new ones
        for (var j = 0; j < opt.length; j++) {
            var ddo = libxDropdownOptions[opt[j]];
            var mitem = ddo.cloneNode(true);
            // cloneNode doesn't clone the attributes !?
            mitem.value = ddo.value;
            mitem.label = ddo.label;
            if (oldvalue == mitem.value)
                newvalue = mitem;
            mpp.appendChild(mitem);
        }
        if (newvalue != null)
            setFieldType(newvalue);         // recreate prior selection
        else
            setFieldType(mpp.firstChild);   // pick first entry the default
    }
}

// add and remove search fields.
// we do this by cloning or removing the last search field child
// the blue "add-field" button, child #2, is disabled for all children except the last
// the red "close-field" button, child #3, is enabled for all children except the first
// these function all depend intimately on the XUL used for the vbox/hbox search field stuff
function addSearchField() {
	var lastSearchField = libxSearchFieldVbox.lastChild;// get bottom search field
	var newSearchField = lastSearchField.cloneNode(true);// clone last search field and all its descendants
	lastSearchField.childNodes.item(2).disabled=true;// disable blue "add-field" button in what will be the next-to-last searchfield
	if (libxSearchFieldVbox.childNodes.length == 1) { // tests if only one search field is currently visible
		lastSearchField.childNodes.item(3).disabled=false; // OPTIONAL: show close button in first search field
		newSearchField.childNodes.item(3).disabled=false; // if so, the second field must have the close button enabled
	}
	newSearchField.firstChild.nextSibling.firstChild.value = "";
	libxSearchFieldVbox.appendChild(newSearchField);
	// return reference to new textbox so caller can move focus there
	return newSearchField.firstChild.nextSibling.firstChild;
}

// remove a specific search field
// user must pass reference to hbox of search field to be removed
function removeSearchField(fieldHbox) {
	libxSearchFieldVbox.removeChild(fieldHbox);
	var lastSearchField = libxSearchFieldVbox.lastChild;// get bottom search field
	lastSearchField.childNodes.item(2).disabled=false;// enable blue "add-field" button
	if (libxSearchFieldVbox.childNodes.length == 1) { // disable close button if only one search field 
	    lastSearchField.childNodes.item(3).disabled=true;
	}
}

function clearAllFields() {
	// while there are more than one search field left, remove the last one
	while (libxSearchFieldVbox.childNodes.length > 1) {
		removeSearchField(libxSearchFieldVbox.lastChild);
	}
	// finally, clear the content of the only remaining one
	libxSearchFieldVbox.firstChild.firstChild.nextSibling.firstChild.value = "";
}

// copy selection into search field - this is called from the nested right-click menu
function addSearchFieldAs(mitem) {
	if (!popuphelper.isTextSelected()) {
		alert(libxGetProperty("selectterm.alert"));
		return;
	}
	var sterm = popuphelper.getSelection();
	
	//XXX investigate if we should pretreat sterm
	for (var i = 0; i < libxSearchFieldVbox.childNodes.length; i++) {// iterate over all search fields and find and use the first empty one
		var tbb = libxSearchFieldVbox.childNodes.item(i).firstChild;//toolbarbutton in hbox of search field
		if (tbb.nextSibling.firstChild.value == "") {//is this field empty - use it if so
			tbb.value = mitem.value;
			tbb.label = mitem.label;
			tbb.nextSibling.firstChild.value = sterm;
			return;
		}
	}
	//have found no empty field, must add one
	addSearchField();
	//try again - this time around there should be an empty field
	addSearchFieldAs(mitem);
}

function aboutVersion() {
   window.openDialog("chrome://libx/content/about.xul", "About...", "centerscreen,chrome,modal,resizable", libx_version, libxGetProperty("edition"));
}

/* Definition of autolink filters.
 *
 * Order matters, if a regexp match supercedes another, the subsequent
 * matches's href function is not called, even if no superceding one
 * returned null - fix this?
 */
var libxAutoLinkFilters = [
    {   // Pubmed IDs, form PMID... 
        regexp: /PMID[^\d]*(\d+)/ig,
        href: function(match) { 
            if (!openUrlResolver) return null;
            var pmid = match[1];
            this.name = libxGetProperty("openurlpmidsearch.label", [openUrlResolver.name, pmid]);
            return openUrlResolver.makeOpenURLForPMID(pmid);
        }
    },
    {   // DOIs
        regexp: /(10\.\S+\/[^\s,;\"\']+)/ig,
        href: function(match) { 
            if (!openUrlResolver) return null;
            var doi = isDOI(match[1]); 
            if (doi == null) return null;
            this.name = libxGetProperty("openurldoisearch.label", [openUrlResolver.name, doi]);
            return openUrlResolver.makeOpenURLForDOI(doi);
        }
    },
    {   // ISBNs
        regexp: /\#?((97[89])?((-)?\d(-)?){9}[\dx])/ig,
        href: function(match) { 
            var isbn = isISBN(match[1]); 
            if (isbn == null) return null;
            this.name = libxGetProperty("isbnsearch.label", [libraryCatalog.name, isbn]);
            return libraryCatalog.makeISBNSearch(isbn);
        }
    },
    {   // ISSNs
        regexp: /\#?((\d(-)?){7}[\dx])/ig,
        href: function(match) { 
            var issn = isISSN(match[1]); 
            if (issn == null) return null;
            if (openUrlResolver && openUrlResolver.autolinkissn) {
                this.name = libxGetProperty("openurlissnsearch.label", [openUrlResolver.name, issn])
                return openUrlResolver.makeOpenURLForISSN(issn);
            } else {
                this.name = libxGetProperty("issnsearch.label", [libraryCatalog.name, issn]);
                return libraryCatalog.makeSearch('is', issn);
            }
        }
    },
];

function libxRunAutoLink(document, rightaway) 
{
    libxAutoLink(_content.window, document, libxAutoLinkFilters, rightaway);
}

function libxSelectAutolink(value)
{
    value = (value == "true") ? true : false;   // convert string to bool
    nsPreferences.setBoolPref("libx.autolink", value);
    libxOptions.autolink_active = value;
    if (value)
        libxRunAutoLink(_content.document, true);
}

function libxInitializeAutolink()
{
    if (!libxOptions.autolink)
        return;

    var hbox = document.getElementById("libx-about");
    var m = document.createElement("menuitem");
    m.setAttribute('type', 'checkbox');
    m.setAttribute('label', 'Autolink Pages');
    libxOptions.autolink_active = nsPreferences.getBoolPref("libx.autolink", true);
    m.setAttribute('checked', libxOptions.autolink_active);
    m.setAttribute('oncommand', "libxSelectAutolink(this.getAttribute('checked'));");
    hbox.parentNode.insertBefore(m, hbox);
}

// vim: ts=4
