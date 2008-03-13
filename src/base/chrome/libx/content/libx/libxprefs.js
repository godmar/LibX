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
 *                 Nathan Baker (nathanb@vt.edu)
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * Code for the preferences window. Note that this is different from prefs.js
 * and prefs.*.js, which actually manage preferences.
 */

// libxConfig, as passed in from main window.
var libxConfig;

// Preferences, as passed in from main window.
var libxMenuPrefs;

// Preferences, where they will be saved
var libxUserMenuPrefs;

//List of root-level trees
var libxTrees;

/* Initializes the preferences window
 */
function initPrefWindow() {
    // Use user defined preferences if available
    libxMenuPrefs = new libxXMLPreferences();

    libxInitializeProperties();
    libxEnv.initPrefsGUI();
}

/* Locates a tree node given its id. Operates recursively on a tree node.
 */
function libxFindInTree(id, node) {
    if(node.id && node.id == id) {
        return node;
    }
    for(var i = 0; i < node.children.length; ++i) {
        var ret = libxFindInTree(id, node.children[i]);
        if(ret) {
            return ret;
        }
    }
    return false;
}

function libxFindTreeNode(id) {
    for(var i = 0; i < libxTrees.length; ++i) {
        var ret = libxFindInTree(id, libxTrees[i]);
        if(ret) {
            return ret;
        }
    }
    return false;
}

// Saves all of the preferences
function libxSavePreferences() {
    /**** Saves all of the default preferences **************/
    libxEnv.setUnicharPref ('libx.displaypref',  libxEnv.getDisplayPref());
    libxSelectAutolink(libxEnv.getAutolinkPref());

    /**** Saves all of the context menu preferences *********/
    libxSaveContextPrefs();

    /** Save AJAX Preferences tab options **/
    libxEnv.setBoolPref ('libx.proxy.ajaxlabel', libxEnv.getProxyPref());
    libxEnv.setBoolPref ('libx.oclc.ajaxpref', libxEnv.getOCLCPref());

    libxEnv.setBoolPref ('libx.dfuexec', libxEnv.getDFUPref());
    
    libxEnv.setBoolPref ( 'libx.urlbar.citeulike', libxEnv.getCiteulikePref() );
}

function libxSaveContextPrefs() {
    // Initializes the libxUserMenuPrefs
    libxUserMenuPrefs = new libxXMLPreferences();
    libxUserMenuPrefs.children = new Array();
    libxUserMenuPrefs.nodeName = 'preferences';
    var obj = libxUserMenuPrefs.contextmenu =  new Object();
    libxUserMenuPrefs.children.push ( obj );
    obj.nodeName = 'contextmenu';
    obj.children = new Array();
    
    // Saves preferences into libxUserMenuPrefs
    function saveTree ( tree  ) {
        try {    
            var cells = libxEnv.getEnabledNodes( tree );
        }
        catch ( e ) { // if tree is not found
            libxEnv.writeLog("Tree not found when trying to save preferences.");
            return;
        }

        var type = tree.id.split ( '-' )[2];

        var obj = new Object();
        obj.nodeName = type;
        obj.children = new Array();
        
        for ( var i = 0; i < cells.length; i++ ) {
            var entry = new Object();
            entry.attr = new Object();
            var parts = cells[i].id.split ( '.' );

            entry.nodeName = parts[1];
            entry.attr.name = parts[2];
            entry.attr.type = parts[3];
            obj.children.push ( entry );
        }
        libxUserMenuPrefs.contextmenu.children.push ( obj );
    }

    for(var i = 0; i < libxTrees.length; ++i) {
        saveTree(libxTrees[i]);
    }

    libxUserMenuPrefs.save();
}

// Saves all preferences and closes window
function libxSaveAndQuit() {
    if(libxConfig) {
        libxSavePreferences();
    }
    window.close();
}

// Deletes the userprefs.xml file and restores the tree
// based on defaultprefs.xml
function restoreDefault () {
    // Remove user prefs file
    libxEnv.removeFile ( libxEnv.userPrefs );
    libxMenuPrefs = new libxXMLPreferences();

    libxEnv.resetToDefaultPrefs();
}

