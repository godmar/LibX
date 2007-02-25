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
var openUrlResolver;    // OpenURL resolver or null if no OpenURL support, see openurl.js
var libxProxy;          // Proxy object or null if no proxy support, see proxy.js

var libxSelectedCatalog;// currently selected search type
var libxSearchFieldVbox;    // global variable to hold a reference to vbox with search fields.
var libxDropdownOptions = new Object(); // hash for a bunch of XUL menuitems, keyed by search type
var popuphelper = new ContextPopupHelper();

var libxEnv = new Object(); /* Global libx object */
/* Currently implemented under libxEnv 
 * 
 * xmlDoc -- return value of getConfigXML();
 *
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

    default:
		libxEnv.libxLog("Catalog type " + cattype + " not supported.");
    case null:
    case "":
        return null;
    }
    
    cat.setIf = libxCatalog.prototype.setIf;
    
    doc.copyAttributes( node, cat ); 
	    
	if (cat.xisbn == undefined)
    	cat.xisbn = new Object();
        
    var xisbnNode = xpathFindSingle ( doc.xml, "xisbn", node );
    if ( xisbnNode )
     	doc.copyAttributes ( xisbnNode, cat.xisbn );
        	
    cat.urlregexp = new RegExp( cat.urlregexp );

    libxEnv.libxLog("registered " + cat.name + " (type=" + node.nodeName + ", options=" + cat.options + ")");
    return cat;
}


/**
 * Initializes all of the libx catalogs.
 * If no xml has been defined, it calls libxInitializeCatalogsFromProperties()
 */
function libxInitializeCatalogs() 
{

    searchCatalogs = new Array(); 
    
    
    /* Call old-style init to be compatable w/ versions
     * That dont provide an XML
     */
    if ( !libxEnv.xmlDoc.xml ) {
		libxInitializeCatalogsFromProperties();
		return;
	}
	
	function addCatalog( node, catnumber ) {
	    try {
	        var cat = libxInitializeCatalog( libxEnv.xmlDoc, node );
	        searchCatalogs.push(cat);
			
	    } catch (e) {
	        libxEnv.libxLog("libxInitializeCatalog failed: " + e);
	    }
	}

	/* Build all catalogs into searchCatalogs */
    var xmlCatalogs = xpathFindNodes(libxEnv.xmlDoc.xml, "/edition/catalogs/*");
    var addcatno;
    for ( addcatno = 0; 
         (addcatno < xmlCatalogs.length ); 
         addcatno++)
    {
        addCatalog(xmlCatalogs[addcatno], addcatno);
    }
    
    /* Initialize the scholar catalog */
    
    /* Scholar Search is handled through entry in XML file unless disabled ... 
    if (!libxEnv.xmlDoc.xml && (cattype = libxGetProperty("scholar.catalog.type")) != "")
        if (!libxConfig.options.disablescholar)
        	searchCatalogs.push ( 
        		libxInitializeCatalogFromProperties (
        			"scholar", "scholar." ) );*/
        	
        	
	libxEnv.initCatalogGUI();
	
}

// Initialize OpenURL support if so configured
function libxInitializeOpenURL() 
{
    if (libxConfig.xml) {
        var pnode = libxConfig.getNode('/edition/openurl/resolver[1]');
        var ourltype = pnode.getAttribute("type");
    } else {
        var ourltype = libxGetProperty("openurl.type");
    }
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
        libxEnv.libxLog("Unsupported OpenURL type: " + ourltype);
        /* FALLTHROUGH */
    case "":
    case null:
        openUrlResolver = null;
        openurlsbutton.hidden = true;
        return;
    }

    if (libxConfig.xml) {
        libxConfig.copyAttributes(pnode, openUrlResolver);
    } else {
        openUrlResolver.type = ourltype;
        openUrlResolver.url = libxGetProperty("openurl.url");
        openUrlResolver.sid = libxGetProperty("openurl.sid");
        openUrlResolver.xrefsid = libxGetProperty("openurl.xrefsid");
        openUrlResolver.pmidsid = libxGetProperty("openurl.pmidsid");
        openUrlResolver.name = libxGetProperty("openurl.name");
        openUrlResolver.version = libxGetProperty("openurl.version");
        openUrlResolver.image = libxGetProperty("openurl.image");
        openUrlResolver.autolinkissn = libxGetProperty("openurl.autolinkissn");

        var copt = libxGetProperty("openurl.options");
        if (copt != null)
            openUrlResolver.options = copt;
        openUrlResolver.dontshowintoolbar = libxGetProperty("openurl.dontshowintoolbar") == "true" ? true : false;
        openUrlResolver.searchlabel = libxGetProperty("openurl.searchlabel");
    }

    openurlsbutton.hidden = openUrlResolver.dontshowintoolbar == true;

    if (openUrlResolver.searchlabel == null)
        openUrlResolver.searchlabel = "Search " + openUrlResolver.name;
    openurlsbutton.setAttribute("label", openUrlResolver.searchlabel);
}

