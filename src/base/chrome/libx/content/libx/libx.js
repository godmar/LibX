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

var libxProxy;          // Proxy object or null if no proxy support, see proxy.js

var libxEnv = { 
    catalogClasses: [],  // maps catalog types to constructors

    // default map of search options to search labels
    // newer configuration files store all labels in /edition/searchoptions 
    searchOptions2Labels: {
        "Y" : "Keyword",
        "t" : "Title",
        "jt" : "Journal Title",
        "at" : "Article Title",
        "a" : "Author",
        "d" : "Subject",
        "m" : "Genre",
        "i" : "ISBN/ISSN",
        "c" : "Call Number",
        "j" : "Dewey",
        "doi" : "DOI",
        "pmid" : "PubMed ID"
    }
};

/* Relies on following methods provided by libxEnv object 
 * 
 * xmlDoc -- return value of getConfigXML();
 * writeLog -- write to whatever log the current platform uses
 * openSearchWindow -- respects config options on how to open a url
 * initCatalogGUI -- set up catalog list
 * initializeGUI -- all GUI initialization code (=XUL in ff) moved here
 * initializeContextMenu -- right-click popup init code
 * addEventListener -- JavaScript event system
 * options -- previously under libxConfig.options
 * init -- initializes browser-specific stuff
 * openURLResolver -- OpenURL resolver or null if no OpenURL support, see openurl.js
 * addMenuObject/removeMenuObject -- Context menu abstraction layer
 * initNode + PrefsTreeNode -- Preferences tree view abstraction layer
 */


/**
 * Initializes a catalog from an XML Node
 * Assumes that the node has all of the relevant data needed
 * about that catalog. Returns a fully initialized catalog
 */
