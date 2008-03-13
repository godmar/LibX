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

var libxEnv = new Object();

/* Relies on following methods provided by libxEnv object 
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

    case "web2":    // contributed by whikloj@cc.umanitoba.ca - 2007-06-20
        cat = new Web2OPAC();
        break;

    case "custom":
        cat = new libxCustomCatalog();
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
/**
 * Initialization
 * This code is executed whenever a new window is opened
 */
function libxInit() 
{
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
    libxEnv.eventDispatcher.init();
    libxEnv.init();
    libxEnv.citeulike();
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

    /**
     * Member function of libxEnv object that handles COinS (Context Object in
     * Span).  Will append a child element to the span tag that will serve as a
     * image based hyper link
     *
     * @member libxEnv
     *
     * @param {DOM node} doc document element in HTML DOM.
     * @param {object} openUrlResolver Open url resolver object
     */
    libxEnv.handleCoins = function (doc, openUrlResolver) {
        var is1_0 = openUrlResolver.version == "1.0";
        var coins = doc.getElementsByTagName('span');

        for (var i = 0; i < coins.length; i++) {
            try { // the span attribute may be malformed, if so, recover and continue with next
                var span = coins[i];

                if (0 == span.attributes.length
                    || !(span.attributes['class'])
                    || span.attributes['class'].value != 'Z3988')
                    continue;

                var query = span.getAttribute('title');
                query = query.replace(/&amp;/g, "&").replace(/\+/g, "%20").split(/&/);

                var rft_book = "rft_val_fmt=info:ofi/fmt:kev:mtx:book";
                var rft_journal = "rft_val_fmt=info:ofi/fmt:kev:mtx:journal";
                var isBookOrArticle = false;

                for (var j = 0; j < query.length; j++) {
                    var qj = decodeURIComponent(query[j]);

                    // some 0.1 resolver (SerSol) don't like the 'url_ver=' option
                    if (!is1_0 && qj.match(/^url_ver=/)) {
                        query.splice(j--, 1);
                        continue;
                    }

                    // remove rfr_id= if present, we substitute our own sid/rfr_id
                    if (qj.match(/^rfr_id=/)) {
                        query.splice(j--, 1);
                        continue;
                    }

                    // this is part of the context object version, but is not included in final URL
                    if (qj.match(/^ctx_ver=/)) {
                        query.splice(j--, 1);
                        continue;
                    }

                    if (qj == rft_book) {
                        isBookOrArticle = true;
                        if (!is1_0)
                            query[j] = "genre=book";
                        continue;
                    }
                    if (qj == rft_journal) {
                        isBookOrArticle = true;
                        if (!is1_0)
                            query[j] = "genre=article";
                        continue;
                    }

                    if (!is1_0) {
                        //convert to 0.1 unless 1.0 is given
                        //remove "rft." from beginning of attribute keys
                        qj = qj.replace(/rft\./g,"");

                        //change some attribute names
                        qj = qj.replace(/jtitle=/,"title=");
                        qj = qj.replace(/btitle=/,"title=");
                        qj = qj.replace(/rft_id=info:pmid\//,"id=pmid:");
                        qj = qj.replace(/rft_id=info:doi\//,"id=doi:");
                        qj = qj.replace(/rft_id=info:bibcode\//,"id=bibcode:");
                    }

                    var kv = qj.split(/=/);
                    var val = kv.splice(1, 1).join("=");
                    query[j] = kv[0] + '=' + encodeURIComponent(val);
                }
                if (is1_0)
                    query.push("url_ver=Z39.88-2004");

                query = query.join("&");

                // handle any coins if 1.0, otherwise do only if book or article
                if (is1_0 || isBookOrArticle) {
                    span.appendChild(libxEnv.makeLink(doc, 
                                                      libxEnv.getProperty("openurllookup.label", 
                                                                          [openUrlResolver.name]), 
                                                      openUrlResolver.completeOpenURL(query),
                                                      openUrlResolver ),
                                                      openUrlResolver);
                }
            } catch (e) {
                libxEnv.writeLog("Exception during coins processing: " +e);
            }

        }
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
}

// vim: ts=4