// Initializes all of the context menu trees
function libxInitContextMenuTrees() {
    libxTrees = new Array();
    /*  addCatalog
     * Adds a catalog entry to the given tree
     * 
     * @param parent {PrefsTreeNode}  Where to append the new node
     * @param name {string}           String used to build the node ID
     * @param options {object}        What options (subnodes) to add under new node
     * @param idprefix {string}       String prepended to node ID
     * 
     * This function adds a node entry for a catalog, resolver, etc. This
     * entry contains subentries which are the actual options users can
     * enable/disable. These subentries are passed in the options parameter.
     *
     * These subentries/options have (hopefully) unique IDs. These IDs are
     * built through {idprefix}.{name}.{option}. For example, this may give
     * us "isbn.Addison.xISBN" for the checkbox that determines whether to
     * display the Addison xISBN resolver in the context menu.
     */
    function addCatalog (parent, name, options, idprefix) {
        var catalogNode = parent.createChild(name, idprefix + '.' + name);

        var open = false;
        for (var k in options) {
            var opt = options[k];
            var id = idprefix + "." + name + "." + opt;
            var lbl = libxConfig.searchOptions[opt] ?
                libxConfig.searchOptions[opt] : opt;
            var enabled = isEnabled (id) ? 'enabled' : 'disabled';
            if (enabled == 'enabled') {
                open = true;
            }
            catalogNode.createChild(lbl,
                                    id,
                                    {   label:lbl,
                                        id:id,
                                        properties:enabled,
                                        value:opt
                                    });
        }

        // Opens elements holding a enabled item
        if(open) {
            catalogNode.setExpanded(open);
            parent.setExpanded(open);
        }
    }
    /*
     * Initializes the preferences tree with a Catalogs and OpenUrlResolvers label
     * other must specify { type:, name:, id:, options: }
     */
    function initPrefsTree ( type, catF, resolverF, proxyF, other ) {
        //Build the ID strings
        var tabId = "libx-contextmenu-" + type + "-prefs-tab";
        var tabPanelId = "libx-" + type + "-tab";
        var id = "libx-contextmenu-" + type + "-prefs-tree";

        var types = new Array ();
        var newID;
        var catID;
        var resolverID;
        var proxyID;
        var otherID;

        if ( catF && libxConfig.numCatalogs > 0 ) {
            newID = type + ".catalog";
            types.push ( {label: "Catalogs", id: newID} );
            catID = newID;
        }

        if ( resolverF && libxConfig.numResolvers > 0 ) {
            newID = type + ".openurl";
            types.push ( {label: "Open Url Resolvers", id: newID} );
            resolverID = newID;
        }

        if ( proxyF && libxConfig.numProxy > 0 ) {
            newID = type + ".proxy";
            types.push ( {label: "Proxy", id: newID} );
            proxyID = newID;
        }

        if ( other ) {
            newID = other.id;
            types.push ( {label: other.type, id: other.id} );
            otherID = other.id;
        }

        if ( types.length == 0 ) {
            //Remove the tab and bail (nothing to do)
            //Note that the tab hasn't even been added yet in IE, but
            //the function is smart enough to handle that.
            libxEnv.removeContextMenuPreferencesTab(type);
            return;
        }

        var treeNode = libxEnv.initTree(id, types);
        libxTrees.push(treeNode);

        var catalogChildren = treeNode.getChild(catID);
        var resolverChildren = treeNode.getChild(resolverID);
        var proxyChildren = treeNode.getChild(proxyID);
        var otherChildren = treeNode.getChild(otherID);

        if ( catF ) {
            for ( var k in libxConfig.catalogs ) {
                var cat = libxConfig.catalogs[k];
                var opts = catF ( cat );
                if ( opts )
                    addCatalog ( catalogChildren, k, opts, type + ".catalog" );
            }
        }

        if ( resolverF ) {
            for ( var k in libxConfig.resolvers ) {
                var opts = resolverF ( libxConfig.resolvers[k] );
                if ( opts )
                    addCatalog ( resolverChildren, k, opts, type + ".openurl" );
            }
        }

        if ( proxyF ) {
            for ( var k in libxConfig.proxy ) {
                var opts = proxyF ( libxConfig.proxy[k] );
                if ( opts )
                    addCatalog ( proxyChildren, k, opts, type + ".proxy" );
            }    
        }

        if ( other ) {
            addCatalog ( otherChildren, other.name, other.options, other.id );
        }
    }

    // Initializes the default preferences tree
    initPrefsTree ( 'general', 
    function ( cat ) {
        var options = cat.options.split ( ';' );
        var opts = new Array();
        for ( var k in options ) {
            if ( options[k] != 'i' )
                opts.push ( options[k] );
        }
        return opts;        
    },
    null, 
    null,
    { type:"Scholar", name:"Google Scholar", id:"general.scholar", options:["magicsearch"] }
    );

    // Initializes the ISBN Preference Tree
    initPrefsTree ( 'isbn', 
    function ( cat ) {
        var opts = new Array();
        
        if ( cat.options.indexOf ( 'i' ) >= 0 ) {
            opts.push ( 'i' );
        }
        if ( cat.xisbn && ( cat.xisbn.opacid ||  cat.xisbn.oai ) ) {
            opts.push ( 'xisbn' );
        }
        
        return opts.length > 0 ? opts : null;
    },
    function ( resolver ) {
        return ['i'];
    });
    
    // Initializes the issn preferences tree    
    initPrefsTree ( 'issn', 
    function ( cat ) {
        if ( cat.options.indexOf ( 'i' ) >= 0 )
            return ['i'];
        return null;
    },
    function ( resolver ) {
        return ['i'];
    });

    // Initializes the pmid preferences tree
    initPrefsTree ( 'pmid', 
    null,
    function ( resolver ) {
        return ['pmid'];
    });

    // Initializes the DOI preference tree
    initPrefsTree ( 'doi', 
    null,
    function ( resolver ) {
        return ['doi'];
    });

    // Initializes the proxy preference tree
    initPrefsTree ( 'proxy',
    null,
    null,
    function ( proxy ) {
        return ['enabled'];
    }
    );    
}



