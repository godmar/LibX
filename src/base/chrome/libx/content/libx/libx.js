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
var searchCatalogs;     // Array of search catalogs for drop-down search menu
var libraryCatalog;     // the library catalog object, see MilleniumOPAC for an example
                        // searchCatalogs[0] is libraryCatalog
//var openUrlResolver;    // 
var libxProxy;          // Proxy object or null if no proxy support, see proxy.js

var libxSelectedCatalog;// currently selected search type
var libxSearchFieldVbox;    // global variable to hold a reference to vbox with search fields.
var libxDropdownOptions = new Object(); // hash for a bunch of XUL menuitems, keyed by search type
var popuphelper;        // for context menu

var libxEnv = new Object(); /* Global libx object */
/* Currently implemented under libxEnv 
 * 
 * xmlDoc -- return value of getConfigXML();
 * writeLog -- write to whatever log the current platform uses
 * openSearchWindow -- respects config options on how to open a url
 * SelectCatalog -- switch current search type [neb]
 * initCatalogGUI -- set up catalog list [neb]
 * initializeGUI -- all GUI initialization code (=XUL in ff) moved here [neb]
 * initializeContextMenu -- right-click popup init code [neb]
 * addEventListener -- JavaScript event system [neb]
 * options -- previously under libxConfig.options
 * init -- initializes browser-specific stuff [neb]
 * openURLResolver -- OpenURL resolver or null if no OpenURL support, see openurl.js
 */

/*
 * Initializes a catalog from an XML Node
 * Assumes that the node has all of the relevant data needed
 * about that catalog. Returns a fully initialized catalog
 */
function libxInitializeCatalog(doc, node)
{
    var cat = null;
    
    switch (node.nodeName) {
	case "scholar":
        cat = new libxScholarSearch();
        break;

	case "bookmarklet":
        cat = new libxBookmarklet();
        break;

	case "millenium":
		cat = new MilleniumOPAC();
        break;

	case "horizon":
	    cat = new HorizonOPAC();
        // some catalogs use ISBNBR+ISSNBR (e.g., JHU)
        // others have an index ISBNEX that does exact matching 
        // on both ISSN & ISBN
          break;

	case "aleph":
	    cat = new AlephOPAC();
         break;

	case "voyager":
	    cat = new VoyagerOPAC();
        break;

	case "sirsi":
	    cat = new SirsiOPAC();
        break;

	case "sersol":
	    cat = new ArticleLinker();
        break;

	case "sfx":
	    cat = new SFX();
        break;

	case "centralsearch":
	    cat = new CentralSearch();
        break;

    case "openurlresolver":
        cat = new OpenURLCatalog();
        break;

    default:
		libxEnv.writeLog("Catalog type " + cattype + " not supported.");
    case null:
    case "":
        return null;
    }
    
    cat.setIf = libxCatalog.prototype.setIf;
    
    doc.copyAttributes( node, cat ); 
	    
	if (cat.xisbn == undefined)
    	cat.xisbn = new Object();
        
    var xisbnNode = libxEnv.xpath.findSingle ( doc.xml, "xisbn", node );
    if ( xisbnNode )
     	doc.copyAttributes ( xisbnNode, cat.xisbn );
        	
    cat.urlregexp = new RegExp( cat.urlregexp );

    libxEnv.writeLog("xml registered " + cat.name + " (type=" + node.nodeName + ", options=" + cat.options + ")");
    return cat;
}

/**
 * Initializes all of the libx catalogs.
 */
function libxInitializeCatalogs() 
{
    searchCatalogs = new Array(); 

    function addCatalog( node, catnumber ) {
        try {
            var cat = libxInitializeCatalog( libxEnv.xmlDoc, node );
            searchCatalogs.push(cat);
        } catch (e) {
            libxEnv.writeLog("libxInitializeCatalog failed: " + e.message);
        }
    }

    /* Build all catalogs into searchCatalogs */
    var xmlCatalogs = libxEnv.xpath.findNodes(libxEnv.xmlDoc.xml, "/edition/catalogs/*");
    var addcatno;
    for ( addcatno = 0; 
         (addcatno < xmlCatalogs.length ); 
         addcatno++)
    {
        addCatalog(xmlCatalogs[addcatno], addcatno);
    }
    
    // Scholar Search is handled through entry in XML file unless disabled

    libxEnv.initCatalogGUI();
}

