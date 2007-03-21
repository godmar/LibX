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
 
if ( libxEnv == null )
  var libxEnv = new Object(); 
 
 /*
  * Designed to hold Firefox-specific code for the Libx extension
  */
 
libxEnv.init = function() {
    libxInitializeAutolink();
    libxInitializeDFU();
}
  
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
  
  
libxEnv.getXMLDocument = function ( ) {
    var configurl = new XMLHttpRequest();
    configurl.open('GET', "chrome://libx/content/config.xml", false);
    configurl.send(null);
    return configurl.responseXML;
}
  
  
libxEnv.libxMagicLog = function (msg) {
    if (!libxEnv.getBoolPref("libx.magic.debug", false))
        return;

    libxEnv.libxLog(msg, 'Magic');
}

libxEnv.xpathLog = function (msg) {
    if (!libxEnv.getBoolPref("libx.xpath.debug", false))
        return;
    
    libxEnv.libxLog(msg, 'xpathutil');
}


// output a message to the JS console
libxEnv.libxLog = function (msg, prefix) {
    if(!prefix) {
        prefix = 'LibX';
    }
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
        .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage(prefix + ": " + msg);
}

//Just use the mozilla event listener function
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
    if (mitem.value == "openurl")
        libxSelectedCatalog = openUrlResolver;
    else
        libxSelectedCatalog = searchCatalogs[mitem.value];

    libxActivateCatalogOptions(libxSelectedCatalog);
}


libxEnv.initializeContextMenu = function () {
    popuphelper = new ContextPopupHelper();
    var menu = document.getElementById("contentAreaContextMenu");
    menu.addEventListener("popupshowing", libxContextPopupShowing, false);
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
        catdropdown.insertBefore(newbutton, openurlsbutton);
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
        libxEnv.xmlDoc.copyAttributes ( libxSearchOptions[option], mitem );
        mitem.setAttribute('oncommand', 'setFieldType(this);');
        libxDropdownOptions[mitem.value] = mitem;
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
        .setAttribute("tooltiptext", "LibX - " + 
            libxEnv.xmlDoc.getAttr("/edition/name", "edition" ) );
        
    initializeMenuObjects();
}

libxEnv.setVisible = function(elemName, hide) {
    elem = document.getElementById(elemName);
    if(elem != null) {
        elem.hidden = !hide;
    }
}

libxEnv.setGUIAttribute = function(elemName, attrName, attrValue) {
    elem = document.getElementById(elemName);
    if(elem != null) {
        elem.setAttribute(attrName, attrValue);
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
    libxEnv.setBoolPref("libx.autolink", value);
    libxEnv.options.autolink_active = value;
    if (value)
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
    libxEnv.options.autolink_active = libxEnv.getBoolPref("libx.autolink", true);
    m.setAttribute('checked', libxEnv.options.autolink_active);
    m.setAttribute('oncommand', "libxSelectAutolink(this.getAttribute('checked'));");
    hbox.parentNode.insertBefore(m, hbox);
}


// vim: ts=4