/*
 * Event handler called when something in the tree is double clicked
 * Will toggle the image/enabled of a treecell if it is a leaf node
 */
function treeEventHandler(e, tree) {
    var row = {}, column = {}, part = {};

    var boxobject = tree.boxObject; 
    boxobject.QueryInterface(Components.interfaces.nsITreeBoxObject);
    boxobject.getCellAt(e.clientX, e.clientY, row, column, part);
    try {
        var view = tree.contentView;
        // The treeitem
        var node = view.getItemAtIndex ( row.value );
    } catch ( e ) { // Invalid row index, return
        return;
    }
    var cellItem = node.firstChild.firstChild;
    
    // Only leaf nodes have the 'value' attribute set
    if ( cellItem.getAttribute ( 'value' ) ) {
        var node = libxFindTreeNode(cellItem.id);
        if(node) {
            node.toggleEnabled();
            toggleEnabled (cellItem);
        }
    }
}

/*
 * Toggles Image for the given node
 * Expects node to be a treecell
 */
function toggleEnabled (node) {
    node.getAttribute ( 'properties' ) == 'enabled' ? node.setAttribute ( 'properties', 'disabled' ) : node.setAttribute ( 'properties', 'enabled' );
}

/*
 * Returns true if a particular search option is enabled
 * id will look something like: isbn.catalog.Addison.i
 */
function isEnabled ( id ) { 
    var parts = id.split ( '.' );
    var type = parts[0];
    var nodeType = parts[1];
    var name = parts[2];
    var searchType = parts[3];

    var children = libxMenuPrefs.contextmenu[type] ? libxMenuPrefs.contextmenu[type].children : new Array();

    for ( var i = 0; children && i < children.length; i++ ) {
        if ( children[i].nodeName == nodeType ) // node type matches , ie <catalog /> is catalog node name
            if ( name && children[i].attr.name ? children[i].attr.name == name : true )   // name matches, if it is defined
                if ( searchType && children[i].attr.type ? children[i].attr.type == searchType : true ) {
                    // searchtype matches, if it is defined
                    return true;
                }
    }
    return false;
}



