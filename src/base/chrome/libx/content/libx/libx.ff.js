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
 
libxEnv.ff = new Object(); /* Holder for FF specific objects */


/*  init
 * Initialize Firefox-specific parts.
 */
libxEnv.init = function() {

    // this function is called after the entire overlay has been built
    // we must wait until here before calling document.getElementById
    libxProps = document.getElementById("libx-string-bundle");

    libxEnv.ff.toolbar = document.getElementById('libx-toolbar');
    libxInitializeAutolink();
    
    function libxToolbarMenuShowing() {
        var m = document.getElementById ( 'libx.autolink' );
        libxEnv.options.autolink_active = libxEnv.getBoolPref("libx.autolink", 
			true);
        m.setAttribute('checked', libxEnv.options.autolink_active);
    }

    var menu = document.getElementById ( 'libxmenu' );
    menu.addEventListener ( 'popupshowing', libxToolbarMenuShowing, false );
        
    /* reflect visibility of toolbar in checkbox when lower-right menu is shown. */
    menu = document.getElementById ( 'libx-statusbar-popup' );
    menu.addEventListener('popupshowing', function () {
        var mitem = document.getElementById('libx-statusbar-togglebar-item');
        mitem.setAttribute('checked', !libxEnv.ff.toolbar.collapsed);
    }, false);
   
    libxEnv.hash = new libxEnv.hashClass();
    libxEnv.hoverInit();
    
    
    if ( libxEnv.getBoolPref ( 'libx.firstrun', true ) ) {
       // Set Timeout of 1 to run after firefox has finished initializing
       // * Same approach as Google Toolbar
       setTimeout (
       function () {
                       window.openDialog ( "chrome://libx/content/firstrun.xul",
               "LibX Initial Configuration", " centerscreen, chrome, modal, resizable",
               {
               		toolbar: document.getElementById ( 'libx-toolbar' ), 
	               	proxyAjaxable: ( libxProxy != null && libxProxy.canCheck() ) 
               }
               );
       }, 1 );
       libxEnv.setBoolPref ( 'libx.firstrun', false );
    }
}

/* Invoked when hotkey for visibility is pressed. 
 * Returns true if toolbar is not collapsed.
 * We use 'collapsed' here instead of 'hidden' since collapsed is persistent and since the
 * toolbox's View menu as well as View -> Toolbar use collapsed.
 */
libxEnv.ff.toggleToolBar = function (toolbarname) {
    var tbar = document.getElementById(toolbarname);
    tbar.collapsed = !tbar.collapsed;
    // persist, see chrome://browser/content/browser.js
    tbar.ownerDocument.persist(tbar.id, "collapsed");

    if (!tbar.collapsed) {
        setTimeout ( function () { 
            libxSearchFieldVbox.childNodes.item(0).firstChild.nextSibling.firstChild.focus(); 
        }, 100);
    }
    return !tbar.collapsed;
}
  
/* 
 * Posting. Follows http://developer.mozilla.org/en/docs/Code_snippets:Post_data_to_window
 */
libxEnv.convertPostString2PostData = function (dataString) {
    // var dataString = "name1=data1&name2=data2";

    // POST method requests must wrap the encoded text in a MIME stream
    const Cc = Components.classes;
    const Ci = Components.interfaces;
    var stringStream = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
    if ("data" in stringStream) // Gecko 1.9 or newer
        stringStream.data = dataString;
    else // 1.8 or older
        stringStream.setData(dataString, dataString.length);

    var postData = Cc["@mozilla.org/network/mime-input-stream;1"].createInstance(Ci.nsIMIMEInputStream);
    postData.addHeader("Content-Type", "application/x-www-form-urlencoded");
    postData.addContentLength = true;
    postData.setData(stringStream);
    return postData;
}

