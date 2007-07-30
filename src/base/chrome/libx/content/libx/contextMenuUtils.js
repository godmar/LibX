
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
 * Utility Functions for the Context MenuObjects
 *
 */
 
// Maps 'labels' to menu object lists
// Current labels are "libx" and "always"
// Each property is an array of LibxMenuObject
var libxLabels2MenuObjectLists;

// Holds all nodes put in the context menu
// Used for quick removal
var libxCreatedMenuItems = new Array();

// Holds preferences for Context Menu
var libxMenuPrefs;

/* Creates a new Context Menu Object
 * type      -- 'type' of the menuitem 
 *              supported types include
 *               - 'isbn', 'issn', 'doi', 'default', 'pmid'
 *
 * label     -- used to determine order of evaluation
 *                 anything with "general" as label will always be evaluated
 *
 * tmatch    -- function that takes a popuphelper ( see popuphelperutils.js for documentation ) and returns
 *              null - if no match is found and menuObject(s) should not be displayed
 *              otherwise the onmatch function will be called..
 *
 * onmatch      -- function that is called if a non-null match is found
 *                is given two paramaters 
 *                    s -- the match returned by tmatch function
 *                  menuItems -- an array of the actual menu items that were created from the data given by menuitems param
 */
function libxRegisterContextMenuObject ( label, type, tmatch, onmatch ) {
    /*
     * MenuObject class
     * Stores all information about a group of related menu items
     * Has the following fields:
     * this.menuentries[] -- each menuentry contains
     *          type     -- catalog or openurlresolver
     *          name     -- which catalog or openurlresolver
     *          menuitem -- DOM menuitem it pertains to
     * this.matchf  -- matching function ( generally a regular expression, that
     *                 will return a non null result when a match is found )
     * this.onmatch -- command function to be run when the match is found.
     *                 this function is passed in the menuitems as well as the
     *                 result from the matchf
     */
    var menuObject = {
        menuentries : new Array(),
        matchf: tmatch,
        onmatch: onmatch
    };

    //Using this notation (versus eval) works better with IE  
    var defined = libxMenuPrefs.contextmenu[type];
    
    if ( defined != null && defined != "" ) {
        for ( var i = 0; i < defined.children.length; i++ ) {
            var item = defined.children[i];

            //Validate menu item
            //Sometimes, items that should be dead may come from beyond the
            //grave in userprefs.xml.
            switch(item.nodeName.toLowerCase()) {
                case 'proxy':
                    if(!libxConfig.proxy[item.attr.name]) {
                        continue;
                    }
                    break;
                case 'catalog':
                    if(!libxConfig.catalogs[item.attr.name]) {
                        continue;
                    }
                    break;
                case 'openurl':
                    if(!libxConfig.resolvers[item.attr.name]) {
                        continue;
                    }
                    break;
            }

            var menuEntry = {
                source: item.nodeName, 
                name: item.attr.name, 
                type: item.attr.type 
            };

            var nativeMenuItem = libxEnv.addMenuObject(menuEntry);
            libxCreatedMenuItems.push(nativeMenuItem);
            menuEntry.menuitem = nativeMenuItem;
            menuObject.menuentries.push(menuEntry);
        }
    }
    
    if ( libxLabels2MenuObjectLists[label] == null)
        libxLabels2MenuObjectLists[label] = new Array();
    
    libxLabels2MenuObjectLists[label].push ( menuObject );
}


function libxContextMenuHidden() {
    while (libxCreatedMenuItems.length > 0)
        libxEnv.removeMenuObject(libxCreatedMenuItems.pop());

    libxEnv.contextMenuLoaded = false;
}

// Function that is run if there is text selected and context menu is requested
function libxContextMenuShowing() {
    
    // guard against invocations resulting from when the user opens a nested menu
    if ( libxEnv.contextMenuLoaded ) 
        return;

    libxEnv.contextMenuLoaded = true;

    libxLabels2MenuObjectLists = new Object();
    libxInitializeMenuObjects();

    // hide menu separator.
    // it is unhidden in setImage if at least 1 item is displayed
    libxEnv.setVisible("libx-context-menu-separator", false);

    for (var label in libxLabels2MenuObjectLists) {

        // get the list of menu items for current label
        var menuObjectList = libxLabels2MenuObjectLists[label];
        
        for (var i = 0; i < menuObjectList.length; i++) {

            // skip entries with no menu items
            var menuObj = menuObjectList[i];
            
            if ( menuObj.menuentries.length == 0 )
                continue;
                
            // match function checks if entry applies
            var m = menuObj.matchf( popuphelper );   
                
            if ( m ) {
                    
                // call onmatch handler that will unhide/set labels/etc
                menuObj.onmatch( m, menuObj.menuentries );
                
                // stop once a match is found unless processing "always"
                if ( label != "always" ) { 
                    break;
                }
            }
        }
    }        
}
