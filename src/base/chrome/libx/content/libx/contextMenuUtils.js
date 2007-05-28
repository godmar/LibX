
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
 
// Holds all the menu items
var LibxMenuItems = new Array();

// Holds all the unique labels
var LibxLabels = new Array();

// Holds all nodes put in the context menu
// Used for quick removal
var LibxNodes = new Array();

// Holds preferences for Context Menu
var libxMenuPrefs;

/*
 * MenuObject class
 * Stores all info required about the menu item
 * Has the following fields:
 * this.menuentries[] -- each menuentry contains
 *          type  -- catalog or openurlresolver
 *          name   -- which catalog or openurlresolver
 *       menuitem -- DOM menuitem it pertains to
 * this.matchf -- matching function ( generally a regular expression, that
 *                will return a non null result when a match is found )
 * this.commf -- command function to be run when the match is found.
 *               this function is passed in the menuitems as well as the
 *               result from the matchf
 */
function LibxMenuObject ( type, tmatch, comm ) {
    
    this.menuentries = new Array();

    //Using this notation (versus eval) works better with IE  
    var defined = libxMenuPrefs.contextmenu[type];
    
    if ( defined == "" || defined == null )
        return;
       
       
    for ( var i = 0; i < defined.children.length; i++ ) {
        var item = defined.children[i];
        var newMenuItem = libxEnv.addMenuObject();
        LibxNodes.push ( newMenuItem );
        this.menuentries[i] = { source: item.nodeName, name: item.attr.name, type: item.attr.type, menuitem: newMenuItem };    
           
    }
    
    
    this.matchf = tmatch;
    this.commf = comm;
}
    
    

/* Creates a new Context Menu Object
 * type      -- 'type' of the menuitem 
 *              supported types include
 *               - 'isbn', 'issn', 'doi', 'default', 'pmid'
 *
 * label     -- used to determine order of evaluation
 *                 anything with "DEFAULT" as label will always be evaluated
 *
 * tmatch    -- function that takes a popuphelper ( see popuphelperutils.js for documentation ) and returns
 *              null - if no match is found and menuObject(s) should not be displayed
 *              otherwise the comm function will be called..
 *
 * comm      -- function that is called if a non-null match is found
 *                is given two paramaters 
 *                    s -- the match returned by tmatch function
 *                  menuItems -- an array of the actual menu items that were created from the data given by menuitems param
 */
function LibxContextMenuObject ( type, label, tmatch, comm ) {
    var menuObject = new LibxMenuObject ( type, tmatch, comm );
    
    if ( !LibxMenuItems[label] ) // if the label hasnt been previously used, intialize it
    {
        LibxLabels.push ( label );
        LibxMenuItems[label] = new Array();
    }
    
    LibxMenuItems[label].push ( menuObject );
}


function libxContextMenuHidden() {
    var par = document.getElementById ( 'contentAreaContextMenu');
    for ( var i = 0; i < LibxNodes.length; i++ ) {
        var node = LibxNodes[i];
        par.removeChild ( node );    
    }
    LibxNodes = new Array();
    libxEnv.contextMenuLoaded = false;
}

// Function that is run if there is text selected and context menu is requested
function libxContextMenuShowing() {
    
    if ( libxEnv.contextMenuLoaded ) 
        return;

    // Used to prevent loading menu multiple times 
    // (Q.: how could that happen? Is the popupshowing event handler called multiple times? -- gback)
    // (A: It is called whenever submenus are opened as well as the top-level menu -- nathanb)
    libxEnv.contextMenuLoaded = true;
    libxInitializeMenuObjects();

    // hide menu separator separator.
    // it is unhidden in setImage if at least 1 item is displayed
    libxEnv.setVisible("libx-context-menu-separator", false);

    for ( var k = LibxLabels.length - 1 ; k >= 0; k-- ) {
        // get the group of menu items!
        var CMO = LibxMenuItems[LibxLabels[k]];
        
        // Used to stop evaluation once a match is found            
        var keepGoing = true;                
        
        for (var i = 0; i < CMO.length; i++) {
            
            var menuObj = CMO[i].menuentries;
            // Hide everything to begin with
            for ( var j = 0; j < menuObj.length; j++ ) {
                libxEnv.setObjectVisible(menuObj[j].menuitem, false);
            }
            
            // only unhide if nothing else has been unhidden
            // and if there were objects defined for this category
            if ( keepGoing && menuObj.length > 0 ) { 
                
                // Pass in popuphelper to match function
                var m = CMO[i].matchf( popuphelper );   
                
                // Match is considered true if matchf returns a non-null value
                if ( m ) {
                    
                    // Call the command function that will unhide/set labels/etc
                    CMO[i].commf( m, menuObj );                    
                    
                    // Stop once a match is found & label != allOn
                    if ( k != 0 ) { 
                        keepGoing = false;
                    }
                }
            }
        }
    }        
}
