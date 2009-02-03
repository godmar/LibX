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
  
 
/**
 * IE-specific functionality
 * @namespace
 */
libx.ie = { };
libx.bd = libx.ie;

 /*
  * Designed to hold Internet Explorer-specific code for the LibX extension.
  */
 
libx.ie.initialize = function() {
    // Use user defined preferences if available
    libxMenuPrefs = new libxXMLPreferences();
    libxEnv.loadProperties(); 

    // Listener for the prefs window to catch changes to the roots info
    libxEnv.doforurls.setRootUpdateListener( libxEnv.updateRootInfo );
}

libxEnv.debugInit = function () {}

//Window functions////////////////////////////////////////////////////////////

/*  openSearchWindow
 * Opens a new browser window for searching. Since standard JavaScript does
 * not contain the concept of 'tabs', this is emulated by opening new windows
 * and letting the browser figure out how to handle the situation.
 *
 * Assumes that the preferences are either libx.newtabswitch or libx.sametab
 */
libxEnv.openSearchWindow = function (url, pref) {
    var what = pref ? pref : libx.utils.browserprefs.getStringPref("libx.displaypref", "libx.newtabswitch");
    
    var isGet = typeof (url) == "string";
    var url2 = isGet ? url : url[0];
    
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
            libxEnv.getCurrentWindowContent().navigate(url2);
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
 *
 * In IE, we store the current window in a C# object which can then be
 * used in JavaScript
 */
libxEnv.getCurrentWindowContent = function() {
    return libxChromeWindow.CurrentWindow;
}

//XPath functions/////////////////////////////////////////////////////////////

//XXX: We should create a new file to contain this object (xpathutils.ie.js)
libx.ie.xpath = {

    /**
     * Evaluates an XPath expression and returns a single DOM node or null
     *
     * Note: This will only work on a well formed XML/XHTML document
     *
     * @param {DOM Tree} doc               document (used if root is undefined)
     * @param {String}   xpathexpr         XPath expression
     * @param {DOM Tree} root              root of DOM to execute search (used
     *                                     instead of doc if defined)
     * @param {Object}   namespaceresolver Object keys are namespace prefixes,
     *                                     values are corresponding URIs
     *
     * @returns DOM node or null if not found
     *
     */
    findSingleXML : function (doc, xpathexpr, root, namespaceresolver) {

        if (namespaceresolver !== undefined) {
            var currentPrefix = "";

            //Iterate through the namespaceresolver object to get
            //the prefixes
            for (var prefix in namespaceresolver) {
                if ("" != currentPrefix)
                    currentPrefix += " ";

                currentPrefix 
                    += "xmlns:" 
                    + prefix 
                    + "='" 
                    + namespaceresolver[prefix] 
                    + "'";
            }
            doc.setProperty("SelectionNamespaces", currentPrefix);
        }

        var result;

        try {
            if (undefined == root) {
                return doc.selectSingleNode(xpathexpr);
            }
            else {
                return root.selectSingleNode(xpathexpr);
            }
        }
        catch (e) {
            libx.log.write("In findSingleXML: XPath expression " + xpathexpr + " does not return a node");
            return null;
        }
    },

    /**
     * Evaluates an XPath expression and returns a set of DOM nodes or null
     *
     * Note: This will only work on a well formed XML/XHTML document
     *
     * @param {DOM Tree} doc               document (used if root is undefined)
     * @param {String}   xpathexpr         XPath expression
     * @param {DOM Tree} root              root of DOM to execute search (used
     *                                     instead of doc if defined)
     * @param {Object}   namespaceresolver Object keys are namespace prefixes,
     *                                     values are corresponding URIs
     *
     * @returns array of DOM nodes or null if not found
     *
     */
    findNodesXML : function (doc, xpathexpr, root, namespaceresolver) {

        if (namespaceresolver !== undefined) {

            var currentPrefix = "";

            //Iterate through the namespaceresolver object to get
            //the prefixes
            for (var prefix in namespaceresolver) {
                if ("" != currentPrefix)
                    currentPrefix += " ";

                currentPrefix 
                    += "xmlns:" 
                    + prefix 
                    + "='" 
                    + namespaceresolver[prefix] 
                    + "'";
            }
            doc.setProperty("SelectionNamespaces", currentPrefix);
        }

        try {
            if (undefined == root)
                return doc.selectNodes(xpathexpr);
            else
                return root.selectNodes(xpathexpr);
        }
        catch (e) {
            libx.log.write("In findNodesXML: XPath expression " + xpathexpr + " does not return a set of nodes");
        }
    },

    findSnapshot : function (doc, xpathexpr, root) {
        return null;
    }

};

// XXX remove this eventually
libxEnv.xpath = libx.ie.xpath;

//Get remote text functions///////////////////////////////////////////////////

libx.ie.getXMLHttpReqObj = function () {
    var req = libxInterface.getXMLHTTPRequest();
    return req;
}

/*
 * Load XML String into a XMLDocument
 */
libxEnv.loadXMLString = function (xmlstring) {

    //We ideally want to Msxml2.DOMDocument.6.0 instead of
    //Msxml2.DOMDocument.3.0, but that leads to certain problems
    //1. With PubMed, the 6.0 parser claims that an element
    //   in the XML document doesn't exist in the DTD.  This
    //   isn't an issue when using the 3.0 version.
    var xmlDoc  = new ActiveXObject('Msxml2.DOMDocument.3.0');
    xmlDoc.setProperty("SelectionLanguage","XPath");

    xmlDoc.loadXML(xmlstring);

    return xmlDoc;
}

libxEnv.getXMLConfig = function (url) {
    return libxInterface.config;
}

//File IO functions///////////////////////////////////////////////////////////

libxEnv.writeToFile = function(path, str, create, dirPath) {
    libx.log.write("167: writeToFile " + path);
    if ( create )
    {
        libxInterface.createAllDirsInPath( dirPath );
    }
    libxInterface.writeToFile(path, str);
}

libxEnv.getFileText = function(path) {
    return libxInterface.readFileText(path);
}

libxEnv.removeFile = function(path) {
    libxInterface.removeFile(path);
}

//Logging functions///////////////////////////////////////////////////////////

libx.ie.log = {
    /**
     * Write a message to the JS console
     * @param {String} msg message to write
     */
    write : function (msg) {
        libxInterface.writeLog(msg);
    }
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
        libx.log.write(id + " is not known as a valid id");
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
};

libxEnv.getOCLCPref = function() {
    return libxInterface.getOCLCPreference(false);
};

libxEnv.getDOIPref = function() {
    return libxInterface.getDOIPreference(true);
};

libxEnv.getPMIDPref = function() {
    return libxInterface.getPMIDPreference(true);
};

libxEnv.getAutolinkPref = function() {
    return libxInterface.getAutolinkPreference(false);
};

libxEnv.getCiteulikePref = function () {
    return false;
}

//Autolink functions//////////////////////////////////////////////////////////
/*
 * These functions handle setting the appropriate variables to enable
 * or disable autolinking as well as storing the preference.
 */

// XXX fix this - eliminate libxSelectAutolink or make type-consistent with FF version 
function libxSelectAutolink(value)
{
    value = (/true/i.test(value)) ? true : false;   // convert string to bool
    libx.utils.browserprefs.setBoolPref("libx.autolink", value);
}

libxEnv.urlBarIcon = function () { }
libxEnv.urlBarIcon.prototype = {
    // modifies the hidden property of the icon
    setHidden : function ( hidden ) {   },
    // sets the image src of the icon
    setImage : function ( img ) {   },
    // sets the onclick function of the icon
    setOnclick : function ( onclick ) { },
    // sets the tooltip text
    setTooltipText : function ( text ) { }
}

libx.ie.hash = {
    hashString : function ( text )
    {
        return libxInterface.hashString( text );
    }
};

libxEnv.displayLastUpdateDate = function()
{
    var text = libx.utils.browserprefs.getStringPref("libx.lastupdate");
    libxInterface.updateLastUpdateDate( text );
}

libxEnv.displayLastModifieds = function()
{
    var rootInfo = libxEnv.doforurls.getRootInfo();
    for ( var i = 0; i < rootInfo.length; i++ )
    {
        libxInterface.updateLastModified( rootInfo[i].lastMod, 
            rootInfo[i].desc );
    }
}

libxEnv.updateRootInfo = function ()
{
    libxEnv.displayLastUpdateDate();
    libxEnv.displayLastModifieds();
}