// open search results, according to user preferences
libxEnv.openSearchWindow = function (url, pref) {
    var what = pref ? pref : libxEnv.getUnicharPref("libx.displaypref", "libx.newtabswitch");

    var isGet = typeof (url) == "string";
    var url2 = isGet ? url : url[0];

    if (isGet) {
        var tabarguments = [ url2 ];
        var windowarguments = [ url2 ];
    } else {
        var postData = libxEnv.convertPostString2PostData(url[1]);
        var tabarguments = [ url2, null, null, postData ];
        var windowarguments = [ url2, null, postData ];
    }
    switch (what) {
    case "libx.newwindow":
        if (isGet) {
            window.open(url);
        } else {
            /* The only way I could figure out is to open a new browser window, attach an 
             * onload event listener, than call loadURI.
             * This is in contradiction to:
             *   http://developer.mozilla.org/en/docs/Code_snippets:Post_data_to_window
             */
            var v = window.openDialog('chrome://browser/content', '_blank', 'all,dialog=no');
            v.addEventListener("load", function () {
                v.loadURI(url2, /* referrer*/null, postData);
            }, false);
        }

        break;

    case "libx.sametab":
        if (isGet) {
            _content.location.href = url;
        } else {
            loadURI.apply(this, windowarguments);
        }
        break;

    case "libx.newtab":
    default:
        getBrowser().addTab.apply(getBrowser(), tabarguments);
        break;

    case "libx.newtabswitch":
        var tab = getBrowser().addTab.apply(getBrowser(), tabarguments);
        getBrowser().selectedTab = tab;
        break;
    }
}

/* url: url to be retrieved
 * callback: callback to complete on asynchronous completion.
 *           if null or if omitted, operation is synchronous.
 * postdata: if given, use POST.
 */
libxEnv.getDocument = function (url, callback, postdata) {
     try {
        var httprequest = postdata !== undefined ? 'POST' : 'GET';
        var xmlhttp = new XMLHttpRequest();
        if (callback == null) {         // if callback is 'null' or omitted
            // synchronous
            xmlhttp.open(httprequest, url, false);
        } else {
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == 4) {
                    callback(xmlhttp.responseText);
                }
            };
            // asynchronous
            xmlhttp.open(httprequest, url, true);
        }
        xmlhttp.send(postdata);
        return xmlhttp.responseText;
    } 
    catch ( e ) { // File not found
        return null;
    }
}

/**
  * CAUTION THIS DOES NOT RETURN THE TEXT BUT THE HTTPREQUEST SO THAT WE CAN GET THE LAST MODIFIED HEADER 
  * The reason I put this functionallity into a new method instead of adding it to the getDocument function is that this function returns the request to give me access to the request status instead of returning the text.
  * For discussion of the return status 304 issues that is worked around here bythe if-modified-since header see the bug report: https://bugzilla.mozilla.org/show_bug.cgi?id=342977
  */
