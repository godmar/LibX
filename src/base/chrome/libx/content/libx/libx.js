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

var searchType;         // currently selected search type
var searchFieldVbox;    // global variable to hold a reference to vbox with search fields.
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

function libxInitializeCatalog(cattype, catprefix)
{
	if (cattype == "millenium") {
		return new MilleniumOPAC(catprefix);
	} else
	if (cattype == "horizon") {
	    return new HorizonOPAC(catprefix);
	} else
	if (cattype == "aleph") {
	    return new AlephOPAC(catprefix);
	} else
	if (cattype == "voyager") {
	    return new VoyagerOPAC(catprefix);
	} else {
		libxLog("Catalog type " + cattype + " not supported.");
	}
    return null;
}

// initialize the catalogs we'll use, including the 
// default library catalog
function libxInitializeCatalogs() 
{
    searchCatalogs = new Array();
    var cattype = libxGetProperty("catalog.type");
    libraryCatalog = libxInitializeCatalog(cattype, "");
    libraryCatalog[libxGetProperty("catalog.sid")] = true;
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
        libxLog("registered catalog" + addcat + " of type " + cattype);

        var newbutton = document.createElement("menuitem");
        newbutton.setAttribute("oncommand", "setSearchButton(this,event);");
        newbutton.setAttribute("value", "catalog" + addcat);
        newbutton.setAttribute("label", "Search " + libxGetProperty("catalog" + addcat + ".catalog.name"));
        catdropdown.insertBefore(newbutton, openurlsbutton);
    }

    // record initially selected search type (this is menuitem's "catalog0" value)
    searchType = catdropdown.firstChild.value;  
    // copy initial label to toolbarbutton parent from menuitem first child
    libraryCatalog.catalogname = libxGetProperty("catalog.name");
    catdropdown.firstChild.setAttribute("label", "Search " + libraryCatalog.catalogname);
    catdropdown.parentNode.label = catdropdown.firstChild.label;
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

    libxInitializeCatalogs();
	
	var ourltype = libxGetProperty("openurltype");
	if (ourltype == "sersol") {
	    openUrlResolver = new ArticleFinder(libxGetProperty("openurlresolver.url"), libxGetProperty("openurl.sid"));
	} else
	if (ourltype == "sfx") {
	    openUrlResolver = new SFX(libxGetProperty("openurlresolver.url"), libxGetProperty("openurl.sid"));
	} else
    if (ourltype == "generic" || ourltype == "webbridge") {
	    openUrlResolver = new OpenURL(libxGetProperty("openurlresolver.url"), libxGetProperty("openurl.sid"));
	} else {
	    document.getElementById("libx-openurl-search-menuitem").hidden = true;
	}

    if (libxGetProperty("openurl.dontshowintoolbar") == "true") {
        document.getElementById("libx-openurl-search-menuitem").hidden = true;
    }
	
	var proxytype = libxGetProperty("proxytype");
	if (proxytype == null || proxytype == "") {
		var libxproxify = document.getElementById("libx-proxify");
		libxproxify.hidden = true;
	}
	
	initializeDoForURLs();
	
	searchFieldVbox = document.getElementById("search-field-vbox");
	var menu = document.getElementById("contentAreaContextMenu");
    menu.addEventListener("popupshowing", libxContextPopupShowing, false);
    new TextDropTarget(magicSearch).attachToElement(document.getElementById("libx-magic-button"));
    initializePreference("libx.displaypref");
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

