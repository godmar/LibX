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
}

libxEnv.setObjectVisible = function(obj, show) {
    libxEnv.writeLog("An object is supposed to be either hidden or visible");
}

//Window functions////////////////////////////////////////////////////////////

/*  openSearchWindow
 * Opens a new browser window for searching. Since standard JavaScript does
 * not contain the concept of 'tabs', this is emulated by opening new windows
 * and letting the browser figure out how to handle the situation.
 */
libxEnv.openSearchWindow = function (url, donoturiencode, pref) {
    var what = pref ? pref : libxEnv.getUnicharPref("libx.displaypref", "libx.newtabswitch");
    var url2;
    if (donoturiencode == null || donoturiencode == false) {
        url2 = encodeURI(url);
    } else {
        url2 = url;
    }
    switch (what) {
    case "libx.sametab": //open in current window
        window.open(url2, '_self');
        break;
    case "libx.newtabswitch": //open in new window, focus it
        /*var newWindow = window.open(url2, '_blank');
        if(newWindow) {
            newWindow.focus();
        }*/
        libxInterface.openNewWindow(url, true);
        break;
    case "libx.newwindow": //open in new window, don't explicitly focus it
    case "libx.newtab":
    default:
        //window.open(url2, '_blank');
        libxInterface.openNewWindow(url, false);
        break;
    }
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
    return null;
}

libxEnv.xpath.findNodes = function (doc, xpathexpr, root) {
    return doc.selectNodes(xpathexpr);
}

libxEnv.xpath.findSnapshot = function (doc, xpathexpr, root) {
    return null;
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
    var req;
    if(window.XMLHttpRequest) { //This should work under IE7
        try {
            req = new XMLHttpRequest();
        }
        catch(e) {
            req = false;
        }
    }
    else if(window.ActiveXObject) {
        try {
            req = new ActiveXObject("Msxml2.XMLHTTP");
        }
        catch(e) {
            try {
                req = new ActiveXObject("Microsoft.XMLHTTP");
            }
            catch(e) {
                req = false;
            }
        }
    }
    
    if(!req) {
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
    req.open(postdata ? 'POST' : 'GET', url, synch);
    req.send(postdata);
    return req.responseXML;
}

libxEnv.getXMLConfig = function () {
    return libxInterface.config;
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
    'isbn':{label:'ISBN', text:'Right-click context menu items that are displayed when an ISBN is selected.'},
    'issn':{label:'ISSN', text:'Right-click context menu items that are displayed when an ISSN is selected.'},
    'pmid':{label:'PMID', text:'Right-click context menu items that are displayed when a PubMed ID is selected.'},
     'doi':{label:'DOI', text:'Right-click context menu items that are displayed when a DOI (Digital Object labelentifier) is selected.'},
 'general':{label:'General', text:'Right-click context menu items that are displayed when text other than an ISBN/ISSN/PubMed ID/DOI is selected.'},
   'proxy':{label:'Proxy', text:'Enable/Disable proxy right-click menu item.'}
};

libxEnv.addContextMenuPreferencesTab = function (label, id) {
    return libxInterface.addTab(libxEnv.cmLabels[label].label,
                                id,
                                libxEnv.cmLabels[label].text
                               );
}

libxEnv.addContextMenuTreeItem = function (id) {
    return libxInterface.addSibling(id);
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

libxEnv.SelectCatalog = function(mitem, event) {
}

libxEnv.setVisible = function(elemName, hide) {
}

libxEnv.setGUIAttribute = function(elemName, attrName, attrVal) {
}

function addSearchField() {
}

function removeSearchField(fieldHbox) {
}

function libxClearAllFields() {
}

function addSearchFieldAs(mitem) {
}

function aboutVersion() {
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
