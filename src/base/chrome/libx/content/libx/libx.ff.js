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
 *                 Michael Doyle ( vtdoylem@gmail.com )
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * LibX toolbar extension
 *
 * Author: Annette Bailey <annette.bailey@gmail.com>
 */ 
 
 /*
  * Designed to hold Firefox-specific code for the Libx extension
  */
 
if ( libxEnv == null )
  var libxEnv = new Object(); 

/*  init
 * Initialize Firefox-specific parts.
 */
libxEnv.init = function() {
    libxInitializeAutolink();
    var menu = document.getElementById ( 'libxmenu' )
    menu.addEventListener ( 'popupshowing', libxToolbarMenuShowing, false );
    libxInitializeDFU();
}
  
/* fix this later should it be necessary - so far, we were able to get at every catalog via GET
   this code is intended should POST be necessary in the future.
*/
//    if (typeof url == "string") {
//      getBrowser().addTab(encodeURI(url));
//  } else
//   if (url.constructor.name == "Array") {  // for catalog that require POST - UNTESTED code
//      getBrowser().addTab(encodeURI(url[0]), null, null, /*aPostData*/url[1]);
//    }

  // open search results, according to user preferences
libxEnv.openSearchWindow = function (url, donoturiencode, pref) {
    var what = pref ? pref : libxEnv.getUnicharPref("libx.displaypref", "libx.newtabswitch");
    if (donoturiencode == null || donoturiencode == false) {
        var url2 = encodeURI(url);
    } else {
        var url2 = url;
    }
    switch (what) {
    case "libx.newwindow":
        window.open(url2);
        break;
    case "libx.sametab":
        _content.location.href = url;
        break;
    case "libx.newtab":
    default:
        getBrowser().addTab(url2);
        break;
    case "libx.newtabswitch":
        var tab = getBrowser().addTab(url2);
        getBrowser().selectedTab = tab;
        break;
    }
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
 */
libxEnv.getXMLDocument = function ( url, callback, postdata ) {
    try {
        var xmlhttp = new XMLHttpRequest();
        if (callback === undefined) {
            // synchronous
            xmlhttp.open('GET', url, false);
        } else {
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == 4) {
                    callback(xmlhttp);
                }
            };
            // asynchronous
            xmlhttp.open(postdata !== undefined ? 'POST' : 'GET', url, true);
        }
        xmlhttp.send(postdata);
        return xmlhttp.responseXML;
    } 
    catch ( e ) { // File not found
        return null;
    }
}
  
  
// output a message to the JS console
libxEnv.writeLog = function (msg, type) {
    if(!type) {
        type = 'LibX';
    }
    else {
        var prefString = 'libx.' + type.toLowerCase() + '.debug';
        if(!libxEnv.getBoolPref(prefString, false)) {
            return;
        }
    }
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
        .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage(type + ": " + msg);
}

//Just use the mozilla event listener function
/* NB: addEventListener always adds the listener; if the same listener is
 * already registered, it will be registered twice.
 */
libxEnv.addEventHandler = function(obj, event, func, b) {
    if(!obj) obj = window;
    if(!b) b = false;
    return obj.addEventListener(event, func, b);
}

// switch the current search type (addison, openurl, etc.)
libxEnv.SelectCatalog = function(mitem, event) {
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
    libxSelectedCatalog = searchCatalogs[mitem.value];

    libxActivateCatalogOptions(libxSelectedCatalog);
}


libxEnv.initializeContextMenu = function () {
    popuphelper = new ContextPopupHelper();
    var menu = document.getElementById("contentAreaContextMenu");
    menu.addEventListener("popupshowing", libxEnv.contextMenuShowing, false);
    menu.addEventListener("popuphidden", libxEnv.contextMenuHidden, false );
}

//GUI-related stuff////////////////////////////////////////////////////


//this function is called if the user presses the search button, 
//it performs a search in the catalog which the user previously selected
function doSearch() {
	var fields = extractSearchFields();
    if (!libxSelectedCatalog.search)
        alert("Internal error, invalid catalog object: " + libxSelectedCatalog);
    libxSelectedCatalog.search(fields);
}

libxEnv.initCatalogGUI = function () {
    // we insert additional catalogs before the openurl button for now
    var catdropdown = document.getElementById("libxcatalogs");
    var openurlsbutton = document.getElementById("libx-openurl-search-menuitem");
    
    for ( var i = 1; i < searchCatalogs.length; i++ ) {
        var cat = searchCatalogs[i];
        var newbutton = document.createElement("menuitem");
        newbutton.setAttribute("oncommand", "libxEnv.SelectCatalog(this,event);");
        newbutton.setAttribute("value", i );
        newbutton.setAttribute("label", "Search " + cat.name + " " );
        catdropdown.appendChild(newbutton);
    }
    
    // record initially selected catalog and activate its search options
    catdropdown.firstChild.value = 0;  
    libxSelectedCatalog = searchCatalogs[0];
    libxActivateCatalogOptions(libxSelectedCatalog);
    libraryCatalog = searchCatalogs[0];
    // copy initial label to toolbarbutton parent from menuitem first child
    catdropdown.firstChild.setAttribute("label", "Search " + searchCatalogs[0].name + " ");
    catdropdown.parentNode.label = catdropdown.firstChild.label;
}

