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

//Window functions////////////////////////////////////////////////////////////

/*  openSearchWindow
 * Opens a new browser window for searching. Since standard JavaScript does
 * not contain the concept of 'tabs', this is emulated by opening new windows
 * and letting the browser figure out how to handle the situation.
 *
 * Assumes that the preferences are either libx.newtabswitch or libx.sametab
 */
libx.ui.openSearchWindow = function (url, pref) {
    var what = pref ? pref : libx.prefs.browser.displaypref._value;
    
    var isGet = typeof (url) == "string";
    var url2 = isGet ? url : url[0];
    
    /* In IE, we are not given control over tabs, by design.
     * See http://blogs.msdn.com/ie/archive/2005/05/26/422103.aspx
     * The only choice we have is between _blank and _self
     */
    var target = "_blank";
    if (what == "sametab")
        target = "_self";
        
        /* When invoked from context menu doProxify, libxInterface.openNewWindow
         * fails in IE7 with a COM Error ERROR_BUSY:
         * The requested resource is in use. (Exception from HRESULT: 0x800700AA) 
         * Use window.navigate in this case.
         */
        if (target == "_self" && isGet) {
            libx.ui.getCurrentWindowContent().navigate(url2);
            return;
        }

    /* Where the focus goes is controlled by the browser's settings, so 
         * we cannot implement libx.newtabswitch/libx.newtab */
    libxInterface.openNewWindow(url2, target, isGet ? null : url[1]);
}

/*  getCurrentWindowContent
 * In Firefox, there is a window.content property because of the way XUL
 * creates windows. In IE, Opera, etc. this is unnecessary. This function
 * is designed to abstract this (of course, if it were possible to treat
 * inserted C# objects like JavaScript objects we could just say
 * window._content = window, but that would be too easy).
 *
 * In IE, we store the current window in a C# object which can then be
 * used in JavaScript
 */
libx.ui.getCurrentWindowContent = function() {
    return libxChromeWindow.CurrentWindow;
}

//XPath functions/////////////////////////////////////////////////////////////

//XXX: We should create a new file to contain this object (xpathutils.ie.js)
libx.utils.xpath = {

    /*
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

    /*
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
    }
};

//Get remote text functions///////////////////////////////////////////////////

libx.cache.bd = {
    getXMLHttpReqObj : function () {
        var req = libxInterface.getXMLHTTPRequest();
        return req;
    }
}

/*
 * Load XML Document from String
 *
 * @param {String} xmlstring
 * @return {DOMDocument} parsed document
 */
libx.utils.xml.loadXMLDocumentFromString = function (xmlstring) {
    //We ideally want to Msxml2.DOMDocument.6.0 instead of
    //Msxml2.DOMDocument.3.0, but that leads to certain problems
    //1. With PubMed, the 6.0 parser claims that an element
    //   in the XML document doesn't exist in the DTD.  This
    //   isn't an issue when using the 3.0 version.
    //
    //   gback -- sounds like 6.0 does DTD validation, and PubMed does
    //   not produce XML that validates according to its own DTD.
    //   TBD: Check whether we can turn validation off.
    var xmlDoc  = new ActiveXObject('Msxml2.DOMDocument.3.0');
    xmlDoc.setProperty("SelectionLanguage","XPath");

    xmlDoc.loadXML(xmlstring);

    return xmlDoc;
}

libxEnv.getXMLConfig = function (url) {
    return libxInterface.config;
}

//File IO functions///////////////////////////////////////////////////////////
libx.io = {
    writeToFile : function(path, str, create, dirPath) {
        libx.log.write("167: writeToFile " + path);
        if ( create )
        {
            libxInterface.createAllDirsInPath( dirPath );
        }
        libxInterface.writeToFile(path, str);
    },
    getFileText : function(path) {
        return libxInterface.readFileText(path);
    },
    // XXX: Taken from getLocalXML in prefs.ie.js, not tested
    getFileXML : function (path){
        return libxInterface.getXMLPrefFile(path);
    },
    removeFile : function(path) {
        libxInterface.removeFile(path);
    },
    // XXX: Untested
    fileExists : function ( path ) {
        var text = this.getFileText ( path );
        return ( text != null && text != "" && text != false ); 
    }
};

//Logging functions///////////////////////////////////////////////////////////

libx.log.bd = {
    /*
     * Write a message to the JS console
     * @param {String} msg message to write
     */
    write : function (msg) {
        libxInterface.writeLog(msg);
    }
}

//Context menu functions//////////////////////////////////////////////////////

libxEnv.addMenuObject = function(menuentry) {
    return libxInterface.addMenuEntry(menuentry);
}

libxEnv.removeMenuObject = function(menuentry) {
    return libxInterface.removeMenuEntry(menuentry);
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

/*
 * Creates a URL Bar Icon
 * @class
 *
 * Not implemented.
 */
libx.ui.UrlBarIcon = libx.core.Class.create(
{
    /*
     * @constructs
     */
    initialize:  function () {
    },
    // modifies the hidden attribute of the icon
    setHidden : function ( hidden ) {
    },
    // sets the image src of the icon
    setImage : function ( img ) {
    },
    // sets the onclick function of the icon
    setOnclick : function ( onclick ) {
    },
    // sets tooltip text
    setTooltipText : function ( text ) {
    }
});

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
