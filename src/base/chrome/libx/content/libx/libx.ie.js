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
 
//var libxEnv = new Object();
  
libxEnv.init = function() {
    // Use user defined preferences if available
    libxMenuPrefs = new libxXMLPreferences();
    libxEnv.loadProperties(); 
    libxEnv.populateDropdownOptions();
    //Read in search options and add to libxConfig.searchOptions
    var libxSearchOptions = 
        libxEnv.xpath.findNodesXML(libxGetConfigXML().xml, 
        "/edition/searchoptions/*");
    for (var option = 0; option < libxSearchOptions.length; option++ ) {
        var mitem = libxSearchOptions[option];
        libxConfig.searchOptions[mitem.getAttribute('value')] = mitem.getAttribute('label');
        libxDropdownOptions[mitem.value] = mitem;
    }
    
    libraryCatalog = searchCatalogs[0];

    // Listener for the prefs window to catch changes to the roots info
    libxEnv.doforurls.setRootUpdateListener( libxEnv.updateRootInfo );
}

libxEnv.debugInit = function () {}

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
libxEnv.openSearchWindow = function (url, pref) {
    var what = pref ? pref : libxEnv.getUnicharPref("libx.displaypref", "libx.newtabswitch");
    
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

libxEnv.xpath = new Object();
libxEnv.xpath.shadowToOrigDOMMap = new Array();
libxEnv.xpath.queue = new Array();
libxEnv.xpath.headIdx = 0;
libxEnv.xpath.tailIdx = 0;
libxEnv.xpath.shadowDOM = new Object();

//This function shadows the DOM tree of the original document (starting at the
//document.body node) and make a well formed shadowDOM.  This allows XPath
//queries to be executed in IE.  This method performs a breadth-first traversal
//of the DOM tree.
libxEnv.xpath.init = function (docRoot, nodeSet, attributeSet) {
    //Reset values
    libxEnv.xpath.shadowToOrigDOMMap = new Array();
    libxEnv.xpath.queue = new Array();
    libxEnv.xpath.headIdx = 0;
    libxEnv.xpath.tailIdx = 0;

    libxEnv.xpath.shadowDOM = new ActiveXObject("Msxml2.DOMDocument");
    libxEnv.xpath.shadowDOM.async = false;
    libxEnv.xpath.shadowDOM.resolveExternals = false;
    libxEnv.xpath.shadowDOM.setProperty("SelectionLanguage", "XPath");

    shadowRoot = undefined;
    var allNodes = false;
    var allAttributes = false;

    if (undefined == nodeSet)
        allNodes = true;

    if (undefined == attributeSet)
        allAttributes = true;

    //We need to handle the root element of the document here for the iterative
    //shadowing method
    if (-1 == docRoot.nodeName.search("\/")
        && docRoot.nodeName.search("#")) {
        var shadowRoot 
            = libxEnv.xpath.shadowDOM.createElement(docRoot.nodeName.toLowerCase());

        //We only shadow attributes for nodes we're concerned with. Also, only
        //attributes that we're concerned with are shadowed.  For example, if
        //the XPath expression was //div[@id='whatever'], then we only shadow
        //attributes for div elements, and we only shadow the id attribute of
        //those elements.  This, hopefully, significantly decreases the amount
        //of time required to generate the shadowDOM.  Of course, this requires
        //that that arrays containing the element names and attribute names
        //be passed into this function.
        if (allNodes && allAttributes) {
            for (var ctr = 0; ctr < docRoot.attributes.length; ++ ctr) {
                var attribute = docRoot.attributes[ctr];
                var attributeValue = attribute.nodeValue;
                if (attributeValue && attribute.specified) {
                    var shadowAttribute = libxEnv.xpath.shadowDOM.createAttribute(attribute.nodeName);
                    shadowAttribute.value = attributeValue;
                    shadowRoot.setAttributeNode(shadowAttribute);
                } //end if
            } //end for
        } //end if (allNodes && allAttributes)
        else {
            var docRootNameMatch = false;
            if (!allNodes) {
                for (var elem = 0; elem < nodeSet.length; ++elem) {
                    if (nodeSet[elem] == docRoot.nodeName) {
                        docRootNameMatch = true;
                        break;
                    } //end if
                } //end for
            } //end if (!allNodes)
            else
                docRootNameMatch = true;

            //We only shadow attributes for root if it was found in the list
            //of element names, or if we're shadowing attributes for all
            //elements
            if (docRootNameMatch) {
                if (!allAttributes) {
                    for (var attr = 0; attr < attributeSet.length; ++attr) {
                        var attributeName = attributeSet[attr];
                        if (docRoot[attributeName]
                            || ("class" == attributeName
                               && docRoot.className)) {
                            if ("class" == attributeName)
                                var attributeValue = docRoot.className;
                        } // end if
                        else
                            var attributeValue = docRoot[attributeName];
                        var shadowDOMAttr = libxEnv.xpath.shadowDOM.createAttribute(attributeName);
                        shadowDOMAttr.value = attributeValue;
                        shadowRoot.setAttributeNode(shadowAttribute);
                    } //end for
                } //end if (!allAttributes)
                //otherwise shadow all attributes
                else {
                    for (var ctr = 0; ctr < docRoot.attributes.length; ++ ctr) {
                        var attribute = docRoot.attributes[ctr];
                        var attributeName = attribute.nodeName;
                        var attributeValue = attribute.nodeValue;
                        if (attributeValue && attribute.specified) {
                            var shadowAttribute = libxEnv.xpath.shadowDOM.createAttribute(attributeName);
                            shadowAttribute.value = attributeValue;
                            shadowRoot.setAttributeNode(shadowAttribute);
                        } //end if
                    } //end for
                } //end else (allAttributes == true)
            } //end if (docRootNameMatch)
        } //end else (!(allNodes && allAttributes))

        var uniqueID = docRoot.uniqueID;
        shadowRoot.setAttribute("id", uniqueID);
        libxEnv.xpath.shadowToOrigDOMMap[uniqueID] = docRoot;

        libxEnv.xpath.shadowDOM.appendChild(shadowRoot);
    }

    libxEnv.xpath.queue.push({original: docRoot, shadow: shadowRoot});
    ++libxEnv.xpath.tailIdx;
    libxEnv.xpath.loadDocument(libxEnv.xpath.shadowDOM, docRoot, nodeSet, attributeSet);
}

libxEnv.xpath.loadDocument = function (dom, docRoot, nodeSet, attributeSet) {
    libxEnv.writeLog("in load document");

    var allNodes = false;
    var allAttributes = false;

    if (undefined == nodeSet)
        allNodes = true;

    if (undefined == attributeSet)
        allAttributes = true;

    //return libxEnv.xpath.loadNode(dom, dom, docRoot.body);
    //return libxEnv.xpath.loadNode(dom, dom, docRoot);

    while (libxEnv.xpath.headIdx < libxEnv.xpath.tailIdx) {
        //Get node from queue
        //var nodePair = libxEnv.xpath.queue.shift();
        var nodePair = libxEnv.xpath.queue[libxEnv.xpath.headIdx];
        ++libxEnv.xpath.headIdx;
        var origNode = nodePair.original;
        var shadowNode = nodePair.shadow;

        if (undefined == shadowNode)
            libxEnv.writeLog("shadowNode is undefined");

        var length = origNode.childNodes.length;

        //Get all children of that node and add to queue
        //To do this, we need to create corresponding shadow nodes
        for (var ctr = 0; ctr < length; ++ ctr) {
            if (3 == origNode.childNodes[ctr].nodeType) {
                //For text nodes, we simply create a text node and add it as
                //a child node to its shadow parent node.  We don't have to
                //worry about this node's attributes since it has none.
                var shadowChildNode 
                    = libxEnv.xpath.shadowDOM.createTextNode(origNode.childNodes[ctr].nodeValue);

                shadowNode.appendChild(shadowChildNode);
            } //end if node is textNode
            else {
                //Check to see whether elements are valid (since IE doesn't do
                //this itself)
                if (-1 == origNode.childNodes[ctr].nodeName.search("\/")
                    && -1 == origNode.childNodes[ctr].nodeName.search("#")) {
                    //Create the child node
                    var shadowChildNode 
                        = libxEnv.xpath.shadowDOM.createElement(origNode.childNodes[ctr].nodeName.toLowerCase());

                    //Now give this element a unique id
                    var uniqueID = origNode.childNodes[ctr].uniqueID;
                    shadowChildNode.setAttribute("id", uniqueID);

                    //Map the shadowChild node to the corresponding origNode.childNodes[ctr]
                    libxEnv.xpath.shadowToOrigDOMMap[uniqueID] = origNode.childNodes[ctr];

                    shadowNode.appendChild(shadowChildNode);

                    //Handle attibutes.  See documentation in libxEnv.xpath.init()
                    if (allNodes && allAttributes) {
                        for (var attr = 0; attr < origNode.childNodes[ctr].attributes.length; ++ attr) {
                            var attribute = origNode.childNodes[ctr].attributes[attr];
                            var attributeName = attribute.nodeName;
                            var attributeValue = attribute.nodeValue;
                            if (attributeValue && attribute.specified) {
                                var shadowDOMAttr = libxEnv.xpath.shadowDOM.createAttribute(attributeName);
                                shadowDOMAttr.value = attributeValue;
                                shadowChildNode.setAttributeNode(shadowDOMAttr);
                            } //end if (attributeValue && attribute.specified)
                        } //end for
                    } //end if(allNodes && allAttributes)
                    else {
                        var nodeNameMatch = false;
                        if (!allNodes) {
                            for (var elem = 0; elem < nodeSet.length; ++elem) {
                                if (nodeSet[elem] == origNode.childNodes[ctr].nodeName) {
                                    nodeNameMatch = true;
                                    break;
                                } //end if
                            } //end for
                        } //end if (!allNodes)
                        else
                            nodeNameMatch = true;

                        if (nodeNameMatch) {
                            if (!allAttributes) {
                                for (var attr = 0; attr < attributeSet.length; ++attr) {
                                    var attributeName = attributeSet[attr];
                                    if (origNode.childNodes[ctr][attributeName]
                                        || ("class" == attributeName
                                            && origNode.childNodes[ctr].className)) {
                                        if ("class" == attributeName)
                                            var attributeValue = origNode.childNodes[ctr].className;
                                        else
                                            var attributeValue = origNode.childNodes[ctr][attributeName];
                                        var shadowDOMAttr = libxEnv.xpath.shadowDOM.createAttribute(attributeName);
                                        shadowDOMAttr.value = attributeValue;
                                        shadowChildNode.setAttributeNode(shadowDOMAttr);
                                    } //end if
                                } //end for
                            } //end if (!allAttributes)
                            else {
                                for (var attr = 0; attr < origNode.childNodes[ctr].attributes.length; ++ attr) {
                                    var attribute = origNode.childNodes[ctr].attributes[attr];
                                    var attributeName = attribute.nodeName;
                                    var attributeValue = attribute.nodeValue;
                                    if (attributeValue && attribute.specified) {
                                        var shadowDOMAttr = libxEnv.xpath.shadowDOM.createAttribute(attributeName);
                                        shadowDOMAttr.value = attributeValue;
                                        shadowChildNode.setAttributeNode(shadowDOMAttr);
                                    } //end if
                                } //end for
                            } //end else (allAttributes)
                        } //end if (nodeNameMatch)
                    } //end else (!(allNodes && allAttributes))
                } //end if (node is valid)
            } //end else (nodeType is element)
            //Now we need to add the children to the queue
            libxEnv.xpath.queue.push({original: origNode.childNodes[ctr], shadow: shadowChildNode});
            ++libxEnv.xpath.tailIdx;
        } //end for (loop for handling children)
    } //end while (queue not empty)
} //end libxEnv.xpath.loadDocument

libxEnv.xpath.findSingleXML = function (doc, xpathexpr, root, namespaceresolver) {

    if (undefined != namespaceresolver) {

        currentPrefix = "";

        //Iterate through the namespaceresolver object to get
        //the prefixes
        for (prefix in namespaceresolver) {
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
    if (undefined == root) {
        return doc.selectSingleNode(xpathexpr);
    }
    else {
        return root.selectSingleNode(xpathexpr);
    }
}

libxEnv.xpath.findSingle = function (doc, xpathexpr, root) {
    //Requires XPath parser code in javascript-xpath.js
    var r = doc.evaluate(xpathexpr, root?root:doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    if (r) return r.singleNodeValue;
    return null;

    //Code that uses shadowDOM.  Obviously there has to be a shadow DOM for
    //this to work
    var origNode = null;
    var shadowNode = libxEnv.xpath.shadowDOM.selectSingleNode(xpathexpr);

    if (null != shadowNode) {
        var shadowAttribute = shadowNode.getAttribute("id");
        var origNode = libxEnv.xpath.shadowToOrigDOMMap[shadowAttribute];
    }
    return origNode;
}

libxEnv.xpath.findNodesXML = function (doc, xpathexpr, root, namespaceresolver) {

    if (undefined != namespaceresolver) {

        currentPrefix = "";

        //Iterate through the namespaceresolver object to get
        //the prefixes
        for (prefix in namespaceresolver) {
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

    if (undefined == root)
        return doc.selectNodes(xpathexpr);
    else
        return root.selectNodes(xpathexpr);
}

libxEnv.xpath.findNodes = function (doc, xpathexpr, root) {

    var r = doc.evaluate(xpathexpr, root?root:doc, null, XPathResult.ANY_TYPE, null);
    if (r == null) return null;

    switch (r.resultType) {
        case XPathResult.BOOLEAN_TYPE:
            return r.booleanValue;
        case XPathResult.STRING_TYPE:
            return r.stringValue;
        case XPathResult.NUMBER_TYPE:
            return r.numberValue;
        case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
            var rr = new Array();
            var n;
            while ((n = r.iterateNext()) != null)
                rr.push(n);
            return rr;
        default:
            libxEnv.writeLog("unknown resultType: " + r.resultType, libxEnv.logTypes.xpath);
            return null;
    }
    
    //Code that uses shadowDOM.
    var shadowNodes = libxEnv.xpath.shadowDOM.selectNodes(xpathexpr);
    var origNodes = new Array();

    for (var ctr = 0; ctr < shadowNodes.length; ++ ctr) {
        var shadowAttribute = shadowNodes[ctr].getAttribute("id");
        var origNode = libxEnv.xpath.shadowToOrigDOMMap[shadowAttribute];
        origNodes.push(origNode);
    }
    return origNodes;
}

libxEnv.xpath.findSnapshot = function (doc, xpathexpr, root) {
    var r = doc.evaluate(xpathexpr, root?root:doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (r == null) return null;

    var rr = new Array();
    for (var i = 0; i < r.snapshotLength; i++) {
        rr.push(r.snapshotItem(i));
    }
    return rr;
}

//Get remote text functions///////////////////////////////////////////////////

libxEnv.getDocumentRequest = function( url, callback, postdata, lastMod, 
    contentType )
{
    //Get the request object
    var req = libxInterface.getXMLHTTPRequest();

    if(!req) {
        libxEnv.writeLog("Could not get request object for url " + url);
        return null;
    }

    if( callback !== undefined || callback != null) 
    {
        var synch = false;    
        //We're asynchronous, so set a callback
        req.onreadystatechange = function() {
            //Make sure we're ready for processing
            if (req.readyState == 4) {
                callback(req);
            }
        }
    }
    else
        var synch = true;

    req.open(postdata ? 'POST' : 'GET', url, !synch);
    if ( lastMod !== undefined && lastMod != null)
    {
        req.setRequestHeader( "If-Modified-Since", lastMod );
    }
    
    //Do the request
    req.send(postdata);
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





libxEnv.getXMLConfig = function () {
    return libxInterface.config;
}

//File IO functions///////////////////////////////////////////////////////////

libxEnv.writeToFile = function(path, str, create, dirPath) {
    libxEnv.writeLog("167: writeToFile " + path);
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


//GUI functions///////////////////////////////////////////////////////////////
/*
 * GUI functions are not used in the IE version, as the GUI is not controlled
 * by JavaScript.
 */
libxEnv.initializeGUI = function () {
}

libxEnv.initCatalogGUI = function () {
}

libxEnv.setVisible = function(elemName, hide) {
}

libxEnv.setGUIAttribute = function(elemName, attrName, attrVal) {
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
    libxEnv.setBoolPref("libx.autolink", value);
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

libxEnv.eventDispatcher.init = function  () {
    // Int for onContentChange
    //
}

libxEnv.hash = new Object();

libxEnv.hash.hashString = function ( text )
{
    var temp = libxInterface.hashString( text );
    ////window.alert( temp );
    return temp;
}

libxEnv.displayLastUpdateDate = function()
{
    var text = libxEnv.getUnicharPref("libx.lastupdate");
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