libxEnv.getDocumentRequest = function ( finfo, lastMod, callback, postdata)
{
    try {
        var httprequest = postdata !== undefined ? 'POST' : 'GET';
        var xmlhttp = new XMLHttpRequest();
        if ( callback === undefined ) { // if callback is 'null' or omitted
            // synchronous
            xmlhttp.open(httprequest, finfo.url, false);
        } else {
            xmlhttp.onreadystatechange =  function () {
                if ( xmlhttp.readyState == 4 ) {
                    libxEnv.fileCache.downloadFileCallback(xmlhttp, finfo, callback);
                }
            };
            //asynchronous
            xmlhttp.open(httprequest, finfo.url, true);
        }
        if ( lastMod == null || lastMod !== undefined )
        {
            xmlhttp.setRequestHeader( "If-Modified-Since", lastMod );
        }
        xmlhttp.send(postdata);
        return xmlhttp;
    }
    catch (e) {
        alert(e);
        return null;
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

libxEnv.getXMLConfig = function () {
    return libxEnv.getXMLDocument("chrome://libx/content/config.xml");
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
    try {
        return obj.addEventListener(event, func, b);
    }
    catch (e)
    {
        alert ( "failing function called from " + arguments.caller );
    }
}

//Moved here since IE doesn't need this code
libxEnv.addEventHandler(window, "load", 
        function () {
        var ac = document.getElementById("appcontent");
        if (ac) {
        libxEnv.addEventHandler(ac, "DOMContentLoaded", 
            libxEnv.doforurls.onPageComplete_ff, true);
        }
        },
        false);


// switch the current search type (addison, openurl, etc.)
libxEnv.SelectCatalog = function(mitem, event) {
    event.stopPropagation();

    var sb = document.getElementById("libx-search-button");
    sb.label = mitem.label;
    libxSelectedCatalog = searchCatalogs[mitem.value];
    libxEnv.setIntPref("libx.selectedcatalognumber", mitem.value);

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
    var catdropdown = document.getElementById("libxcatalogs");
    
    for ( var i = 0; i < searchCatalogs.length; i++ ) {
        var cat = searchCatalogs[i];
        var newbutton = document.createElement("menuitem");
        newbutton.setAttribute("oncommand", "libxEnv.SelectCatalog(this,event);");
        newbutton.setAttribute("value", i );
        newbutton.setAttribute("label", "Search " + cat.name + " " );
        catdropdown.appendChild(newbutton);
    }
    
    // record initially selected catalog and activate its search options
    var selectedCatalog = libxEnv.getIntPref("libx.selectedcatalognumber", 0);
    // previously selected catalog may no longer be in list
    if (selectedCatalog >= searchCatalogs.length)
        selectedCatalog = 0;    

    libxSelectedCatalog = searchCatalogs[selectedCatalog];
    libxActivateCatalogOptions(libxSelectedCatalog);
    libraryCatalog = searchCatalogs[0];
    // copy initial label to toolbarbutton parent from menuitem first child
    catdropdown.parentNode.setAttribute("label", catdropdown.childNodes.item(selectedCatalog).getAttribute("label"));
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
        libxDropdownOptions[d.getAttribute("value")] = d;
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
        mitem.setAttribute('oncommand', 'libxEnv.ff.setFieldType(this);');
        mitem.setAttribute('label', mitem.label );
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

    /*
     * Adjust styles to achieve aligned layouts.
     */
    if (navigator.userAgent.match(/.*Macintosh.*Firefox\/2/)) {
        searchbutton.style.marginTop = "-2px";
        document.getElementById("libx-menu-toolbarbutton").style.marginTop = "2px";
        document.styleSheets[0].insertRule('.libx-textbox { padding-top: 3px; padding-bottom: -1px; }',0);
        document.styleSheets[0].insertRule('.libx-toolbarbutton-with-menu { margin-top: 1px; }',0);
    }

    if (navigator.userAgent.match(/.*Macintosh.*Firefox\/3/)) {
        searchbutton.style.marginTop = "-1px";
        document.getElementById("libx-menu-toolbarbutton").style.marginTop = "2px";
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
            libxEnv.ff.setFieldType(mpp.firstChild);   // pick first entry the default
        else
            libxEnv.ff.setFieldType(newvalue);         // recreate prior selection
    }
}

// add and remove search fields.
// we do this by cloning or removing the last search field child
// the blue "add-field" button, child #2, is disabled for all children except the last
// the red "close-field" button, child #3, is enabled for all children except the first
// these function all depend intimately on the XUL used for the vbox/hbox search field stuff
libxEnv.ff.addSearchField = function () {
    var lastSearchField = libxSearchFieldVbox.lastChild;// get bottom search field
    var newSearchField = lastSearchField.cloneNode(true);// clone last search field and all its descendants
    // cloneNode, for reasons we don't understand, does not clone certain properties, such as "value"
    newSearchField.firstChild.value = lastSearchField.firstChild.value;
    lastSearchField.childNodes.item(2).setAttribute("disabled", true);// disable blue "add-field" button in what will be the next-to-last searchfield
    if (libxSearchFieldVbox.childNodes.length == 1) { // tests if only one search field is currently visible
        lastSearchField.childNodes.item(3).setAttribute("disabled", false); // OPTIONAL: show close button in first search field
        newSearchField.childNodes.item(3).setAttribute("disabled", false); // if so, the second field must have the close button enabled
    }

    // use setAttribute instead of setting property directly to avoid
    // https://bugzilla.mozilla.org/show_bug.cgi?id=433544
    newSearchField.firstChild.nextSibling.firstChild.setAttribute("value", "");
    libxSearchFieldVbox.appendChild(newSearchField);

    // provide the next option from the list as a default
    var lastSelection = lastSearchField.firstChild.value;
    var ddMenu = newSearchField.firstChild.firstChild;
    for (var i = 0; i < ddMenu.childNodes.length - 1; i++) {
        if (ddMenu.childNodes.item(i).value == lastSelection) {
            libxEnv.ff.setFieldType(ddMenu.childNodes.item(i+1));
            break;
        }
    }
    // return reference to new textbox so caller can move focus there
    return newSearchField.firstChild.nextSibling.firstChild;
}

// remove a specific search field
// user must pass reference to hbox of search field to be removed
libxEnv.ff.removeSearchField = function (fieldHbox) {
    libxSearchFieldVbox.removeChild(fieldHbox);
    var lastSearchField = libxSearchFieldVbox.lastChild;// get bottom search field
    lastSearchField.childNodes.item(2).setAttribute("disabled", false);// enable blue "add-field" button
    if (libxSearchFieldVbox.childNodes.length == 1) { // disable close button if only one search field 
        lastSearchField.childNodes.item(3).setAttribute("disabled", true);
    }
}

// this function is called when the user switches the search field type for a given search field
libxEnv.ff.setFieldType = function (menuitem) {
    //propagate label and value of menuitem to grandparent (toolbarbutton)
    menuitem.parentNode.parentNode.label = menuitem.getAttribute("label");
    menuitem.parentNode.parentNode.value = menuitem.getAttribute("value");
}

libxEnv.ff.clearAllFields = function () {
    // while there are more than one search field left, remove the last one
    while (libxSearchFieldVbox.childNodes.length > 1) {
        libxEnv.ff.removeSearchField(libxSearchFieldVbox.lastChild);
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
        alert(libxEnv.getProperty("selectterm.alert"));
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
    libxEnv.ff.addSearchField();
    //try again - this time around there should be an empty field
    addSearchFieldAs(mitem);
}

// Opens the LibX Preferences window
// About window is now part of this window.
libxEnv.ff.openPrefWindow = function () { 
    window.openDialog ( "chrome://libx/content/libxprefs.xul", 
        "LibX Preferences", " centerscreen, chrome, modal, resizable",
        { config:libxConfig, updateFunc: libxEnv.doforurls.updateDoforurls } 
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
            this.name = libxEnv.getProperty("openurlpmidsearch.label", [libxEnv.openUrlResolver.name, pmid]);
            return libxEnv.openUrlResolver.makeOpenURLForPMID(pmid);
        }
    },
    {   // DOIs
        regexp: /(10\.\S+\/[^\s,;\"\']+)/ig,
        href: function(match) { 
            if (!libxEnv.openUrlResolver) return null;
            var doi = isDOI(match[1]); 
            if (doi == null) return null;
            this.name = libxEnv.getProperty("openurldoisearch.label", [libxEnv.openUrlResolver.name, doi]);
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
        href: function(match, anchor) { 
            var isbn = isISBN(match[1], libraryCatalog.downconvertisbn13);
            if (isbn == null) return null;
            this.name = libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]);
            libxEnv.xisbn.getISBNMetadataAsText(isbn, { ifFound: function (text) {
                anchor.title = "LibX: " + libxEnv.getProperty("catsearch.label", [libraryCatalog.name, text]);
            }});    // could implement notFound handler to remove ISBN link!
            return libraryCatalog.linkByISBN(isbn);
        }
    },
    {   // ISSNs - we try to only accept 0000-0000
        regexp: /(\d{4}-\d{3}[\dx])(?!\d)/ig,
        href: function(match, anchor) { 
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
                libxEnv.xisbn.getISSNMetadataAsText(issn, { ifFound: function (text) {
                    anchor.title = "LibX: " + libxEnv.getProperty("openurlissnsearch.label", [libxEnv.openUrlResolver.name, text]);
                }});    // could implement notFound handler to remove ISSN link!
                this.name = libxEnv.getProperty("openurlissnsearch.label", [libxEnv.openUrlResolver.name, issn])
                return libxEnv.openUrlResolver.makeOpenURLForISSN(issn);
            } else {
                libxEnv.xisbn.getISSNMetadataAsText(issn, { ifFound: function (text) {
                    anchor.title = "LibX: " + libxEnv.getProperty("issnsearch.label", [libraryCatalog.name, text]);
                }});    // could implement notFound handler to remove ISSN link!
                this.name = libxEnv.getProperty("issnsearch.label", [libraryCatalog.name, issn]);
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
// modified: can now create the file if 3rd param is passed as true
libxEnv.writeToFile = function ( path, str, create ) {
    var file;
    if ( create == true )
        file = libxEnv.getFile( path, true );
    else
        file = libxEnv.getFile ( path );
    if ( !FileIO.write ( file, str ) )
        return;
        //alert( "Write didnt happen" );
}


// Returns file for given path
// modified: now able to take path with folders and will create the folders if
// not there if second param is passed as true
libxEnv.getFile = function ( path, create ) {
    var file;
    if ( path.indexOf ( 'chrome' ) == 0 )
        file = FileIO.openChrome( path );
    else {
        file = DirIO.get ( 'ProfD' );
        file.append ( 'libx' );
        
        if ( !file.exists() ) {
            DirIO.create(file);
        }
        
        var patharray = path.split( "/" );
        for (var i = 0; i < (patharray.length - 1); i++ )
        {
            file.append( patharray[i] );
            if ( !file.exists() && create ) {
                DirIO.create(file);
            }
        }
        file.append( patharray[patharray.length-1] );
        if ( !file.exists() && create ) {
            FileIO.create(file);
        }
    }
    return file;
}


//Gets the text of a file.
libxEnv.getFileText = function (path) {
    var file = libxEnv.getFile(path);
    //Note that FileIO.read closes the file, so we're not leaking a handle
    return FileIO.read(file);
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

libxEnv.getCurrentWindowContent = function() {
    return window._content;
}

/*
 * Adds a object to the context menu
 * and returns a reference to that object
 */
libxEnv.addMenuObject = function (menuEntry) {
    var contMenu = document.getElementById("contentAreaContextMenu");  
    var m = document.createElement ( "menuitem" );
    m.menuentry = menuEntry;
    contMenu.insertBefore ( m, 
            document.getElementById ( "libx-endholder" ) );

    m.docommand = function () { 
        alert("LibX bug: menu handler not set!");
    }
    m.setAttribute ( 'oncommand', "this.docommand(this.menuentry);" );

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

    m.setVisible (false);
    return m;
}

libxEnv.removeMenuObject = function (menuitem) {
    var contMenu = document.getElementById("contentAreaContextMenu");  
    contMenu.removeChild ( menuitem );
}

/*
 * Event handler called when context menu is hidden
 */
libxEnv.contextMenuHidden = function (e) {
    if (e.target.id != 'contentAreaContextMenu') 
        return;

    libxContextMenuHidden();
}

/*
 * Event handler called right before context menu is shown.
 */
libxEnv.contextMenuShowing = function (e) {
    if (e.target.id != 'contentAreaContextMenu')
        return;

    libxContextMenuShowing ();
}

/////// Preferences dialog functions
libxEnv.initPrefsGUI = function () {
    // Set the title
    var edition = libxEnv.xmlDoc.getAttr("/edition/name", "edition");
    
    if ( window.arguments )
    {
        libxConfig = window.arguments[0].config;
		libxEnv.updateFunc = window.arguments[0].updateFunc;
    }
    else { //Hide all tab panels except 'about'
        document.getElementById('libxGeneral').setAttribute('hidden', true);
        document.getElementById('libxContext').setAttribute('hidden', true);
        document.getElementById('libxAJAX').setAttribute('hidden', true);
        document.getElementById('libx-prefs-tab').setAttribute('hidden', true);
        document.getElementById('libx-contextmenu-prefs-tab').setAttribute('hidden', true);
        document.getElementById('libx-ajax-tab').setAttribute('hidden', true);
        document.getElementById('libx-feed-tab').setAttribute('hidden', true);
        document.getElementById('libxFeeds').setAttribute('hidden', true );
        document.getElementById('libxApply').setAttribute('hidden', true);
        //OK, we're done
        return;
    }

    /****** Initialize the default preferences tab *********/
    // Initialize the display preferences radiogroup
    document.getElementById ( libxEnv.getUnicharPref ( "libx.displaypref", "libx.newtabswitch" ) )
        .setAttribute ( "selected", true );
        
    // Initialize the autolinking checkbox
    document.getElementById ( "libx-autolink-checkbox" )
        .setAttribute ( "checked", libxEnv.getBoolPref ( "libx.autolink", true ) );
    
    /****** Initialize the context menu preferences tab *****/
    libxInitContextMenuTrees();
    
    /***** Initialize the AJAX tab ****/
    // Figure out whether Proxy checkbox should be grayed out or not
    var ajaxenabled = false;

    for ( var k in libxConfig.proxy ) {
        if ( libxConfig.proxy[k].urlcheckpassword )
            ajaxenabled = true;
    }
    
    if ( ajaxenabled ) {
        document.getElementById ( 'libx-proxy-ajax-checkbox')
            .setAttribute ( 'checked', libxEnv.getBoolPref ( 'libx.proxy.ajaxlabel', 'true' ) ? 'true' : 'false' );
    } else {
        document.getElementById ( 'libx-proxy-ajax-checkbox' )
            .setAttribute ( 'disabled', 'true' );
    }
    document.getElementById ( 'libx-oclc-ajax-checkbox')
        .setAttribute ( 'checked', libxEnv.getBoolPref ( 'libx.oclc.ajaxpref', 'true' ) ? 'true' : 'false' );
    
    document.getElementById ( 'libx-citeulike-checkbox' )
        .setAttribute ( 'checked', libxEnv.getBoolPref ( 'libx.urlbar.citeulike', 'true' ) ? 'true' : 'false' );
}

libxEnv.resetToDefaultPrefs = function() {
    // Re-set prefs to default
    var nodes = document.getElementsByTagName ( 'treecell' );
    for ( var i = 0; i < nodes.length; i++ ) {
        var node = nodes[i];
        if ( node.getAttribute ( 'value' ) ) {
            if(isEnabled ( node.getAttribute ( 'id' ) )) {
                node.setAttribute ( 'properties', 'enabled' );
            }
            else {
                node.setAttribute ( 'properties', 'disabled' );
            }
        }
    }
}

libxEnv.getDisplayPref = function() {
    return document.getElementById ( "libx-display-prefs" ).selectedItem.id;
};

libxEnv.getAutolinkPref = function() {
    return document.getElementById ( "libx-autolink-checkbox" ).getAttribute ( "checked" );
};

libxEnv.getProxyPref = function() {
    return document.getElementById ( 'libx-proxy-ajax-checkbox' ).getAttribute ( 'checked' ) == 'true';
};

libxEnv.getOCLCPref = function() {
    return document.getElementById ( 'libx-oclc-ajax-checkbox' ).getAttribute ( 'checked' ) == 'true';
};

libxEnv.getDFUPref = function() { return true; } //Doesn't apply to Firefox

libxEnv.getCiteulikePref = function () {
    return document.getElementById ( 'libx-citeulike-checkbox' ).getAttribute ( 'checked' ) == 'true';
}

libxEnv.removeContextMenuPreferencesTab = function (idbase) {
    var tabId = "libx-contextmenu-" + idbase + "-prefs-tab";
    var tabPanelId = "libx-" + idbase + "-tab";
    var id = "libx-contextmenu-" + idbase + "-prefs-tree";
        
    var tab = document.getElementById ( tabId );
    var tabPanel = document.getElementById ( tabPanelId );
    var tabPanels = tabPanel.parentNode;
    
    tab.parentNode.removeChild ( tab );
    tabPanel.parentNode.removeChild ( tabPanel );
}

/* Returns all nodes which are checked
 * @param tree {libxEnv.PrefsTree}  A tree node
 */
libxEnv.getEnabledNodes = function (tree) {
    enabledNodes = new Array();
    nodeList = getElementsByAttribute (tree.node, 'treecell', 'properties', 'enabled');
    for(var i = 0; i < nodeList.length; ++i) {
        var n = libxFindInTree(nodeList[i].id, tree);
        if(n) {
            enabledNodes.push(n);
        }
    }
    return enabledNodes;
}

/*  PrefsTreeRoot object
 * Object representing a tree root.
 * 
 * @param treeNode {DOMElement}  A <tree> element
 *
 * This object is a non-visible container of PrefsTreeNode objects.
 */
libxEnv.PrefsTreeRoot = function(treeNode, id)
{
    this.node = treeNode;
    this.children = new Array();
    this.id = id;
}

/*  getChild
 * Locates the child with the given ID.
 *
 * @param id {string}        The ID of the child to locate
 * 
 * @returns {PrefsTreeNode}  The located child node, or null if not found
 */
libxEnv.PrefsTreeRoot.prototype.getChild = function (id) {
    for(var i = 0; i < this.children.length; ++i) {
        if(this.children[i].id == id) {
            return this.children[i];
        }
    }
    return null;
}

/*  createChild
 * Creates a child node (PrefsTreeNode) and appends it.
 * 
 * @param label {string}     The label of the node (visible to user)
 * @param id {string}        A unique node identifier
 * @param attrs {object}     Name, value pairs used to set node attributes
 *
 * @returns {PrefsTreeNode}  The new child node
 */
libxEnv.PrefsTreeRoot.prototype.createChild = function (label, id, attrs) {
    //Create the node object.
    var child = new libxEnv.PrefsTreeNode(this.node, label, id, attrs);
    this.children.push(child);

    return child;
};

libxEnv.PrefsTreeRoot.prototype.isEnabled = function() {
    return false;
}

/*  PrefsTreeNode object
 * Object representing a tree node.
 * 
 * @param parent {DOMElement}  A <tree> or <treeitem> element
 * @param label {string}       The label of the node (visible to user)
 * @param id {string}          A unique node identifier
 * @param attrs {object}       Name, value pairs used to set node attributes
 */
libxEnv.PrefsTreeNode = function (parent, label, id, attrs) {
    var tchildren = null;
    var createAsSibling = false;

    //Attempt to get an existing treechildren node (there should only be one)
    for(var i = 0; i < parent.childNodes.length; ++i) {
        if(parent.childNodes[i].nodeName.toLowerCase() == 'treechildren') {
            tchildren = parent.childNodes[i];
            createAsSibling = true;
            break;
        }
    }

    if(!createAsSibling) { //We need to make a treechildren node
        //Configure the parent
        parent.setAttribute('container', true);
        //Create a treechildren node to form a nested list
        tchildren = document.createElement('treechildren');
        parent.appendChild(tchildren);
    }

    //Create the child node and append to parent
    var titem = document.createElement('treeitem');
    var trow = document.createElement('treerow');
    var tcell = document.createElement('treecell');
    trow.appendChild(tcell);
    titem.appendChild(trow);
    tchildren.appendChild(titem);

    //Configure child node
    for(var a in attrs) {
        tcell.setAttribute(a, attrs[a]);
    }
    //Set the node label
    tcell.setAttribute('label', label);
    titem.setAttribute('onclick', 'toggleImage(this.children[0].children[0])');

    this.node = titem;
    this.children = new Array();
    this.id = id;
};

libxEnv.PrefsTreeNode.prototype.setExpanded = function (expanded) {
    if (expanded) {
        this.node.setAttribute ( 'open', 'true' );
    }
}

libxEnv.PrefsTreeNode.prototype.isEnabled = function() {
    if(this.node.hasAttribute('properties')) {
        libxEnv.writeLog("====" + this.id + " has properties attribute " + this.node.getAttribute('properties'));
        return this.node.getAttribute('properties').toLocaleLowerCase() == 'enabled';
    }
    libxEnv.writeLog("====" + this.id + " has no properties attribute");
    return false;
}

libxEnv.PrefsTreeNode.prototype.toggleEnabled = function() {
    if(this.node.getAttribute ('properties') == 'enabled') {
        this.node.setAttribute ( 'properties', 'disabled' )
    }
    else {
        this.node.setAttribute ( 'properties', 'enabled' );
    }
}

libxEnv.PrefsTreeNode.prototype.getChild = libxEnv.PrefsTreeRoot.prototype.getChild;

libxEnv.PrefsTreeNode.prototype.createChild = libxEnv.PrefsTreeRoot.prototype.createChild;

/*
 * Initializes a tree and inserts the top-level nodes.
 * @param treeID {string}    The node id of the tree to initialize
 * @param items {array}      Labels & ids to create entries for
 * @returns {PrefsTreeNode}  Node containing the children, or null if no items
 *
 * The 'items' array is used to create top-level nodes for the tree. So if,
 * for example, we wanted to have two top-level nodes (Catalogs and
 * OpenURL Resolvers), items would have two elements.
 *
 * Each element is an object with at least the label and id properties set.
 * Any additional properties are added as attributes to the node.
 */
libxEnv.initTree = function(treeID, items) {
    if(items.length == 0) {
        return null;
    }
    var tree = document.getElementById(treeID);
    
    //Configure the tree
    tree.setAttribute('width', '250');
    tree.setAttribute('height', '150');
    tree.setAttribute('onclick', 'treeEventHandler(event, this);');
    tree.setAttribute('flex', '1');
    tree.setAttribute('container', true);

    //Create the root for the tree
    var root = new libxEnv.PrefsTreeRoot(tree, treeID);

    //Create the initial items
    for (var i in items) {
        root.createChild(items[i].label, items[i].id, items[i]);
    }
    return root;
};


// Initializes a URL Bar Icon with the setters defined below
libxEnv.urlBarIcon = function () {
    var hbox = document.getElementById ( "urlbar-icons" );
    var img = this.img = document.createElement ( "image" );
    hbox.appendChild ( img );
}

libxEnv.urlBarIcon.prototype = {
    // modifies the hidden property of the icon
    setHidden : function ( hidden ) {
        if ( hidden == 'true' || hidden == null || hidden == true )
            this.img.setAttribute ( "hidden", 'true' );
        else
            this.img.setAttribute ( "hidden", 'false' );
    },
    // sets the image src of the icon
    setImage : function ( img ) {
        this.img.setAttribute ( "src", img );
    },
    // sets the onclick function of the icon
    setOnclick : function ( onclick ) {
        libxEnv.addEventHandler ( this.img, "click", onclick );
    },
    setTooltipText : function ( text ) {
        this.img.setAttribute ( 'tooltiptext', text );
    }
}



// Initializes the event dispatcher
libxEnv.eventDispatcher.init = function  () {

    // Helper function to add an eventDispatcher of the given type to the eventDispatcher object
    // This registers the notify function as the result of an event of eventType on targetObj
    // @param libxtype -- type of event to register with
    // @param targetObj -- object to register event handler with
    // @param eventType -- type of event to watch for
    function registerEventDispatcher ( libxtype, targetObj, eventType ) {
        libxEnv.addEventHandler ( targetObj, eventType, function ( e ) {
            libxEnv.eventDispatcher.notify(libxtype, e);
        } );
    }
    
    
    // Init for onContentChange
    var container = gBrowser.tabContainer;
    registerEventDispatcher ( "onContentChange", container, "TabOpen" );
    registerEventDispatcher ( "onContentChange", container, "TabSelect" );
    var appcontent = document.getElementById ( 'appcontent' );
    registerEventDispatcher ( "onContentChange", appcontent, "pageshow" );
    //-------------------------
} 


// vim: ts=4
