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
 *                 Nathan Baker (nathanb@vt.edu)
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * LibX toolbar extension
 *
 * Author: Annette Bailey <annette.bailey@gmail.com>
 */ 
  
 
 /*
  * Designed to hold Internet Explorer-specific code for the LibX extension.
  */
 
var libxEnv = new Object();
  
libxEnv.init = function() {
    // Use user defined preferences if available
    libxMenuPrefs = new libxXMLPreferences();
    libxEnv.loadProperties();

    libxEnv.populateDropdownOptions();
    //Read in search options and add to libxConfig.searchOptions
    var libxSearchOptions = 
        libxEnv.xpath.findNodes(libxGetConfigXML().xml, "/edition/searchoptions/*");
    for (var option = 0; option < libxSearchOptions.length; option++ ) {
        var mitem = libxSearchOptions[option];
        libxConfig.searchOptions[mitem.getAttribute('value')] = mitem.getAttribute('label');
        libxDropdownOptions[mitem.value] = mitem;
    }
    
    libraryCatalog = searchCatalogs[0];

    if(libxEnv.getBoolPref('libx.dfuexec', true)) {
        libxEnv.initIEDFU();
    }
}

libxEnv.debugInit = function () {}

libxEnv.initIEDFU = function () {
    new DoForURL(/search\.yahoo\.com\/search.*p=/, function (doc) {
        var n = doc.getElementById('yschinfo').firstChild;
        var searchterms = libxEnv.getCurrentWindowContent().document.getElementById("yschsp").value;
        n.appendChild(doc.createTextNode(" "));
        n.appendChild(makeLink(doc,
                               libxEnv.getProperty("catsearch.label",
                                                   [libraryCatalog.name, searchterms]),
                               libraryCatalog.makeKeywordSearch(searchterms)));
    });
    
    // --------------------------------------------------------------------------------------------------
    // Google results pages
    // link to catalog via keyword
    new DoForURL(/google\.[a-z]+\/search.*q=/i, function (doc) {
        var n = doc.getElementById('sd');
        var searchterms = doc.gs.q.value;   // google stores its search terms there for its own use
        n.parentNode.appendChild(
                makeLink(doc,
                         libxEnv.getProperty("catsearch.label",
                                             [libraryCatalog.name, searchterms]),
                         libraryCatalog.makeKeywordSearch(searchterms)));
    });

    // --------------------------------------------------------------------------------------------------
    // Link Barnes & Noble pages to catalog via ISBN
    new DoForURL(/\.barnesandnoble\.com.*(?:EAN|isbn)=(\d{7,12}[\d|X])/i, function (doc, match) {
        var isbn = isISBN(match[1]);    // grab captured isbn in matched URL
        
        //var origTitle = libxEnv.xpath.findSingle(doc, "//h1[@id='title']");
        var origTitle = doc.getElementById('title');
        if (!origTitle) {
            return;
        }
        // make link and insert after title
        var link = makeLink(doc, libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), libraryCatalog.linkByISBN(isbn));
        origTitle.appendChild(link);
        origTitle.insertBefore(doc.createTextNode(" "), link);
    });

    var amazonAction = new DoForURL(/amazon\.com\//, doAmazon);
    var amazonUkAction = new DoForURL(/amazon\.co\.uk\//, doAmazon);
    var amazonCaAction = new DoForURL(/amazon\.ca\//, doAmazon);
    var amazonDeAction = new DoForURL(/amazon\.de\//, doAmazon);
    var amazonFrAction = new DoForURL(/amazon\.fr\//, doAmazon);

    // revised Apr 4, 2007
    function doAmazon(doc, match) {
        // extract ISBN from text <b>ISBN-10:</b>
        var n = doc.getElementById('productDetails');
        while(n.nodeName.toLowerCase() != 'table') {
            n = n.nextSibling;
        }
        n = n.getElementsByTagName('tbody')[0].firstChild;
        n = n.getElementsByTagName('td')[0].getElementsByTagName('div')[0];
        n = n.getElementsByTagName('ul')[0].getElementsByTagName('li')[3].firstChild;
        var isbn = n.nextSibling.nodeValue;

        var booktitle = null;
        var div = null;
        var buyForm = doc.getElementById('handleBuy');
        var elems = buyForm.getElementsByTagName('b');

        for(var i = 0; i < elems.length; ++i) {
            if(elems[i].attributes['class'].value == 'sans') {
                if(elems[i].parentNode.attributes['class'].value == 'buying') {
                    booktitle = elems[i];
                    div = elems[i].parentNode;
                    break;
                }
            }
        }

        if(!booktitle) {
            return;
        }
        // make link and insert after title
        var cue = makeLink(doc, 
                           libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), 
                           libraryCatalog.linkByISBN(isbn));
        div.insertBefore(cue, booktitle.nextSibling);
    }
}

// helper function that creates the cue logo to be inserted
// Calls into C# to get the URL for the icon.
function makeLink(doc, title, url, openurl) {
    var link = doc.createElement('a');
    link.setAttribute('title', title);
    link.setAttribute('href', url);

    var image = doc.createElement('img');
    image.setAttribute('src', libxInterface.getIconURL());
    image.setAttribute('border', '0');

    link.appendChild(image);
    return link;
}

/*  populateDropdownOptions
 * This function takes the hard-coded search options (in Firefox they are
 * hard-coded into the XUL) and populates the libxDropdownOptions object
 * with them.
 * This has got to be like the third or fourth place these things are
 * hard-coded into the LibX source (mostly as IE hacks, I think).
 */
libxEnv.populateDropdownOptions = function () {
    libxDropdownOptions['Y'] = 'Keyword';
    libxDropdownOptions['t'] = 'Title';
    libxDropdownOptions['jt'] = 'Journal Title';
    libxDropdownOptions['at'] = 'Article Title';
    libxDropdownOptions['a'] = 'Author';
    libxDropdownOptions['d'] = 'Subject';
    libxDropdownOptions['m'] = 'Genre';
    libxDropdownOptions['i'] = 'ISBN/ISSN';
    libxDropdownOptions['c'] = '&libx.call.number;';
    libxDropdownOptions['j'] = 'Dewey';
    libxDropdownOptions['doi'] = 'DOI';
    libxDropdownOptions['pmid'] = 'PubMed ID';
}

libxEnv.setObjectVisible = function(obj, show) {
    libxEnv.writeLog("An object is supposed to be either hidden or visible");
}

//Window functions////////////////////////////////////////////////////////////

/*  openSearchWindow
 * Opens a new browser window for searching. Since standard JavaScript does
 * not contain the concept of 'tabs', this is emulated by opening new windows
 * and letting the browser figure out how to handle the situation.
 *
 * Assumes that the preferences are either libx.newtabswitch or libx.sametab
 */
libxEnv.openSearchWindow = function (url, donoturiencode, pref) {
    var what = pref ? pref : libxEnv.getUnicharPref("libx.displaypref", "libx.newtabswitch");
    
    var isGet = typeof (url) == "string";
    var url2 = isGet ? url : url[0];
    if (donoturiencode == null || donoturiencode == false) {
        url2 = encodeURI(url2);
    }
	
	/* In IE, we are not given control over tabs, by design.
	 * See http://blogs.msdn.com/ie/archive/2005/05/26/422103.aspx
	 * The only choice we have is between _blank and _self
	 */
	var target = "_blank";
	if (what == "libx.sametab")
		target = "_self";
		
        /* When invoked from context menu doProxify, libxInterface.openNewWindow
         * fails in IE7 with a COM Error ERROR_BUSY:
         * The requested resource is in use. (Exception from HRESULT: 0x800700AA) 
         * Use window.navigate in this case.
         */
        if (target == "_self" && isGet) {
            window.navigate(url2);
            return;
        }

	/* Where the focus goes is controlled by the browser's settings, so 
         * we cannot implement libx.newtabswitch/libx.newtab */
	libxInterface.openNewWindow(url2, target, isGet ? null : url[1]);
}

/*  getCurrentWindowContent
 * In Firefox, there is a window._content property because of the way XUL
 * creates windows. In IE, Opera, etc. this is unnecessary. This function
 * is designed to abstract this (of course, if it were possible to treat
 * inserted C# objects like JavaScript objects we could just say
 * window._content = window, but that would be too easy).
 */
libxEnv.getCurrentWindowContent = function() {
    return window;
}

//XPath functions/////////////////////////////////////////////////////////////

libxEnv.xpath = new Object();

libxEnv.xpath.findSingle = function (doc, xpathexpr, root) {
    return doc.selectSingleNode(xpathexpr);
}

libxEnv.xpath.findNodes = function (doc, xpathexpr, root) {
    return doc.selectNodes(xpathexpr);
}

libxEnv.xpath.findSnapshot = function (doc, xpathexpr, root) {
    libxEnv.writeLog("Warning: xpath.findSnapshot not implemented in IE!");
    return null;
}

//Get remote text functions///////////////////////////////////////////////////

/**
 * Retrieve a text file from a URL.
 * Same as getXMLDocument, except that responseText is returned.
 * Should merge.
 *
 * There's also a C# implementation for synchronous retrieval as
 *      libxInterface.doWebRequest(url);
 * which returns the text of a url as a string.
 */
libxEnv.getDocument = function (url, callback, postdata) {
    //Get the request object
    var req = libxInterface.getXMLHTTPRequest();

    if (!req) {
        libxEnv.writeLog("Could not get request object for url " + url);
        return null;
    }

    var synch = (!callback);
    if (!synch) {
        //We're asynchronous, so set a callback
        req.onreadystatechange = function() {
            //Make sure we're ready for processing
            if (req.readyState == 4) {
                if(req.status != 200) {
                    libxEnv.writeLog("Could not retrieve text resource at " +
                                     url + ": Error code " + req.status);
                }
                else {
                    callback(req.responseText);
                }
            }
        }
    }

    //Do the request
    req.open(postdata ? 'POST' : 'GET', url, !synch);
    req.send(postdata);
    return synch ? req.responseText : null;
}

//XML + config functions//////////////////////////////////////////////////////

//Returns an XML DOM document for the config file  
libxEnv.getXMLDocument = function (url, callback, postdata) {
    //First see if we can grab it from chrome
    var xdoc = libxInterface.getChromeXMLDocument(url);
    if(xdoc != null) {
        return xdoc;
    }
    //If not...
    //Get the request object
    var req = libxInterface.getXMLHTTPRequest();

    if(!req) {
        libxEnv.writeLog("Could not get request object for url " + url);
        return null;
    }

    var synch = (!callback);
    if(!synch) {
        //We're asynchronous, so set a callback
        req.onreadystatechange = function() {
            //Make sure we're ready for processing
            if (req.readyState == 4) {
                if(req.status != 200) {
                    libxEnv.writeLog("Could not retrieve resource at " +
                                     url + ": Error code " + req.status);
                }
                else {
                    callback(req);
                }
            }
        }
    }

    //Do the request
    req.open(postdata ? 'POST' : 'GET', url, !synch);
    req.send(postdata);
    return synch ? req.responseXML : null;
}

libxEnv.getXMLConfig = function () {
    return libxInterface.config;
}

//File IO functions///////////////////////////////////////////////////////////

libxEnv.writeToFile = function(path, str) {
    libxEnv.writeLog("167: writeToFile " + path);
    libxInterface.writeToFile(path, str);
}

libxEnv.getFileText = function(path) {
    return libxInterface.readFileText(path);
}

libxEnv.removeFile = function(path) {
    libxInterface.removeFile(path);
}

//Logging functions///////////////////////////////////////////////////////////

//Writes to the log, prepending the string 'LibX: '
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
    libxInterface.writeLog(type + ': ' + msg);
}

libxEnv.addEventHandler = function(obj, event, func) {
    return document.attachEvent(event, func);
}

//Context menu functions//////////////////////////////////////////////////////

libxEnv.initializeContextMenu = function () {
}

libxEnv.addMenuObject = function(menuentry) {
    return libxInterface.addMenuEntry(menuentry);
}

libxEnv.removeMenuObject = function(menuentry) {
    return libxInterface.removeMenuEntry(menuentry);
}

//Context menu preferences functions//////////////////////////////////////////

/*
 * This object contains strings and labels needed for the preferences UI.
 * This is necessary because C# currently cannot load the xul file (because
 * the DTD is using a chrome URL, which of course MSXML6 cannot resolve).
 *
 * If it ever becomes possible to load and parse the xul file, this object
 * should be populated from that.
 */
libxEnv.cmLabels = {
    'libx-contextmenu-isbn-prefs-tree':{label:'ISBN', text:'Right-click context menu items that are displayed when an ISBN is selected.'},
    'libx-contextmenu-issn-prefs-tree':{label:'ISSN', text:'Right-click context menu items that are displayed when an ISSN is selected.'},
    'libx-contextmenu-pmid-prefs-tree':{label:'PMID', text:'Right-click context menu items that are displayed when a PubMed ID is selected.'},
     'libx-contextmenu-doi-prefs-tree':{label:'DOI', text:'Right-click context menu items that are displayed when a DOI (Digital Object Identifier) is selected.'},
 'libx-contextmenu-general-prefs-tree':{label:'General', text:'Right-click context menu items that are displayed when text other than an ISBN/ISSN/PubMed ID/DOI is selected.'},
   'libx-contextmenu-proxy-prefs-tree':{label:'Proxy', text:'Enable/Disable proxy right-click menu item.'}
};

/*
 * Adds a tab to the context menu preferences page. This function is not
 * necessary in Firefox because the tabs are hard-coded in XUL.
 *
 * What *is* hard-coded here is the id => label/text mappings (given above).
 * @param id {string}   The ID of the new tab
 * @returns {LibXTree}  The C# tree object for the new tab
 */
libxEnv.addContextMenuPreferencesTab = function (id) {
    if(libxEnv.cmLabels[id] === undefined) {
        libxEnv.writeLog(id + " is not known as a valid id");
        return null;
    }
    return libxInterface.addTab(libxEnv.cmLabels[id].label,
                                id,
                                libxEnv.cmLabels[id].text
                               );
}

/*
 * Removes a tab from the context menu preferences page. If no tab exists
 * with the given ID, we do nothing.
 *
 * @param idbase {string}  The string used to form the ID for the tab
 */
libxEnv.removeContextMenuPreferencesTab = function (idbase) {
    var tabId = "libx-contextmenu-" + idbase + "-prefs-tab";
    libxInterface.removeTab(tabId);
}

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

    //Create the root for the tree
    var tree = libxEnv.addContextMenuPreferencesTab(treeID);
    if(tree == null) {
        return null;
    }
    var root = new libxEnv.PrefsTreeRoot(tree, treeID);

    //Create the initial items
    for (var i in items) {
        root.createChild(items[i].label, items[i].id);
    }
    return root;
};

/* Returns all nodes which are checked
 * @param tree {libxEnv.PrefsTree}  A tree node
 */
libxEnv.getEnabledNodes = function (tree) {
    var enabledNodes = new Array();

    //Check self
    if(tree.isEnabled()) {
        enabledNodes.push(tree);
    }

    //Check the children
    for(var i = 0; i < tree.children.length; ++i) {
        enabledNodes = enabledNodes.concat(libxEnv.getEnabledNodes(tree.children[i]));
    }
    return enabledNodes;
}

/*  PrefsTreeRoot object
 * Object representing a tree root.
 * 
 * @param treeNode {LibXTree}  A C# LibXTree object
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

libxEnv.PrefsTreeRoot.prototype.isEnabled = function() {
    return false;
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

/*  PrefsTreeNode object
 * Object representing a tree node.
 * 
 * @param parent {LibXTreeNode}  The tree or tree node that contains this node
 * @param label {string}         The label of the node (visible to user)
 * @param id {string}            A unique node identifier
 * @param attrs {object}         Name, value pairs used to set node attributes
 */
libxEnv.PrefsTreeNode = function (parent, label, id, attrs) {
    //Create the C# node (easier than Firefox, for once)
    var titem = parent.createChild(label, id);

    //Are we checked?
    if(attrs && attrs.properties) {
        if(attrs.properties == 'enabled') {
            titem.isChecked = true;
        }
    }
    //Populate the JavaScript fields
    this.node = titem;
    this.children = new Array();
    this.id = id;
};

/*  setExpanded
 * Sets the expanded state of the node.
 *
 * @param expanded {bool}   The desired state. true=expanded, false=collapsed.
 */
libxEnv.PrefsTreeNode.prototype.setExpanded = function (expanded) {
    this.node.setExpanded(expanded);
}

libxEnv.PrefsTreeNode.prototype.isEnabled = function() {
    return this.node.isChecked;
}

libxEnv.PrefsTreeNode.prototype.getChild = libxEnv.PrefsTreeRoot.prototype.getChild;

libxEnv.PrefsTreeNode.prototype.createChild = libxEnv.PrefsTreeRoot.prototype.createChild;

//Preferences UI functions////////////////////////////////////////////////////
/*
 * These functions interface with the preferences UI developed in C#. They are
 * distinct from the context menu preferences above in that they handle the
 * other types of preferences exposed through this UI.
 */

libxEnv.resetToDefaultPrefs = function () {
    libxInterface.resetTabs();
}

libxEnv.initPrefsGUI = function() {
    //This is just a dummy for Firefox compatability.
}

libxEnv.getDisplayPref = function() {
    return libxInterface.getDisplayPreference("libx.newtabswitch");
};

libxEnv.getProxyPref = function() {
    return libxInterface.getProxyPreference(false);
};

libxEnv.getDFUPref = function() {
    return libxInterface.getDFUPreference(true);
}

libxEnv.getAutolinkPref = function() {
    //There is no specialized autolink in IE
    return false;
};

//GUI functions///////////////////////////////////////////////////////////////
/*
 * GUI functions are not used in the IE version, as the GUI is not controlled
 * by JavaScript.
 */
libxEnv.initializeGUI = function () {
}

libxEnv.initCatalogGUI = function () {
}

libxEnv.SelectCatalog = function(mitem, event) {
}

libxEnv.setVisible = function(elemName, hide) {
}

libxEnv.setGUIAttribute = function(elemName, attrName, attrVal) {
}

//Autolink functions//////////////////////////////////////////////////////////
/*
 * Autolink is not used by IE. Once the page rewriting framework is in place,
 * the autolink functions will not be necessary anyway, so making them work
 * in IE would be a waste of time.
 */

var libxAutoLinkFilters = [];

function libxRunAutoLink(document, rightaway) 
{
}

function libxSelectAutolink(value)
{
}

function libxInitializeAutolink()
{
}
