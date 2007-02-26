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
        document.open(url2, '_self');
        break;
    case "libx.newtabswitch": //open in new window, focus it
        var newWindow = document.open(url2, '_blank');
        newWindow.focus();
        break;
    case "libx.newwindow": //open in new window, don't explicitly focus it
    case "libx.newtab":
    default:
        window.open(url2, '_blank');
        break;
    }
}

//Returns an XML DOM document for the config file  
libxEnv.getXMLDocument = function ( ) {
    return libxInterface.getXMLConfig();    
}
  
//Writes to the log, prepending the string 'Magic: '
libxEnv.libxMagicLog = function (msg) {
    if (!libxEnv.getBoolPref("libx.magic.debug", false))
        return;

    libxInterface.writeLog('Magic: {0}', msg);
}

//Writes to the log, prepending the string 'LibX: '
libxEnv.libxLog = function (msg) {
    libxInterface.writeLog('LibX: {0}', msg);
}

libxEnv.initializeGUI = function () {
    
}
  

libxEnv.initCatalogGUI = function () {
    
    for ( var i = 0; i < searchCatalogs.length; ++i ) {
        var cat = searchCatalogs[i];
        
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

    var sb = document.getElementById("libx-search-button");
    sb.label = mitem.label;
    if (mitem.value == "openurl")
        libxSelectedCatalog = openUrlResolver;
    else
        libxSelectedCatalog = searchCatalogs[mitem.value];

    libxActivateCatalogOptions(libxSelectedCatalog);
}

/*
 * All the 'properties' functions are not used in the IE edition, since the
 * IE toolbar is XML-only. Once (if) the Firefox version also becomes XML-
 * only, these functions can be deleted entirely.
 */
function libxInitializeCatalogFromProperties(cattype, catprefix)
{
}

//This function is not used in the IE edition, and is here for compatibility
function addCatalogByProperties(cattype, catprefix, catnumber)
{
}

//This function is not used in the IE edition, and is here for compatibility
function libxInitializeCatalogsFromProperties() 
{
}

  