// Initialization - this code is executed whenever a new window is opened
function libxInit() 
{
	libxEnv.xmlDoc = libxGetConfigXML();
    
    libxInitializeProperties();

    // initialize menu at top left of toolbar
    // these are now additional properties:
    // link1.label=...
    // link1.url=...
    // and so on.
    var libxmenu = document.getElementById("libxmenu");
    var libxmenusep = document.getElementById("libxmenu.separator");
    var label = null;
    
    /* Loading from XUL */
    if ( libxEnv.xmlDoc.xml )
    {
	    var libxlinks = 
    		xpathFindNodes(libxEnv.xmlDoc.xml, "/edition/links/*");
    
	    for (var link = 0; link < libxlinks.length; link++ )
	    {
	        var mitem = document.createElement("menuitem");
	        libxEnv.xmlDoc.copyAttributes ( libxlinks[link], mitem );
	        mitem.setAttribute ( "label", mitem.label );
	        var url = mitem.href;
	        if (url != null)
	            mitem.setAttribute("oncommand", "libxEnv.openSearchWindow('" + url + "');");
	        libxmenu.insertBefore(mitem, libxmenusep);
	    }
    }
    else
    {
	    for (var link = 1;
	            (label = libxGetProperty("link" + link + ".label")) != null;
	            link++) 
	    {
	        var url = libxGetProperty("link" + link + ".url");
	        var mitem = document.createElement("menuitem");
	        mitem.setAttribute("label", label);
	        if (url != null)
	            mitem.setAttribute("oncommand", "libxEnv.openSearchWindow('" + url + "');");
	        libxmenu.insertBefore(mitem, libxmenusep);
	    }
    }

	libxSearchFieldVbox = document.getElementById("search-field-vbox");

    /* Initialize search options by storing XUL-defined menuitems into
     * array for later cloning. */
	var ddOptions = document.getElementById("libx-dropdown-menupopup");
    for (var i = 0; i < ddOptions.childNodes.length; i++) {
        var d = ddOptions.childNodes.item(i);
        libxDropdownOptions[d.value] = d;
    }

    /* If an edition wants to use searchoptions that are not 
     * already defined (Y, t, etc.), additional options can be 
     * defined using
     * libx.searchoption1.value=s
     * libx.searchoption1.label=QuickSearch
     * etc.
     *
     * It is also possible to override the labels of existing options,
     * such as
     * libx.searchoption1.value=jt
     * libx.searchoption1.label=Periodical Title
     */ 
    for (var opt = 1;
        (label = libxGetProperty("libx.searchoption" + opt + ".label")) != null;
        opt++) 
    {
        var mitem = document.createElement("menuitem");
        libxAddToPrototype(mitem, { 
            value: libxGetProperty("libx.searchoption" + opt + ".value"),
            label: label
        });
        mitem.setAttribute('oncommand', 'setFieldType(this);');
        libxDropdownOptions[mitem.value] = mitem;
    }

    libxInitializeOpenURL();    
    libxInitializeCatalogs();
	libxProxyInit();
    libxInitializeAutolink();
	libxInitializeDFU();
	
	var menu = document.getElementById("contentAreaContextMenu");
    menu.addEventListener("popupshowing", libxContextPopupShowing, false);

    var scholarbutton = document.getElementById("libx-magic-button");
    if (libxConfig.options.disablescholar) {
        scholarbutton.hidden = true;
    } else {
        new TextDropTarget(magicSearch).attachToElement(scholarbutton);
    }

    // add the selected search as a default target
    var searchbutton = document.getElementById("libx-search-button");
    new TextDropTarget(function (data) {
        libxSelectedCatalog.search([{ searchType: 'Y', searchTerms: data }]);
    }).attachToElement(searchbutton);
    libxInitializePreferences("libx.displaypref");

    /* Adjust for bug in style rendering on Macintosh with FF 2.0.
     * The type field to toolbarbutton can take the value "menu" or "menu-button".
     * The two are very different: menu has a label child, menu-button does not.
     * labels have padding.  
     * For reasons unknown, on Macintosh, FF 2.0, they are rendered differently,
     * so we adjust the pixels to get it aligned.  How ridiculous.
     * It's still incorrect on FF 1.5 on Macintosh.  FF 1.5 is unsupported
     * by Mozilla as of 04/07, so let's not bother fixing it.
     */
    if (navigator.userAgent.match(/.*Macintosh.*Firefox\/2/)) {
        searchbutton.style.margin = "-4px 0px -2px 0px";
        document.getElementById("libx-scholar-box")
            .style.margin = "1px 0px 0px 0px";
    }

    document.getElementById("libx-menu-toolbarbutton")
        .setAttribute("tooltiptext", "LibX - " + libxGetProperty('edition'));
        
    initializeMenuObjects();
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



//this function is called if the user presses the search button, 
//it performs a search in the catalog which the user previously selected
function doSearch() {
	var fields = extractSearchFields();
    if (!libxSelectedCatalog.search)
        alert("Internal error, invalid catalog object: " + libxSelectedCatalog);
    libxSelectedCatalog.search(fields);
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
    if (libxConfig.xml) {
        var pnode = libxConfig.getNode('/edition/proxy/*[1]');
        if ( pnode )
        	var proxytype = pnode.nodeName;
    } else {
        var proxytype = libxGetProperty("proxy.type");
    }
    switch (proxytype) {
    case "ezproxy":
		libxProxy = new libxEZProxy();
        break;
    case "wam":
		libxProxy = new libxWAMProxy();
        break;
    default:
		libxEnv.libxLog("Unsupported proxy.type=" + proxytype);
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
    if (libxConfig.xml && pnode ) {
        libxConfig.copyAttributes(pnode, libxProxy);
    } else {
        libxProxy.name = libxGetProperty("proxy.name");
        libxProxy.url = libxGetProperty("proxy.url");
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
	var sb = document.getElementById("libx-search-button");
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

// add and remove search fields.
// we do this by cloning or removing the last search field child
// the blue "add-field" button, child #2, is disabled for all children except the last
// the red "close-field" button, child #3, is enabled for all children except the first
// these function all depend intimately on the XUL used for the vbox/hbox search field stuff
function addSearchField() {
	var lastSearchField = libxSearchFieldVbox.lastChild;// get bottom search field
	var newSearchField = lastSearchField.cloneNode(true);// clone last search field and all its descendants
    // cloneNode, for reasons we don't understand, does not clone certain properties, such as "value"
    newSearchField.firstChild.value = lastSearchField.firstChild.value;
	lastSearchField.childNodes.item(2).disabled=true;// disable blue "add-field" button in what will be the next-to-last searchfield
	if (libxSearchFieldVbox.childNodes.length == 1) { // tests if only one search field is currently visible
		lastSearchField.childNodes.item(3).disabled=false; // OPTIONAL: show close button in first search field
		newSearchField.childNodes.item(3).disabled=false; // if so, the second field must have the close button enabled
	}
	newSearchField.firstChild.nextSibling.firstChild.value = "";
	libxSearchFieldVbox.appendChild(newSearchField);

    // provide the next option from the list as a default
    var lastSelection = lastSearchField.firstChild.value;
    var ddMenu = newSearchField.firstChild.firstChild;
    for (var i = 0; i < ddMenu.childNodes.length - 1; i++) {
        if (ddMenu.childNodes.item(i).value == lastSelection) {
            setFieldType(ddMenu.childNodes.item(i+1));
            break;
        }
    }
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

function libxClearAllFields() {
	// while there are more than one search field left, remove the last one
	while (libxSearchFieldVbox.childNodes.length > 1) {
		removeSearchField(libxSearchFieldVbox.lastChild);
	}
	// finally, clear the content of the only remaining one
	libxSearchFieldVbox.firstChild.firstChild.nextSibling.firstChild.value = "";

    // set options back to default for currently selected catalog
    libxActivateCatalogOptions(libxSelectedCatalog, true);
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
   window.openDialog("chrome://libx/content/about.xul", "About...", "centerscreen,chrome,modal,resizable");
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
    {   // suppress possible ISBN match for US phone numbers
        regexp: /\d{3}-\d{3}-?\d{4}/ig,
        href: function(match) { 
            return null;
        }
    },
    {   // ISBNs
        regexp: /((97[89])?((-)?\d(-)?){9}[\dx])(?!\d)/ig,
        href: function(match) { 
            var isbn = isISBN(match[1]); 
            if (isbn == null) return null;
            this.name = libxGetProperty("isbnsearch.label", [libraryCatalog.name, isbn]);
            return libraryCatalog.linkByISBN(isbn);
        }
    },
    {   // ISSNs - we try to only accept 0000-0000
        regexp: /(\d{4}-\d{3}[\dx])(?!\d)/ig,
        href: function(match) { 
            var issn = isISSN(match[1]); 
            if (issn == null) return null;
            var split = issn.match(/(\d{4})-(\d{4})/);
            // suppress what are likely year ranges.
            if (split != null) {
                var from = parseInt(split[1]);
                var to = parseInt(split[2]);
                if (from >= 1000 && from < 2050 && to < 2200 && from < to)
                    return null;
            }
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
    setBoolPref("libx.autolink", value);
    libxConfig.options.autolink_active = value;
    if (value)
        libxRunAutoLink(_content.document, true);
}

function libxInitializeAutolink()
{
    if (!libxConfig.options.autolink)
        return;

    var hbox = document.getElementById("libx-about");
    var m = document.createElement("menuitem");
    m.setAttribute('type', 'checkbox');
    m.setAttribute('label', 'Autolink Pages');
    libxConfig.options.autolink_active = getBoolPref("libx.autolink", true);
    m.setAttribute('checked', libxConfig.options.autolink_active);
    m.setAttribute('oncommand', "libxSelectAutolink(this.getAttribute('checked'));");
    hbox.parentNode.insertBefore(m, hbox);
}

// vim: ts=4