libxEnv.initializeGUI = function () {
    
    // initialize menu at top left of toolbar
    // these are now additional properties:
    // link1.label=...
    // link1.url=...
    // and so on.
    var libxmenu = document.getElementById("libxmenu");
    var libxmenusep = document.getElementById("libxmenu.separator");
    var label = null;
    
    
    var libxlinks = 
        libxEnv.xpath.findNodes(libxEnv.xmlDoc.xml, "/edition/links/*");
    
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

    var libxSearchOptions = 
        libxEnv.xpath.findNodes(libxEnv.xmlDoc.xml, "/edition/searchoptions/*");
    for (var option = 0; option < libxSearchOptions.length; option++ )
    {
        var mitem = document.createElement("menuitem");
        var opt = libxSearchOptions[option];
        libxEnv.xmlDoc.copyAttributes ( opt, mitem );
        mitem.setAttribute('oncommand', 'setFieldType(this);');
        libxDropdownOptions[mitem.value] = mitem;
        libxConfig.searchOptions[mitem.value] = mitem.label;
    }
    
    var scholarbutton = document.getElementById("libx-magic-button");
    
    if (libxEnv.options.disablescholar) {
        scholarbutton.hidden = true;
    } else {
        new TextDropTarget(magicSearch).attachToElement(scholarbutton);
    }

    // add the selected search as a default target
    var searchbutton = document.getElementById("libx-search-button");
    new TextDropTarget(function (data) {
        libxSelectedCatalog.search([{ searchType: 'Y', searchTerms: data }]);
    }).attachToElement(searchbutton);

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
        .setAttribute("tooltiptext", "LibX - " + 
            libxEnv.xmlDoc.getAttr("/edition/name", "edition" ) );
        
    // Use user defined preferences if available
    libxMenuPrefs = new libxXMLPreferences();
}

libxEnv.setObjectVisible = function(obj, show) {
    obj.hidden = !show;
}

libxEnv.setVisible = function(elemName, visible) {
    elem = document.getElementById(elemName);
    if (elem != null) {
        elem.hidden = !visible;
    }
}