function libxInitializeCatalog(doc, node)
{
    var cat = null;
    
    switch (node.nodeName) {
    default:
        if (libxEnv.catalogClasses[node.nodeName] !== undefined) {
            cat = new libxEnv.catalogClasses[node.nodeName]();
            break;
        }
		libxEnv.writeLog("Catalog type " + node.nodeName + " not supported.");
        /* FALL THROUGH */
    case null:
    case "":
        return null;
    }
    
    cat.setIf = libxCatalog.prototype.setIf;
    
    doc.copyAttributes( node, cat ); 
        
    var xisbnNode = libxEnv.xpath.findSingleXML ( doc.xml, "xisbn", node );
    if ( xisbnNode ) {
        /* Most catalogs will inherit the xisbn property from their prototype,
         * but since the xisbn settings can be overridden on a per catalog basis,
         * each catalog must have its own xisbn object.
         * Otherwise, the prototyped object would be aliased and changes propagated.
         * Therefore, we clone the inherited xisbn object, then override the
         * inherited xisbn property.
         */
        var xisbnCopy = new Object();
        for (var k in cat.xisbn) {
            xisbnCopy[k] = cat.xisbn[k];
        }
        cat.xisbn = xisbnCopy;

        doc.copyAttributes ( xisbnNode, cat.xisbn );
    }
        	
    cat.urlregexp = new RegExp( cat.urlregexp );
    if (typeof (cat.__init) == "function") {
        cat.__init();
    }

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
    var xmlCatalogs = libxEnv.xpath.findNodesXML(libxEnv.xmlDoc.xml, "/edition/catalogs/*");
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
/**
 * Initialization
 * This code is executed whenever a new window is opened
 */
function libxInit() 
{
    //Store the build date here.  Checking whether this value exists
    //as well as comparison can be used by feed code if needed.
    libxEnv.buildDate = $builddate$;


    libxInitializeProperties();
    libxInitMagicSearch();
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
    // Adds onPageComplete to the eventlistener of DOMContentLoaded
    libxEnv.init();

    libxEnv.doforurls.initDoforurls();

	/**
	 * helper function that creates the cue logo to be inserted
	 * make the equivalent of this html:
	 * <a title="[title]" href="[url]"><img src="chrome://libx/skin/virginiatech.ico" border="0"/></a>
	 *
	 * targetobject is either the catalog or openurl object used.
	 * if it has an '.image' property, use that for the cue.
     *
     * @member libxEnv
     *
     * @param {DOM node} doc document node in HTML DOM
     * @param {String} title title attribute for link
     * @param {String} url href attribute for link
     * @param {Object} either a catalog or openurl resolver
	 *
	 */
    libxEnv.makeLink = function (doc, title, url, targetobject) {
        var link = doc.createElement('a');
        link.setAttribute('title', title);
        link.setAttribute('href', url);
        var image = doc.createElement('img');
        if (targetobject && targetobject.image) {
            image.setAttribute('src', targetobject.image);
        } else {
            if (libxEnv.options.cueicon != null)
                image.setAttribute('src', libxEnv.options.cueicon);
            else
                image.setAttribute('src', libxEnv.options.icon);
        }
        image.setAttribute('border', '0');
        link.appendChild(image);
        return link;
    }

    libxEnv.eventDispatcher.init();
    libxEnv.citeulike();

    
    try {
        libxEnv.writeLog( "Applying Hotfixes" );
        for ( var i = 0; i < libxEnv.doforurls.hotfixList.length; i++ )
        {
            eval( libxEnv.doforurls.hotfixList[i].text );
        }
    } catch (e) {
        libxEnv.writeLog( "Hotfix error " + e.message );
    } 
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
    
    var pnodes = libxEnv.xpath.findNodesXML(libxEnv.xmlDoc.xml, '/edition/proxy/*');

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

/*
 * Designed to extended to implement events that we commonly re-use, but are not provided
 * natively ( or to combine multiple events together )
 * 
 * - onContentChange -- events fired when the content of the website changes, either by switching tabs
 *                      or navigating to another website
 */
libxEnv.eventDispatcher = {
    // Notifies all listeners waiting for a given type
    notify: function ( libxtype, e ) {
        var listeners = libxEnv.eventDispatcher[libxtype];
        if ( listeners )
            for ( var i = 0; i < listeners.length; i++ ) {
                listeners[i].funct(e, listeners[i].args);
            }
    },
    // Adds a function to be executed when an event of the given type is triggered
    addEventListener: function ( libxtype, listener, args ) {
        if ( this[libxtype] == null )
            this[libxtype] = new Array();    
        this[libxtype].push({funct: listener, args: args});
    }
};

/*
 * Creates a URL Bar icon and hides/shows based on whether or not posting to CiteULike is supported
 * from a given website
 */
libxEnv.citeulike = function  ()  {
    this.icon = new libxEnv.urlBarIcon();
    this.icon.setHidden ( true );
    this.icon.setImage ( "chrome://libx/skin/citeulike.ico" );
    this.icon.setOnclick ( function  (e) {
        var contentWindow = libxEnv.getCurrentWindowContent();
        var url = contentWindow.location.href;
        var title = contentWindow.document.title;
        libxEnv.openSearchWindow("http://www.citeulike.org/posturl?url=" 
            + encodeURIComponent(url) 
            + "&title=" + encodeURIComponent(title), 
            /* do not uri encode */true, "libx.sametab");
    } );
    this.icon.setTooltipText ( libxEnv.getProperty ( "citeulike.tooltiptext" ) );

    libxEnv.eventDispatcher.addEventListener( "onContentChange", function ( e, args ) {
        var contentWindow = libxEnv.getCurrentWindowContent();
        var url = contentWindow.location.href;
        var icon = args.icon;
            citeulike.canpost(url, function ( url, reg ) {
            libxEnv.writeLog ( "Enabled: " + url, "citeulike" );
            icon.setHidden ( libxEnv.getBoolPref ( 'libx.urlbar.citeulike', true ) ? 'false' : 'true' );    
        }, function ( url ) {
            libxEnv.writeLog ( "Disabled: " + url, "citeulike" );
            icon.setHidden ( 'true' );
        });
    }, { icon: this.icon } );
	
}


/*
 * Retrieve a XML document from a URL.
 * 'callback' is optional.
 * If omitted, retrieval is synchronous.
 * Returns document on success, and (probably) null on failure.
 *
 * If given, retrieval is asynchronous.
 * Return value is undefined in this case.
 *
 * If postdata is given, a POST request is sent instead.
 * Does not support synchronous POST.
 *
 * If lastModified is specified a LastModified header will be set and sent with the request
 *
 * If contentType is given it overrides the default mimetype (used to request images)
 */
libxEnv.getXMLDocument = function ( url, callback, postdata, lastModified, contentType )
{
    var returnV = libxEnv.getDocumentRequest( url, callback, postdata,
        lastModified, contentType );
    if (callback === undefined && returnV != null)
        return returnV.responseXML;     // synchronous
    else
        return null;
}

/*
 * Retrieve a document from a URL.
 * 'callback' is optional.
 * If omitted, retrieval is synchronous.
 * Returns document on success, and (probably) null on failure.
 *
 * If given, retrieval is asynchronous.
 * Return value is undefined in this case.
 *
 * If postdata is given, a POST request is sent instead.
 * Does not support synchronous POST.
 *
 * If lastModified is specified a LastModified header will be set and sent with the request
 *
 * If contentType is given it overrides the default mimetype (used to request images)
 */
libxEnv.getDocument = function (url, callback, postdata, lastModified, contentType )
{
    var returnV = libxEnv.getDocumentRequest( url,
        ( callback === undefined ) ? undefined : function (xml) { callback(xml.responseText) },
        postdata, lastModified );
    if (callback === undefined && returnV != null)
        return returnV.responseText;        // synchronous
    else
        return null;                        // asynchronous, avoid accessing xmlhttprequest obj
}


// vim: ts=4
