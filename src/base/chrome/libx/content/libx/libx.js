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
                        
var libxConfig = new Object();   // Global variable to hold configuration items

//var openUrlResolver;    // 
var libxProxy;          // Proxy object or null if no proxy support, see proxy.js

var libxSelectedCatalog;// currently selected search type
var libxSearchFieldVbox;    // global variable to hold a reference to vbox with search fields.
var libxDropdownOptions = new Object(); // hash for a bunch of XUL menuitems, keyed by search type

var libxEnv = new Object(); /* Global libx object */
/* Currently implemented under libxEnv 
 * 
 * xmlDoc -- return value of getConfigXML();
 * writeLog -- write to whatever log the current platform uses
 * openSearchWindow -- respects config options on how to open a url
 * SelectCatalog -- switch current search type
 * initCatalogGUI -- set up catalog list
 * initializeGUI -- all GUI initialization code (=XUL in ff) moved here
 * initializeContextMenu -- right-click popup init code
 * addEventListener -- JavaScript event system
 * options -- previously under libxConfig.options
 * init -- initializes browser-specific stuff
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
        
    var xisbnNode = libxEnv.xpath.findSingle ( doc.xml, "xisbn", node );
    if ( xisbnNode ) {
        doc.copyAttributes ( xisbnNode, cat.xisbn );
    }
        	
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
    libxConfig.catalogs = new Object();
    libxConfig.numCatalogs = 0;

    function addCatalog( node, catnumber ) {
        try {
            var cat = libxInitializeCatalog( libxEnv.xmlDoc, node );
            searchCatalogs.push(cat);
            libxConfig.catalogs[cat.name] = cat;
            libxConfig.numCatalogs++;
        } catch (e) {
            libxEnv.writeLog("libxInitializeCatalog failed: " + e.message);
        }
    }

    /* Build all catalogs into searchCatalogs */
    var xmlCatalogs = libxEnv.xpath.findNodes(libxEnv.xmlDoc.xml, "/edition/catalogs/*");
    libxEnv.writeLog("Found " + xmlCatalogs.length + " catalogs.");
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

    libxInitSearchOptions();
    libxEnv.initializeGUI();
    libxInitializeOpenURL();
    libxInitializeCatalogs();
    libxProxyInit();
    libxEnv.initializeContextMenu();

    libxEnv.init();
}

function libxInitSearchOptions() {

    libxConfig.searchOptions = new Array();
    libxConfig.searchOptions["Y"]    = "Keyword";
    libxConfig.searchOptions["t"]    = "Title";
    libxConfig.searchOptions["jt"]   = "Journal Title";
    libxConfig.searchOptions["at"]   = "Article Title"; 
    libxConfig.searchOptions["a"]    = "Author"; 
    libxConfig.searchOptions["d"]    = "Subject";
    libxConfig.searchOptions["m"]    = "Genre"; 
    libxConfig.searchOptions["i"]    = "ISBN/ISSN"; 
    libxConfig.searchOptions["c"]    = "Call Number"; 
    libxConfig.searchOptions["j"]    = "Dewey Call Number"; 
    libxConfig.searchOptions["doi"]  = "DOI"; 
    libxConfig.searchOptions["pmid"] = "PubMed ID"; 
    libxConfig.searchOptions["magicsearch"] = "Magic Search";
    libxConfig.searchOptions["xisbn"] = "xISBN";
}

/*
 * Initialize proxy support.
 */
function libxProxyInit() {
    libxConfig.proxy = new Array();
    
    var pnodes = libxEnv.xpath.findNodes(libxEnv.xmlDoc.xml, '/edition/proxy/*');

    libxConfig.numProxy = pnodes.length;
    for ( var i = 0; i < pnodes.length; i++ ) {
        var proxytype = pnodes[i].nodeName;
        var proxy;
        switch ( proxytype ) {
        case "ezproxy":
    	    proxy = new libxEZProxy();
            break;
        case "wam":
    	    proxy = new libxWAMProxy();
            break;
        default:
    	    libxEnv.writeLog("Unsupported proxy.type=" + proxytype);
            /* FALLTHROUGH */
        case null:
        case "":
            proxy = null;
        }
        if ( proxy != null ) {
            proxy.type = proxytype;
            libxEnv.xmlDoc.copyAttributes( pnodes[i], proxy );
            libxConfig.proxy[proxy.name] = proxy;
        }
        if ( i == 0 ) {
            libxProxy = proxy;
        }

    }
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

// vim: ts=4
