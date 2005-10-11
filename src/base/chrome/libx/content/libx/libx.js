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
const libx_version = "1.0";

var libxProps;          // a string bundle in the XUL file from which we read properties
var libraryCatalog;     // the library catalog object, see MilleniumOPAC for an example
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

// Initialization - this code is executed when extension is loaded
function libxInit() {
	// this function is called after the entire overlay has been built
	// we must wait until here before calling document.getElementById
	libxProps = document.getElementById("libx-string-bundle");
	var cattype = libxGetProperty("catalogtype");
	var libraryCatalogUrl = libxGetProperty("catalog.url");
	if (cattype == "millenium") {
		var catregexp = new RegExp(libxGetProperty("catalog.urlregexp"));
		var catsid = libxGetProperty("catalog.sid");
		var scope = libxGetProperty("catalog.searchscope");
		libraryCatalog = new MilleniumOPAC(libraryCatalogUrl, catregexp, catsid, "R", scope);//sort by relevance, use 'D' for date
	} else
	if (cattype == "horizon") {
	    libraryCatalog = new HorizonOPAC(libraryCatalogUrl, /* sort not supported currently */"");
	} else {
		libxLog("Catalog type " + cattype + " not supported.");
	}
	libraryCatalog[libxGetProperty("catalog.sid")] = true;
        // menuitem's "searchcat" value
        searchType = document.getElementById("search-button").firstChild.firstChild.value;
	
	var ourltype = libxGetProperty("openurltype");
	if (ourltype == "sersol") {
	    openUrlResolver = new ArticleFinder(libxGetProperty("openurlresolver.url"), libxGetProperty("openurl.sid"));
	} else
    if (ourltype == "generic" || ourltype == "webbridge") {
	    openUrlResolver = new OpenURL(libxGetProperty("openurlresolver.url"), libxGetProperty("openurl.sid"));
	} else {
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
		isbnsearch.label = libxGetProperty("isbnsearch.label", [pureISN]);
		xisbnsearch.label = libxGetProperty("xisbnsearch.label", [pureISN]);
		isbnsearch.hidden = false;
		if (libraryCatalog.xisbnOPACID) {   // only true if xISBN is supported for this catalog
		    xisbnsearch.hidden = false;
		}
	} else
	if (pureISN = isISSN(s)) {
		isbnsearch.label = libxGetProperty("issnsearch.label", [pureISN]);
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

    // don't show keyword, title, author if IS*N or PMID was recognized
	if (pureISN == null && purePMID == null) {
		keywordsearch.hidden = titlesearch.hidden = authorsearch.hidden = false;
		scholarsearch.hidden = false;
    }

    // DOI displays in addition to keyword, title, author
	pureDOI = isDOI(s);
	if (pureDOI != null && openUrlResolver) {
		doisearch.label = libxGetProperty("openurldoisearch.label", [pureDOI]);
		doisearch.hidden = false;
	}
}

function isPMID(s) {
	var m = s.match(/PMID[^\d]*(\d+)/i);
    if (m == null)
        return null;
    return m[1];
}

// run a search against Scholar from the current selection
function doMagicSearchBySelection() {
	var s = popuphelper.getSelection();
	magicSearch(s);
}

// output a message to the JS console
function libxLog(msg) {
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage("Library Bar: " + msg);
}

// open a url in a new tab
// all other functions use this function instead of calling addTab() directly
// we can change this here if the user prefers to open links in the current tab
// or in a new window
function openSearchWindow(url) {
    if (typeof url == "string") {
	    getBrowser().addTab(encodeURI(url));
	} else
    if (url.constructor.name == "Array") {  // for catalog that require POST - UNTESTED code
  	    getBrowser().addTab(encodeURI(url[0]), null, null, /*aPostData*/url[1]);
    }
}

// given an array of {searchType: xxx, searchTerms: xxx } items
// formulate a query against the currently selected library catalog
function doAddisonSearch(fields) {
	for (var i = 0; i < fields.length; i++) {
		if (!libraryCatalog.supportsSearchType(fields[i].searchType)) {
		 	return;
		}
	}	
	if (fields.length == 1) {//single search field
		var url = libraryCatalog.makeSearch(fields[0].searchType, fields[0].searchTerms);
		openSearchWindow(url);
		return;
	} else {// user requested multiple search fields, do advanced search
		var url = libraryCatalog.makeAdvancedSearch(fields);
		openSearchWindow(url);
		return;
	}
}

// formulate a query against an openurl resolver for an article
function doOpenUrlSearch(fields) {
	var url = openUrlResolver.makeOpenURLForArticle(fields);
	if (url) {
	    openSearchWindow(url);
	}
}

//this function is called if the user presses the search button, 
//it performs a search in the catalog which the user previously selected
function doSearch() {
	var fields = extractSearchFields();
	if (searchType == "searchcat") {// user requested search in library catalog
		doAddisonSearch(fields);
		return;
	}
	
	if (searchType == "searchaf") {// user requested search in article finder
		doOpenUrlSearch(fields);
		return;
	}
	
	alert("This search type has not been implemented");
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
	magicSearch(q, t);
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
	
	// replace removes everything that's not letter, digit, _, -, or whitespace
	// and replaces multiple whitespaces with a single one
	sterm = sterm.replace(/[^A-Za-z0-9_\-\s]/g, " ").replace(/\s+/g, " ");
	// split author into names, turns "arthur conan doyle" into ["arthur", "conan", "doyle"]
	var names = sterm.split(/\s+/);
	// switch author's first and last name unless there's a comma or the last name is an initial
	if (stype == "a" && !hasComma && !names[names.length-1].match(/^[A-Z][A-Z]?$/i)) {
		sterm = names[names.length-1] + " " + names.slice(0,names.length-1).join(" ");
		// creates "doyle arthur conan"
	}
	if (stype == 'i') {
	    sterm = pureISN;
	}
		
	// create a makeshift array of a single element - we do this solely 
	// to be able to reuse the "doAddisonSearch" function which expects an array
	// of objects with a searchType/searchTerms property each.
	doAddisonSearch([{searchType: stype, searchTerms: sterm}]);	
}

// use OCLC's xisbn's search
// XXX investigate processing these results better - otherwise the user has to click through
// dozens or more results
function doXisbnSearch() {
	var xisbn = "http://labs.oclc.org/xisbn/liblook?baseURL=" + libraryCatalog.libraryCatalogURL + "&opacID=" + libraryCatalog.xisbnOPACID + "&isbn=" + pureISN;
	openSearchWindow(xisbn); 
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

function doProxify() {
	var proxytype = libxGetProperty("proxytype");
	if (proxytype == "ezproxy") {
		doEasyProxify();
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
		fields.push({searchType: f.firstChild.value, searchTerms: f.firstChild.nextSibling.firstChild.value});
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
