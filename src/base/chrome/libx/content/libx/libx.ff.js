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
  
  // open search results, according to user preferences
libxEnv.openSearchWindow = function (url, donoturiencode, pref) {
    var what = pref ? pref : getUnicharPref("libx.displaypref", "libx.newtabswitch");
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
    if (!getBoolPref("libx.magic.debug", false))
        return;

    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
               .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage("magic: " + msg);
}


// output a message to the JS console
libxEnv.libxLog = function (msg) {
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage("LibX: " + msg);
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


function addCatalogByProperties(cattype, catprefix, catnumber)
{
    try {
        var cat = libxInitializeCatalogFromProperties(cattype, catprefix + ".");
        searchCatalogs.push(cat);

        var newbutton = document.createElement("menuitem");
        newbutton.setAttribute("oncommand", "libxEnv.SelectCatalog(this,event);");
        newbutton.setAttribute("value", catnumber);
        newbutton.setAttribute("label", "Search " + libxGetProperty(catprefix + ".catalog.name") + " ");
        catdropdown.insertBefore(newbutton, openurlsbutton);
    } catch (e) {
        libxEnv.libxLog("libxInitializeCatalog failed: " + e);
    }
}

/*
 * Construct a new catalog, return reference to it, based on settings
 * prefixed by catprefix (which is "" for primary catalog, "catalog1.", etc.)
 * WILL BE PHASED OUT
 */
function libxInitializeCatalogFromProperties(cattype, catprefix)
{
    var cat = null;
    switch (cattype) {
    case "scholar":
        cat = new libxScholarSearch(catprefix);
        break;

    case "bookmarklet":
        cat = new libxBookmarklet(catprefix);
        break;

    case "millenium":
        cat = new MilleniumOPAC();
        cat.setIf('searchscope', libxGetProperty(catprefix + "catalog.searchscope"));
        cat.setIf('keywordcode', libxGetProperty(catprefix + "millenium.keywordcode"));
        cat.setIf('advancedcode', libxGetProperty(catprefix + "millenium.advancedcode"));
        cat.setIf('journaltitlecode', libxGetProperty(catprefix + "millenium.journaltitlecode"));
        cat.setIf('sort', libxGetProperty(catprefix + "millenium.sort"));
        cat.setIf('searchform', libxGetProperty(catprefix + "millenium.searchform"));
        break;

    case "horizon":
        cat = new HorizonOPAC();
        // some catalogs use ISBNBR+ISSNBR (e.g., JHU)
        // others have an index ISBNEX that does exact matching 
        // on both ISSN & ISBN
        cat.setIf('isbn', libxGetProperty(catprefix + "horizon.isbn"));
        cat.setIf('issn', libxGetProperty(catprefix + "horizon.issn"));
        cat.setIf('callno', libxGetProperty(catprefix + "horizon.callno"));
        cat.setIf('keyword', libxGetProperty(catprefix + "horizon.keyword"));
        cat.setIf('title', libxGetProperty(catprefix + "horizon.title"));
        cat.setIf('journaltitle', libxGetProperty(catprefix + "horizon.journaltitle"));
        cat.setIf('subject', libxGetProperty(catprefix + "horizon.subject"));
        cat.setIf('author', libxGetProperty(catprefix + "horizon.author"));
        cat.setIf('profile', libxGetProperty(catprefix + "horizon.profile"));
        break;

    case "aleph":
        cat = new AlephOPAC();
        cat.setIf('localbase', libxGetProperty(catprefix + 'aleph.localbase'));
        cat.setIf('title', libxGetProperty(catprefix + 'aleph.title'));
        cat.setIf('journaltitle', libxGetProperty(catprefix + 'aleph.journaltitle'));
        cat.setIf('subject', libxGetProperty(catprefix + 'aleph.subject'));
        cat.setIf('author', libxGetProperty(catprefix + 'aleph.author'));
        cat.setIf('isbn', libxGetProperty(catprefix + 'aleph.isbn'));
        cat.setIf('issn', libxGetProperty(catprefix + 'aleph.issn'));
        cat.setIf('callno', libxGetProperty(catprefix + 'aleph.callno'));
        cat.setIf('keyword', libxGetProperty(catprefix + 'aleph.keyword'));
        cat.setIf('findfunc', libxGetProperty(catprefix + 'aleph.findfunc'));
        cat.setIf('advfindfunc', libxGetProperty(catprefix + 'aleph.advfindfunc'));
        cat.setIf('scanfunc', libxGetProperty(catprefix + 'aleph.scanfunc'));
        cat.setIf('scanindexlist', libxGetProperty(catprefix + 'aleph.scan.index.list'));
        break;

    case "voyager":
        cat = new VoyagerOPAC();
        cat.setIf('advancedsearchforissn', libxGetProperty(catprefix + "voyager.advancedsearchforissn"));
        break;

    case "sirsi":
        cat = new SirsiOPAC();
        cat.setIf('searchscope', libxGetProperty(catprefix + "catalog.searchscope"));
        cat.setIf('sort', libxGetProperty(catprefix + "sirsi.sort"));
        break;

    case "sersol":
        cat = new ArticleLinker();
        break;

    case "sfx":
        cat = new SFX();
        break;

    case "centralsearch":
        cat = new CentralSearch();
        cat.setIf('sslibhash', libxGetProperty(catprefix + "centralsearch.ssLibHash"));
        cat.setIf('searchby', libxGetProperty(catprefix + "centralsearch.searchBy"));
        cat.setIf('catids', libxGetProperty(catprefix + "centralsearch.catIDs"));
        cat.setIf('catgroupids', libxGetProperty(catprefix + "centralsearch.catGroupIDs"));
        cat.setIf('dbidlist', libxGetProperty(catprefix + "centralsearch.dbIDList"));
        break;

    default:
        libxEnv.libxLog("Catalog type " + cattype + " not supported.");
    case null:
    case "":
        return null;
    }
    cat.setIf = libxCatalog.prototype.setIf;
    cat.setIf('url', libxGetProperty(catprefix + "catalog.url"));
    cat.setIf('sid', libxGetProperty(catprefix + "catalog.sid"));
    cat.setIf('name', libxGetProperty(catprefix + "catalog.name")); 
    cat.setIf('options', libxGetProperty(catprefix + "catalog.options"));
    cat.urlregexp = new RegExp(libxGetProperty(catprefix + "catalog.urlregexp"));
    cat.prefix = catprefix;

    if (cat.xisbn == undefined)
       cat.xisbn = new Object();

    cat.xisbn.setIf = cat.setIf;
    cat.xisbn.setIf('cues', libxConvertToBoolean(libxGetProperty(catprefix + "cues.use.xisbn")));
    // override xisbn opac id if it is not the default
    cat.xisbn.setIf('opacid', libxGetProperty(catprefix + "catalog.xisbn.opacid"));
    cat.xisbn.setIf('oai', libxGetProperty(catprefix + "catalog.xisbn.oai"));

    libxEnv.libxLog("registered " + cat.name + " (type=" + cattype + ", options=" + cat.options + ")");
    return cat;
}

// initialize the catalogs we will use, including the 
// default library catalog
function libxInitializeCatalogsFromProperties() 
{
    searchCatalogs = new Array();
    var cattype = libxGetProperty("catalog.type");
    libraryCatalog = libxInitializeCatalogFromProperties(cattype, "");
    searchCatalogs.push(libraryCatalog);

    // we insert additional catalogs before the openurl button for now
    var catdropdown = document.getElementById("libxcatalogs");
    var openurlsbutton = document.getElementById("libx-openurl-search-menuitem");


    for (var addcatno = 1; 
         (cattype = libxGetProperty("catalog" + addcatno + ".catalog.type")) != null; 
         addcatno++)
    {
        addCatalogByProperties(cattype, "catalog" + addcatno, addcatno);
    }
    
    if ((cattype = libxGetProperty("scholar.catalog.type")) != "") {
        if (!libxConfig.options.disablescholar)
            addCatalogByProperties("scholar", addcatno++);
    }

    // record initially selected catalog and activate its search options
    catdropdown.firstChild.value = 0;  
    libxSelectedCatalog = searchCatalogs[0];
    libxActivateCatalogOptions(libxSelectedCatalog);

    // copy initial label to toolbarbutton parent from menuitem first child
    catdropdown.firstChild.setAttribute("label", "Search " + libraryCatalog.name + " ");
    catdropdown.parentNode.label = catdropdown.firstChild.label;
}

libxEnv.initializeContextMenu = function () {
    popuphelper = new ContextPopupHelper();
    var menu = document.getElementById("contentAreaContextMenu");
    menu.addEventListener("popupshowing", libxContextPopupShowing, false);
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
    
    /* Loading from XML */
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
    if ( libxEnv.xmlDoc.xml )
    {
        var libxSearchOptions = 
            xpathFindNodes(libxEnv.xmlDoc.xml, "/edition/searchoptions/*");
        for (var option = 0; option < libxSearchOptions.length; option++ )
        {
            var mitem = document.createElement("menuitem");
            libxEnv.xmlDoc.copyAttributes ( libxSearchOptions[option], mitem );
            mitem.setAttribute('oncommand', 'setFieldType(this);');
            libxDropdownOptions[mitem.value] = mitem;
        }
    }   
    else
    {
        
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
    }
    
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

// vim: ts=4
