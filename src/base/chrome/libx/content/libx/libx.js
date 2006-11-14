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

// Base class for all catalogs
function libxCatalog() { }

libxCatalog.prototype = {
    xisbn: { },
    setIf: function (prop, what) {
        if (what != null)
            this[prop] = libxConvertToBoolean(what);
    },
    makeSubjectSearch: function(subject) {
        return this.makeSearch("d", subject);
    },
    makeTitleSearch: function(title) {
        return this.makeSearch("t", title);
    },
    makeISBNSearch: function(isbn) {
        return this.makeSearch("i", isbn);
    },
    makeISSNSearch: function(isbn) {
        return this.makeSearch("is", isbn);
    },
    makeAuthorSearch: function(author) {
        return this.makeSearch("a", author);
    },
    makeCallnoSearch: function(callno) {
        return this.makeSearch("c", callno);
    },
    makeKeywordSearch: function(keyword) {
        return this.makeSearch("Y", keyword);
    },
    // Create a url that requests an item by ISBN from the xISBN service,
    // if the current catalog supports it
    makeXISBNRequest: function(isbn) {
        if (this.xisbn.oai) {
            // jeff young from OCLC says to use this URL for libraries registered
            // with their service, see http://alcme.oclc.org/bookmarks/
            return "http://alcme.oclc.org/bookmarks/servlet/OAIHandler/extension"
                + "?verb=FRBRRedirect&identifier=" + this.xisbn.oai
                + "&isbn=" + isbn;
        } else
        if (this.xisbn.opacid) {
            // xISBN barks at https URLs
            return "http://labs.oclc.org/xisbn/liblook?baseURL=" 
                + this.url.replace(/https/, "http")
                + "&opacID=" + this.xisbn.opacid + "&isbn=" + isbn;
        } else {
            return this.makeISBNSearch(isbn);
        }
    },
    linkByISBN: function (isbn) {
        if (this.xisbn.cues) {
            return this.makeXISBNRequest(isbn);
        } else {
            return this.makeISBNSearch(isbn);
        }
    },

    // given an array of {searchType: xxx, searchTerms: xxx } items
    // formulate a query against this catalog
    search: function (fields) {
        if (fields.length == 0) {//nothing entered
            fields = [{searchType: 'Y', searchTerms: ""}];
        }
        for (var i = 0; i < fields.length; i++) {
            if (!this.supportsSearchType(fields[i].searchType)) {
                return;
            }
            libxAdjustISNSearchType(fields[i]);
        }
        if (fields.length == 1) {//single search field
            var url = this.makeSearch(fields[0].searchType, fields[0].searchTerms);
        } else {// user requested multiple search fields, do advanced search
            var url = this.makeAdvancedSearch(fields);
        }
        if (url != null) {
            openSearchWindow(url, this.doNotURIEncode);
        } else {
            libxLog("Could not construct search");
        }
    },
    /* the default implementation looks at the options property
     * to decide which options are supported.
     */
    supportsSearchType: function (stype) {
        return (";" + this.options + ";").match(";" + stype + ";");
    },
    options: "Y;t;a;d;i;c"
}

function libxAddToPrototype(prototype, addedmethods) 
{
    for (var m in addedmethods) {
        prototype[m] = addedmethods[m];
    }
}

/*
 * Support generic "bookmarklet" style searches
 * The id's %t, %jt etc. in the URL are being replaced with the entered terms
 */
function libxBookmarklet(catprefix) { }

libxBookmarklet.prototype = new libxCatalog();