function initializePreference(property)
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
	
	if (popuphelper.isOverLink()) {// activate proxify link whenever user right-clicked over hyperlink
		libxproxify.label = libxGetProperty("proxify.label");
	} else {
		libxproxify.label = libxGetProperty("proxyreload.label");
	}
		
	pureISN = null;//forget pureISN
	pureDOI = null;//forget pureDOI
	purePMID = null;//forget purePMID
	if (!popuphelper.isTextSelected()) {//no selection
		keywordsearch.hidden = titlesearch.hidden = authorsearch.hidden = false;
        keywordsearch.label = libxGetProperty("contextmenu.keywordsearch.label", [libraryCatalog.catalogname]);
        titlesearch.label = libxGetProperty("contextmenu.titlesearch.label", [libraryCatalog.catalogname]);
        authorsearch.label = libxGetProperty("contextmenu.authorsearch.label", [libraryCatalog.catalogname]);

		if (popuphelper.isOverLink()) {
			pureDOI = isDOI(decodeURI(popuphelper.getNode().href));//does href of hyperlink over which user right-clicked contain a doi?
			if (pureDOI != null && openUrlResolver) {
				doisearch.label = libxGetProperty("openurldoisearch.label", [pureDOI]);
				doisearch.hidden = false;
			}
		}
		return;// skip rest of function
	}
	//end of no selection, code below assumes there is a selection
	//check selection for ISBN or ISSN or DOI and activate appropriate menuitems
	var s = popuphelper.getSelection();
	if (pureISN = isISBN(s)) {
		isbnsearch.label = libxGetProperty("isbnsearch.label", [libraryCatalog.catalogname, pureISN]);
		xisbnsearch.label = libxGetProperty("xisbnsearch.label", [pureISN]);
		isbnsearch.hidden = false;
		if (libraryCatalog.xisbnOPACID) {   // only true if xISBN is supported for this catalog
		    xisbnsearch.hidden = false;
		}
	} else
	if (pureISN = isISSN(s)) {
		isbnsearch.label = libxGetProperty("issnsearch.label", [libraryCatalog.catalogname, pureISN]);
		isbnsearch.hidden = false;
		if (openUrlResolver) {
		    openurlissnsearch.label = libxGetProperty("openurlissnsearch.label", [pureISN]);
		    openurlissnsearch.hidden = false;
		}
	}

    if (openUrlResolver) {
        purePMID = isPMID(s);
    }
	if (purePMID != null) {
		pmidsearch.label = libxGetProperty("openurlpmidsearch.label", [purePMID]);
		pmidsearch.hidden = false;
	}

    // show keyword, title, author only if none of IS*N or PMID was recognized
	if (pureISN == null && purePMID == null) {
		keywordsearch.hidden = titlesearch.hidden = authorsearch.hidden = false;
		scholarsearch.hidden = false;
        keywordsearch.label = libxGetProperty("contextmenu.keywordsearch.label", [libraryCatalog.catalogname]);
        titlesearch.label = libxGetProperty("contextmenu.titlesearch.label", [libraryCatalog.catalogname]);
        authorsearch.label = libxGetProperty("contextmenu.authorsearch.label", [libraryCatalog.catalogname]);
    }

    // DOI displays in addition to keyword, title, author
	pureDOI = isDOI(s);
	if (pureDOI != null && openUrlResolver) {
		doisearch.label = libxGetProperty("openurldoisearch.label", [pureDOI]);
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
    consoleService.logStringMessage("libx: " + msg);
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

// given an array of {searchType: xxx, searchTerms: xxx } items
// formulate a query against the currently selected library catalog
function doCatalogSearch(catalog, fields) {
	for (var i = 0; i < fields.length; i++) {
		if (!catalog.supportsSearchType(fields[i].searchType)) {
		 	return;
		}
	}	
	if (fields.length == 1) {//single search field
		var url = catalog.makeSearch(fields[0].searchType, fields[0].searchTerms);
		openSearchWindow(url);
		return;
	} else {// user requested multiple search fields, do advanced search
		var url = catalog.makeAdvancedSearch(fields);
		openSearchWindow(url);
		return;
	}
}

// formulate a query against an openurl resolver for an article
function doOpenUrlSearch(fields) {
	var url = openUrlResolver.makeOpenURLSearch(fields);
	if (url) {
	    openSearchWindow(url);
	}
}

//this function is called if the user presses the search button, 
//it performs a search in the catalog which the user previously selected
function doSearch() {
	var fields = extractSearchFields();
    var cat = searchType.match(/^catalog(\d+)$/);
    if (cat != null) { // user requested search in one of the library catalogs
		doCatalogSearch(searchCatalogs[cat[1]], fields);
		return;
    }
	
    var cat = searchType.match(/^openurl$/);
    if (cat != null) { // user requested search in openurl catalog
		doOpenUrlSearch(fields);
		return;
	}
	
	alert("Internal error, invalid catalog entry: " + searchType);
}

// create a google scholar search from entered search fields
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
	magicSearch(q, t, true);
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
    // if this is an ISSN, change searchtype to 'is'
    // Millenium & Voyager treat ISSNs the same, but the separate type is necessary for Horizon
    // which uses a different index for ISSNs
	if (stype == 'i') {
	    sterm = pureISN;
        if (isISSN(pureISN)) {
            stype = 'is';
        }
	}
		
	// create a makeshift array of a single element - we do this solely 
	// to be able to reuse the "doCatalogSearch" function which expects an array
	// of objects with a searchType/searchTerms property each.
	doCatalogSearch(libraryCatalog, [{searchType: stype, searchTerms: sterm}]);	
}

// create a url that requests an item by ISBN from the xISBN service,
// if the current catalog supports it
function makeXISBNRequest(isbn) {
    if (libraryCatalog.xisbnOPACID) {
        return "http://labs.oclc.org/xisbn/liblook?baseURL=" 
            + libraryCatalog.libraryCatalogURL.replace(/https/, "http")     // xISBN barks at https URLs
            + "&opacID=" + libraryCatalog.xisbnOPACID + "&isbn=" + isbn;
    } else {
        return libraryCatalog.makeISBNSearch(isbn);
    }
}