libxEnv.setGUIAttribute = function(elemName, attrName, attrValue) {
    elem = document.getElementById(elemName);
    if (elem != null) {
        elem.setAttribute(attrName, attrValue);
    }
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
// This is currently unused
function libx___unused___addSearchFieldAs(mitem) {
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

// Opens the LibX Preferences window
// About window is now part of this window.
function openPrefWindow() { 
    window.openDialog ( "chrome://libx/content/libxprefs.xul", 
        "LibX Preferences", " centerscreen, chrome, modal, resizable",
        { config:libxConfig } 
    );
}

//Autolink-related stuff//////////////////////////////////////////////////////

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
            if (!libxEnv.openUrlResolver) return null;
            var pmid = match[1];
            this.name = libxGetProperty("openurlpmidsearch.label", [libxEnv.openUrlResolver.name, pmid]);
            return libxEnv.openUrlResolver.makeOpenURLForPMID(pmid);
        }
    },
    {   // DOIs
        regexp: /(10\.\S+\/[^\s,;\"\']+)/ig,
        href: function(match) { 
            if (!libxEnv.openUrlResolver) return null;
            var doi = isDOI(match[1]); 
            if (doi == null) return null;
            this.name = libxGetProperty("openurldoisearch.label", [libxEnv.openUrlResolver.name, doi]);
            return libxEnv.openUrlResolver.makeOpenURLForDOI(doi);
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
            if (libxEnv.openUrlResolver && libxEnv.openUrlResolver.autolinkissn) {
                this.name = libxGetProperty("openurlissnsearch.label", [libxEnv.openUrlResolver.name, issn])
                return libxEnv.openUrlResolver.makeOpenURLForISSN(issn);
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
    libxEnv.setBoolPref("libx.autolink", value);
    libxEnv.options.autolink_active = value;
    if (value && _content != null )
        libxRunAutoLink(_content.document, true);
}

function libxInitializeAutolink()
{
    if (!libxEnv.options.autolink)
        return;

    var hbox = document.getElementById("libx-about");
    var m = document.createElement("menuitem");
    m.setAttribute('type', 'checkbox');
    m.setAttribute('label', 'Autolink Pages');
    m.setAttribute ( 'id', 'libx.autolink' );
    libxEnv.options.autolink_active = libxEnv.getBoolPref("libx.autolink", true);
    m.setAttribute('checked', libxEnv.options.autolink_active);
    m.setAttribute('oncommand', "libxSelectAutolink(this.getAttribute('checked'));");
    hbox.parentNode.insertBefore(m, hbox);
}

function libxToolbarMenuShowing() {
    var m = document.getElementById ( 'libx.autolink' );
    libxEnv.options.autolink_active = libxEnv.getBoolPref("libx.autolink", true);
    m.setAttribute('checked', libxEnv.options.autolink_active);
}

// Returns the full file path for given path
// Chrome paths are left unchanged
// Any other paths should be file names only
// and will be put in %profile%/libx
libxEnv.getFilePath = function ( path ) {
    try {
        if ( path.indexOf ( 'chrome' ) >= 0 ) {
            return path;
        }
        else {
           file = DirIO.get ( 'ProfD' );
            file.append ( 'libx' );
            
            if ( !file.exists() ) {
                file = DirIO.create(file);
            }
            
            file.append ( path );
            return FileIO.path ( file );
        }
    }
    catch ( e ) {
        return null;
    }
}


// Assumes /libx directory off of profile if an absolute chrome path is
// not specified
libxEnv.writeToFile = function ( path, str ) {
    var file = libxEnv.getFile ( path );
    FileIO.write ( file, str );
}

// Returns file for given path
libxEnv.getFile = function ( path ) {
    var file;
    if ( path.indexOf ( 'chrome' ) == 0 )
        file = FileIO.openChrome( path );
    else {
        file = DirIO.get ( 'ProfD' );
        file.append ( 'libx' );
        
        if ( !file.exists() ) {
            file = DirIO.create(file);
        }
        
        file.append ( path );
    }
    return file;
}

// Used to get the defaultprefs.xml and userprefs.xml files
libxEnv.getLocalXML = function ( path ) {
    return libxEnv.getXMLDocument ( libxEnv.getFilePath ( path ) );
}

// Used to remove userprefs.xml
libxEnv.removeFile = function ( path ) {
    var file = libxEnv.getFile ( path );
    FileIO.unlink ( file );

}


/*
    Copyright Robert Nyman, http://www.robertnyman.com
    Free to use if this text is included
*/
function getElementsByAttribute(oElm, strTagName, strAttributeName, strAttributeValue){
    var arrElements = (strTagName == "*" && oElm.all)? oElm.all : oElm.getElementsByTagName(strTagName);
    var arrReturnElements = new Array();
    var oAttributeValue = (typeof strAttributeValue != "undefined")? new RegExp("(^|\s)" + strAttributeValue + "(\s|$)") : null;
    var oCurrent;
    var oAttribute;
    for(var i=0; i<arrElements.length; i++){
        oCurrent = arrElements[i];
        oAttribute = oCurrent.getAttribute && oCurrent.getAttribute(strAttributeName);
        if(typeof oAttribute == "string" && oAttribute.length > 0){
            if(typeof strAttributeValue == "undefined" || (oAttributeValue && oAttributeValue.test(oAttribute))){
                arrReturnElements.push(oCurrent);
            }
        }
    }
    return arrReturnElements;
}

/*
 * Adds a object to the context menu
 * and returns a reference to that object
 */
libxEnv.addMenuObject = function () {
    var contMenu = document.getElementById("contentAreaContextMenu");  
    var m = document.createElement ( "menuitem" );
    contMenu.insertBefore ( m, 
            document.getElementById ( "libx-endholder" ) );

    m.docommand = function () { 
        alert("LibX bug: menu handler not set!");
    }
    m.setAttribute ( 'oncommand', "this.docommand(event);" );

    /*
     * Sets the label of an item
     */
    m.setLabel = function ( text ) {
        this.setAttribute ( 'label', text );
    }
    
    /*
     * Sets the event function for the menuitem
     */
    m.setHandler = function ( handlerfunc ) {
        this.docommand = handlerfunc;
    }
    
    /*
     * Sets the image for a menu object
     */
    m.setImage = function () {
        this.setAttribute ( 'image', 
                    document.getElementById ( 'toolbarFieldsMenu' ).
                    getAttribute ( 'image' ) );
        this.setAttribute ( 'class', 'menuitem-iconic' );

        // crude work-around alert.
        // if setImage is called, at least one 1 item is displayed,
        // so make the menu separator visible
        libxEnv.setVisible("libx-context-menu-separator", true);
    }
    
    m.setVisible = function( visible ) {
        this.setAttribute ( "hidden", !visible );
    }

    m.setActive = function ( active ) {
        this.setAttribute ( "disabled", !active );
    }

    return m;
}

/*
 * Event handler called when context menu is hidden
 */
libxEnv.contextMenuHidden = function (e) {
    if (e.target.id != 'contentAreaContextMenu') 
        return;
        
    var par = document.getElementById ( 'contentAreaContextMenu');
    for ( var i = 0; i < LibxNodes.length; i++ ) {
        var node = LibxNodes[i];
        par.removeChild ( node );    
    }
    LibxNodes = new Array();
    libxEnv.contextMenuLoaded = false;
}

/*
 * Event handler called right before context menu is shown.
 */
libxEnv.contextMenuShowing = function (e) {
    if (e.target.id != 'contentAreaContextMenu')
        return;

    libxContextMenuShowing ( popuphelper );
}

// vim: ts=4