libxAddToPrototype(libxBookmarklet.prototype, {
    doNotURIEncode: true,
    makeSearch: function (stype, sterm) {
        return this.makeAdvancedSearch([{searchType: stype, searchTerms: sterm}]);
    },
    makeAdvancedSearch: function (fields) {
        var url = this.url;
        /* Example of URL that uses %SWITCH statement and %termN:
            $catalog1.catalog.url=http://www.lib.umich.edu/ejournals/ejsearch.php?searchBy=%SWITCH{%type1}{t:KT}{d:KS}{sot:TV}{soi:IV}&AVterm1=%term1&Cnect2=AND&AVterm2=%term2&Cnect3=AND&AVterm3=%term3&New=All&submit=Find
        */
        var swtch;
        var swtchre = /%SWITCH\{(%[a-z0-9]+)\}\{(([^}]+(\}\{)?)+)}/i;
        while (swtch = url.match(swtchre)) {
            var s = swtch[1];
            var repl = "";
            var caseargs = swtch[2].split("}{");
            var m = s.match(/^%type(\d+)/);
            var switch_arg = null;
            if (m) {
                if (m[1] <= fields.length)
                    switch_arg = fields[m[1] - 1].searchType;
            } else {
                m = s.match(/^%term(\d+)/);
                if (m) {
                    if (m[1] <= fields.length)
                        switch_arg = fields[m[1] - 1].searchTerms;
                } else
                    libxLog("invalid switch_arg '" + s + "', must be %termX or %typeX");
            }
            for (var i = 0; switch_arg != null && i < caseargs.length; i++) {
                var re = new RegExp("^" + switch_arg + ":(\\S*)$");
                var m = re.exec(caseargs[i]);
                if (m) {
                    repl = m[1];
                    break;
                }
            }
            url = url.replace(swtchre, repl);
        }

        // replace %termN with corresponding search terms
        for (var i = 0; i < fields.length; i++) {
           url = url.replace("%term" + (i+1), encodeURIComponent(fields[i].searchTerms), "g");
        }
        // clear out remaining %termN
        url = url.replace(/%term\d+/g, "");

        // replace %X as with terms
        for (var i = 0; i < fields.length; i++) {
           url = url.replace("%" + fields[i].searchType, encodeURIComponent(fields[i].searchTerms));
        }

        // clear out other %values if defined
        for (var option in libxDropdownOptions) {
            // to allow %is, %i, and %issue require that label be followed by a non-letter
            // XXX not very robust.
            url = url.replace(new RegExp("%" + option + "(?![a-zA-Z0-9])"), "", "g");
        }
        return url;
    }
});

function libxScholarSearch(catprefix) { }

libxScholarSearch.prototype = new libxCatalog();

libxAddToPrototype(libxScholarSearch.prototype, {
    options: "Y;at;jt;a",
    makeSearch: function (stype, sterm) {
        return this.makeAdvancedSearch([{searchType: stype, searchTerms: sterm}]);
    },
    makeAdvancedSearch: function (fields) {
        this.libxScholarSearch(fields);
        return null;    // libxScholarSearch() will have already opened the window
    },

    /*
     * Formulate a google scholar search from entered search fields
     * when user presses the Scholar button.
     */
    libxScholarSearch: function (fields) {
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
            case 'jt':
                t += fields[i].searchTerms;
                break;
            }
        }
        var q = "";
        if (k == "" && at != "") {
            // we cannot use allintitle: when keywords are given also
            q = "allintitle: " + at;
        } else {
            q = k + " " + at;
        }
        if (a != "") {
            q += " author: " + a;
        }
        magicSearch(q, t, true);    // true means suppress heuristics
    }
});

/*
 * Construct a new catalog, return reference to it, based on settings
 * prefixed by catprefix (which is "" for primary catalog, "catalog1.", etc.)
 */
function libxInitializeCatalog(cattype, catprefix)
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
		libxLog("Catalog type " + cattype + " not supported.");
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

    libxLog("registered " + cat.name + " (type=" + cattype + ", options=" + cat.options + ")");
    return cat;
}

