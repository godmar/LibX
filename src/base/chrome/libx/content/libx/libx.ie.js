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
  
libxEnv.init = function() {
    libxInitializeMenuObjects();
}
  
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

//Sets the xpath stuff for ie
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


//Returns an XML DOM document for the config file  
libxEnv.getXMLDocument = function (url, callback) {
    // FIXME: pass on url and observe callback
        // see http://jibbering.com/2002/4/httprequest.html for documentation.
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
    popuphelper = new ContextPopupHelper();
}

libxEnv.addMenuObject = function() {
    return libxInterface.addMenuObject();
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