// use OCLC's xisbn's search
// XXX investigate processing these results better - otherwise the user has to click through
// dozens or more results
function doXisbnSearch() {
	openSearchWindow(makeXISBNRequest(pureISN)); 
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

// this function is called when the user hits the "Proxify" menuitem
// it rewrites the target URL of a link to go through EZProxy,
// helping off-campus users to find a resource
function doEasyProxify() {
	var newurl;
	if (popuphelper.isOverLink()) {
		newurl = libxGetProperty("proxy.url", [popuphelper.getNode().href]);
		openSearchWindow(newurl);
    } else {
		_content.location.href = libxGetProperty("proxy.url", [_content.location]);
    }
}

/* From the III documentation:

  http://<port>-<target server>.<Innovative server>/<rest of URL>
  <port> The port number of the resource. If the port number is 80, substitute 0 (zero) for the port number.
  <target server> The address for the target resource.
  <Innovative server> The address of your Innovative server.
  <rest of URL> The rest of the URL for the target resource.

      http://search.epnet.com:5670/a/acp/name/db/bgmi/search
      http://5670-search.epnet.com.my.lib.edu/a/acp/name/db/bgmi/search
*/
function convertToWAM(url) {
    var proxybase = libxGetProperty("proxy.url");
    var m = url.match(/http:\/\/([^\/:]+)(:(\d+))?\/(.*)$/);
    if (m) {
        m[0];
        var host = m[1];
        var port = m[3];
        if (port === undefined || port == 80) port = 0;
        var path = m[4];
        var newurl = "http://" + port + "-" + host + "." + proxybase + "/" + path;
        return newurl;
    }
    return url;
}

function doWAMProxify() {
	var newurl;
	if (popuphelper.isOverLink()) {
		newurl = convertToWAM(popuphelper.getNode().href);
		openSearchWindow(newurl);
    } else {
		_content.location.href = convertToWAM(_content.location.toString());
    }
}

function doProxify() {
	var proxytype = libxGetProperty("proxytype");
	if (proxytype == "ezproxy") {
		doEasyProxify();
    } else
	if (proxytype == "wam") {
        doWAMProxify();
	} else {
		libxLog("Unsupported Proxy Type " + proxytype);
	}
}

// for all catalogs transfer search field contents into 'fields' array
// and return this array
function extractSearchFields() {
	var fields = new Array();
	for (var i = 0; i < searchFieldVbox.childNodes.length; i++) {// iterate over all search fields
		var f = searchFieldVbox.childNodes.item(i);
		if (f.firstChild.value == null) f.firstChild.value = "Y";
		//alert(f.firstChild.value + " " + f.firstChild.label + " " + f.firstChild.nextSibling.firstChild.value);
		var field = {searchType: f.firstChild.value, searchTerms: f.firstChild.nextSibling.firstChild.value};
        if (field.searchType == 'i' && isISSN(field.searchTerms)) {
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
function setSearchButton(mitem, event) {
	var sb = document.getElementById("search-button");
	sb.label = mitem.label;
	searchType = mitem.value;
	event.stopPropagation();
}

// add and remove search fields.
// we do this by cloning or removing the last search field child
// the blue "add-field" button, child #2, is disabled for all children except the last
// the red "close-field" button, child #3, is enabled for all children except the first
// these function all depend intimately on the XUL used for the vbox/hbox search field stuff
function addSearchField() {
	var lastSearchField = searchFieldVbox.lastChild;// get bottom search field
	var newSearchField = lastSearchField.cloneNode(true);// clone last search field and all its descendants
	lastSearchField.childNodes.item(2).disabled=true;// disable blue "add-field" button in what will be the next-to-last searchfield
	if (searchFieldVbox.childNodes.length == 1) { // tests if only one search field is currently visible
		lastSearchField.childNodes.item(3).disabled=false; // OPTIONAL: show close button in first search field
		newSearchField.childNodes.item(3).disabled=false; // if so, the second field must have the close button enabled
	}
	newSearchField.firstChild.nextSibling.firstChild.value = "";
	searchFieldVbox.appendChild(newSearchField);
	// return reference to new textbox so caller can move focus there
	return newSearchField.firstChild.nextSibling.firstChild;
}

// remove a specific search field
// user must pass reference to hbox of search field to be removed
function removeSearchField(fieldHbox) {
	searchFieldVbox.removeChild(fieldHbox);
	var lastSearchField = searchFieldVbox.lastChild;// get bottom search field
	lastSearchField.childNodes.item(2).disabled=false;// enable blue "add-field" button
	if (searchFieldVbox.childNodes.length == 1) { // disable close button if only one search field 
	    lastSearchField.childNodes.item(3).disabled=true;
	}
}

function clearAllFields() {
	// while there are more than one search field left, remove the last one
	while (searchFieldVbox.childNodes.length > 1) {
		removeSearchField(searchFieldVbox.lastChild);
	}
	// finally, clear the content of the only remaining one
	searchFieldVbox.firstChild.firstChild.nextSibling.firstChild.value = "";
}

// copy selection into search field - this is called from the nested right-click menu
function addSearchFieldAs(mitem) {
	if (!popuphelper.isTextSelected()) {
		alert(libxGetProperty("selectterm.alert"));
		return;
	}
	var sterm = popuphelper.getSelection();
	
	//XXX investigate if we should pretreat sterm
	for (var i = 0; i < searchFieldVbox.childNodes.length; i++) {// iterate over all search fields and find and use the first empty one
		var tbb = searchFieldVbox.childNodes.item(i).firstChild;//toolbarbutton in hbox of search field
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

// vim: ts=4