// initialize the catalogs we will use, including the 
// default library catalog
function libxInitializeCatalogs() 
{
    searchCatalogs = new Array();
    var cattype = libxGetProperty("catalog.type");
    libraryCatalog = libxInitializeCatalog(cattype, "");
    searchCatalogs.push(libraryCatalog);

    // we insert additional catalogs before the openurl button for now
    var catdropdown = document.getElementById("libxcatalogs");
    var openurlsbutton = document.getElementById("libx-openurl-search-menuitem");

    function addCatalog(catprefix, catnumber)
    {
        try {
            var cat = libxInitializeCatalog(cattype, catprefix + ".");
            searchCatalogs.push(cat);

            var newbutton = document.createElement("menuitem");
            newbutton.setAttribute("oncommand", "libxSelectCatalog(this,event);");
            newbutton.setAttribute("value", catnumber);
            newbutton.setAttribute("label", "Search " + libxGetProperty(catprefix + ".catalog.name") + " ");
            catdropdown.insertBefore(newbutton, openurlsbutton);
        } catch (e) {
            libxLog("libxInitializeCatalog failed: " + e);
        }
    }

    for (var addcatno = 1; 
         (cattype = libxGetProperty("catalog" + addcatno + ".catalog.type")) != null; 
         addcatno++)
    {
        addCatalog("catalog" + addcatno, addcatno);
    }
    if ((cattype = libxGetProperty("scholar.catalog.type")) != "") {
        if (!libxConfig.options.disablescholar)
            addCatalog("scholar", addcatno++);
    }

    // record initially selected catalog and activate its search options
    catdropdown.firstChild.value = 0;  
    libxSelectedCatalog = searchCatalogs[0];
    libxActivateCatalogOptions(libxSelectedCatalog);

    // copy initial label to toolbarbutton parent from menuitem first child
    catdropdown.firstChild.setAttribute("label", "Search " + libraryCatalog.name + " ");
    catdropdown.parentNode.label = catdropdown.firstChild.label;
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
        libxLog("Unsupported OpenURL type: " + ourltype);
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
    libxInitializeProperties();

    // initialize menu at top left of toolbar
    // these are now additional properties:
    // link1.label=...
    // link1.url=...
    // and so on.
    var libxmenu = document.getElementById("libxmenu");
    var libxmenusep = document.getElementById("libxmenu.separator");
    var label = null;
    for (var link = 1;
            (label = libxGetProperty("link" + link + ".label")) != null;
            link++) 
    {
        var url = libxGetProperty("link" + link + ".url");
        var mitem = document.createElement("menuitem");
        mitem.setAttribute("label", label);
        mitem.setAttribute("oncommand", "openSearchWindow('" + url + "');");
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
    for (var opt = 1;
        (label = libxGetProperty("libx.searchoption" + opt + ".label")) != null;
        opt++) 
    {
        var mitem = document.createElement("menuitem");
        libxAddToPrototype(mitem, { 
            value: libxGetProperty("libx.searchoption" + opt + ".value"),
            label: label,
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
    var searchbutton = document.getElementById("search-button");
    new TextDropTarget(function (data) {
        libxSelectedCatalog.search([{ searchType: 'Y', searchTerms: data }]);
    }).attachToElement(searchbutton);
    libxInitializePreferences("libx.displaypref");

    document.getElementById("libx-menu-toolbarbutton")
        .setAttribute("tooltiptext", "LibX - " + libxGetProperty('edition'));
}

/*
 * initialize/record a change in preference
 * We assume 
 * - that properties are choices offered in a menupopup wrapping menuitems
 * - that the name of the property is also the id of the surrounding menupopup
 * - that the name of the value is also the id of the menuitem child reflecting the choice
 */
function recordPreference(property, value)
{
    var parent = document.getElementById(property);
    for (var i = 0; i < parent.childNodes.length; i++) {
        parent.childNodes.item(i).setAttribute('checked', parent.childNodes.item(i).getAttribute('id') == value);
    }
    nsPreferences.setUnicharPref(property, value);
}

function libxInitializePreferences(property)
{
    var menuchild = nsPreferences.getLocalizedUnicharPref(property, "libx.newtabswitch");
    document.getElementById(menuchild).setAttribute("checked", true);
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
	
    if (libxProxy) {
        // activate proxify link whenever user right-clicked over hyperlink
        if (popuphelper.isOverLink()) {
            libxproxify.label = libxGetProperty("proxy.follow.label", [libxProxy.name]);
        } else {
            libxproxify.label = libxGetProperty("proxy.reload.label", [libxProxy.name]);
        }
    }
            
    var openurlName = openUrlResolver ? openUrlResolver.name : null;
	pureISN = null;//forget pureISN
	pureDOI = null;//forget pureDOI
	purePMID = null;//forget purePMID
	if (!popuphelper.isTextSelected()) {//no selection
		keywordsearch.hidden = titlesearch.hidden = authorsearch.hidden = false;
        keywordsearch.label = libxGetProperty("contextmenu.keywordsearch.label", [libraryCatalog.name]);
        titlesearch.label = libxGetProperty("contextmenu.titlesearch.label", [libraryCatalog.name]);
        authorsearch.label = libxGetProperty("contextmenu.authorsearch.label", [libraryCatalog.name]);

		if (popuphelper.isOverLink()) {
			pureDOI = isDOI(decodeURI(popuphelper.getNode().href));//does href of hyperlink over which user right-clicked contain a doi?
			if (pureDOI != null && openUrlResolver) {
				doisearch.label = libxGetProperty("openurldoisearch.label", [openurlName, pureDOI]);
				doisearch.hidden = false;
			}
		}
		return;// skip rest of function
	}
	//end of no selection, code below assumes there is a selection
	//check selection for ISBN or ISSN or DOI and activate appropriate menuitems
	var s = popuphelper.getSelection();
	if (pureISN = isISBN(s)) {
		isbnsearch.label = libxGetProperty("isbnsearch.label", [libraryCatalog.name, pureISN]);
		xisbnsearch.label = libxGetProperty("xisbnsearch.label", [pureISN]);
		isbnsearch.hidden = false;
		if (libraryCatalog.xisbn.opacid) {   // only true if xISBN is supported for this catalog
		    xisbnsearch.hidden = false;
		}
	} else
	if (pureISN = isISSN(s)) {
		isbnsearch.label = libxGetProperty("issnsearch.label", [libraryCatalog.name, pureISN]);
		isbnsearch.hidden = false;
		if (openUrlResolver) {
		    openurlissnsearch.label = libxGetProperty("openurlissnsearch.label", [openurlName, pureISN]);
		    openurlissnsearch.hidden = false;
		}
	}

    if (openUrlResolver) {
        purePMID = isPMID(s);
    }
	if (purePMID != null) {
		pmidsearch.label = libxGetProperty("openurlpmidsearch.label", [openurlName, purePMID]);
		pmidsearch.hidden = false;
	}

    // show keyword, title, author only if none of IS*N or PMID was recognized
	if (pureISN == null && purePMID == null) {
		keywordsearch.hidden = titlesearch.hidden = authorsearch.hidden = false;
		if (!libxConfig.options.disablescholar) 
            scholarsearch.hidden = false;
        keywordsearch.label = libxGetProperty("contextmenu.keywordsearch.label", [libraryCatalog.name]);
        titlesearch.label = libxGetProperty("contextmenu.titlesearch.label", [libraryCatalog.name]);
        authorsearch.label = libxGetProperty("contextmenu.authorsearch.label", [libraryCatalog.name]);
    }

    // DOI displays in addition to keyword, title, author
	pureDOI = isDOI(s);
	if (pureDOI != null && openUrlResolver) {
		doisearch.label = libxGetProperty("openurldoisearch.label", [openurlName, pureDOI]);
		doisearch.hidden = false;
	}
}

// does this selection contain a pubmed id?
function isPMID(s) {
	var m = s.match(/PMID[^\d]*(\d+)/i);
    if (m != null) {
        return m[1];
    }
    m = s.match(/PubMed\s*ID[^\d]*(\d+)/i);
    if (m != null) {
        return m[1];
    }
    return null;
}

// run a search against Scholar from the current selection
function doMagicSearchBySelection() {
	var s = popuphelper.getSelection();
	magicSearch(s);
}

// output a message to the JS console
function libxLog(msg) {
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage("LibX: " + msg);
}

// open search results, according to user preferences
function openSearchWindow(url, donoturiencode) {
    var what = nsPreferences.getLocalizedUnicharPref("libx.displaypref", "libx.newtabswitch");
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

/* fix this later should it be necessary - so far, we were able to get at every catalog via GET
   this code is intended should POST be necessary in the future.
*/
//    if (typeof url == "string") {
//	    getBrowser().addTab(encodeURI(url));
//	} else
//   if (url.constructor.name == "Array") {  // for catalog that require POST - UNTESTED code
//	    getBrowser().addTab(encodeURI(url[0]), null, null, /*aPostData*/url[1]);
//    }
}


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
	sterm = sterm.replace(/[^A-Za-z0-9_&:\222\'\-\s]/g, " ").replace(/\s+/g, " ");
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

// use OCLC's xisbn's search
// XXX investigate processing these results better - otherwise the user has to click through
// dozens or more results
function doXisbnSearch() {
	openSearchWindow(libraryCatalog.makeXISBNRequest(pureISN)); 
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
		openSearchWindow(libxProxy.rewriteURL(href));
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
		libxLog("Unsupported proxy.type=" + proxytype);
        /* FALLTHROUGH */
    case null:
    case "":
        // hide proxy entry in context menu if no proxy is defined
		var libxproxify = document.getElementById("libx-proxify");
		libxproxify.hidden = true;
        return;
	}
    libxProxy.type = proxytype;
    if (libxConfig.xml) {
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
	var sb = document.getElementById("search-button");
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
    nsPreferences.setBoolPref("libx.autolink", value);
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
    libxConfig.options.autolink_active = nsPreferences.getBoolPref("libx.autolink", true);
    m.setAttribute('checked', libxConfig.options.autolink_active);
    m.setAttribute('oncommand', "libxSelectAutolink(this.getAttribute('checked'));");
    hbox.parentNode.insertBefore(m, hbox);
}

// vim: ts=4