// Initialization - this code is executed whenever a new window is opened
function libxInit() 
{
    libxInitializeProperties();
    
    /*
     * Config XML must be present to load options
     */
    if ( !libxEnv.xmlDoc.xml ) {
        libxEnv.writeLog ( "ERROR: Config XML Not Found" );
        return;
    }

    //Set up logging types
    libxEnv.logTypes = {
      magic: 'Magic',
      xpath: 'XPath'
    };

    libxEnv.initializeGUI();
    libxInitializeOpenURL();
    libxInitializeCatalogs();
    libxProxyInit();
    libxEnv.initializeContextMenu();
    
    libxEnv.init();
}



//this function is called right before the right click context menu is shown
//in this function we must adjust the hidden attributes of the context menu 
//items we would like the user to see
function libxContextPopupShowing() {
            
    pureISN = null;//forget pureISN

    ContextMenuShowing ( popuphelper );
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
    // use :alnum: to avoid dropping diacritics and other Unicode alphanums
    // as per Ted Olson
    sterm = sterm.replace(/[^[:alnum:]_&:\222\'\-\s/g, " ").replace(/\s+/g, " ");
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
	// to be able to reuse the "doCatalogSearch" function which expects an array
	// of objects with a searchType/searchTerms property each.
	var field = {searchType: stype, searchTerms: sterm};	
	libraryCatalog.search([field]);
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
		libxEnv.openSearchWindow(libxProxy.rewriteURL(href));
    } else {
		_content.location.href = libxProxy.rewriteURL(_content.location.toString());
    }
}

/*
 * Initialize proxy support.
 */
function libxProxyInit() {

    var pnode = libxEnv.xmlDoc.getNode('/edition/proxy/*[1]');
    if ( pnode )
        var proxytype = pnode.nodeName;

    switch (proxytype) {
    case "ezproxy":
		libxProxy = new libxEZProxy();
        break;
    case "wam":
		libxProxy = new libxWAMProxy();
        break;
    default:
		libxEnv.writeLog("Unsupported proxy.type=" + proxytype);
        /* FALLTHROUGH */
    case null:
    case "":
        // hide proxy entry in context menu if no proxy is defined
		/* Shouldn't need this anymore...
		var libxproxify = document.getElementById("libx-proxify");
		libxproxify.hidden = true;*/
        return;
	}
    libxProxy.type = proxytype;
    
    libxEnv.xmlDoc.copyAttributes(pnode, libxProxy);
    
}

/* If the searchType is 'i', examine if user entered an ISSN
 * and if so, change searchType to 'is'.  This ensures that 'i' handles
 * both ISBNs and ISSNs.
 */
function libxAdjustISNSearchType(f)
{
    // if this is an ISSN, but not a ISBN, change searchType to 'is'
	if (f.searchType == 'i') {
        if (!isISBN(f.searchTerms) && isISSN(f.searchTerms)) {
            f.searchType = 'is';
        }
	}
}

// for all catalogs transfer search field contents into 'fields' array
// and return this array
function extractSearchFields() {
	var fields = new Array();
	for (var i = 0; i < libxSearchFieldVbox.childNodes.length; i++) {// iterate over all search fields
		var f = libxSearchFieldVbox.childNodes.item(i);
		if (f.firstChild.value == null) f.firstChild.value = "Y";
		//alert(f.firstChild.value + " " + f.firstChild.label + " " + f.firstChild.nextSibling.firstChild.value);
		var field = {
            searchType: f.firstChild.value, 
            searchTerms: f.firstChild.nextSibling.firstChild.value.replace(/^\s+|\s+$/g, '')
        };
        if (field.searchTerms == "")
            continue;

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


/*
 * adjust drop-down menus based on catalog.options
 */
function libxActivateCatalogOptions(catalog, alwaysreset) {
    var opt = catalog.options.split(/;/);
    // for each open search field
	for (var i = 0; i < libxSearchFieldVbox.childNodes.length; i++) {
		var f = libxSearchFieldVbox.childNodes.item(i);
        var tbb = f.firstChild;
        var uservalue = f.firstChild.nextSibling.firstChild.value;
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
            // cloneNode doesnt clone the attributes !?
            mitem.value = ddo.value;
            mitem.label = ddo.label;
            if (oldvalue == mitem.value)
                newvalue = mitem;
            mpp.appendChild(mitem);
        }
        if (newvalue == null || alwaysreset || uservalue == "")
            setFieldType(mpp.firstChild);   // pick first entry the default
        else
            setFieldType(newvalue);         // recreate prior selection
    }
}

// vim: ts=4
