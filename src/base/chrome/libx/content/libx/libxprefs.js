


// libxConfig, as passed in from main window.
var libxConfig;

// Preferences, as passed in from main window.
var libxMenuPrefs;

// Preferences, where they will be saved
var libxUserMenuPrefs;



// Initializes the preferences window
function initPrefWindow() {
    
    if ( window.arguments )
    {
        libxConfig = window.arguments[0].config;
    }
    
    // Use user defined preferences if available
    libxMenuPrefs = new LibxXMLPreferences ( 
        libxEnv.getLocalXML ( userPrefs ) ? userPrefs : defaultPrefs );
        
    libxInitializeProperties();
    
    // Set the title
    var edition = libxEnv.xmlDoc.getAttr("/edition/name", "edition");
    
    /****** Initialize the default preferences tab *********/
    // Initialize the display preferences radiogroup
    document.getElementById ( libxEnv.getUnicharPref ( "libx.displaypref", "libx.newtabswitch" ) )
        .setAttribute ( "selected", true );
        
    // Initialize the autolinking checkbox
    document.getElementById ( "libx-autolink-checkbox" )
        .setAttribute ( "checked", libxEnv.getBoolPref ( "libx.autolink", true ) );
    
    /****** Initialize the context menu preferences tab *****/
    libxInitContextMenuTrees();
    
    /***** Initialize the AJAX tab ****/
    // Figure out whether Proxy checkbox should be grayed out or not
    var ajaxenabled = false;

    for ( var k in libxConfig.proxy ) {
        if ( libxConfig.proxy[k].urlcheckpassword )
            ajaxenabled = true;
    }
    
    if ( ajaxenabled ) {
        document.getElementById ( 'libx-proxy-ajax-checkbox')
            .setAttribute ( 'checked', libxEnv.getBoolPref ( 'libx.proxy.ajaxlabel', 'true' ) ? 'true' : 'false' );
    } else {
        document.getElementById ( 'libx-proxy-ajax-checkbox' )
            .setAttribute ( 'disabled', 'true' );
    }
    
}

// Saves all of the preferences
function libxSavePreferences() {
    /**** Saves all of the default preferences **************/
    libxEnv.setUnicharPref ( 'libx.displaypref', document.getElementById ( "libx-display-prefs" ).selectedItem.id );
    libxSelectAutolink( document.getElementById ( "libx-autolink-checkbox" ).getAttribute ( "checked" ) );

    /**** Saves all of the context menu preferences *********/
    
    // Initializes the libxUserMenuPrefs
    libxUserMenuPrefs = new LibxXMLPreferences ( userPrefs );
    libxUserMenuPrefs.children = new Array();
    libxUserMenuPrefs.nodeName = 'preferences';
    var obj = libxUserMenuPrefs.contextmenu =  new Object();
    libxUserMenuPrefs.children.push ( obj );
    obj.nodeName = 'contextmenu';
    obj.children = new Array();
    
    // Saves preferences into libxUserMenuPrefs
    function saveTree ( tree  ) {

        try {    
            var cells = getEnabledNodes( tree );
        }
        catch ( e ) { // if tree is not found
            return;
        }
        
        var type = tree.getAttribute ( 'id' ).split ( '-' )[2];
        
        var obj = new Object();
        obj.nodeName = type;
        obj.children = new Array();
        
        for ( var i = 0; i < cells.length; i++ ) {
            var entry = new Object();
            entry.attr = new Object();
            var parts = cells[i].getAttribute ( 'id' ).split ( '.' );
    
            entry.nodeName = parts[1];
            entry.attr.name = parts[2];
            entry.attr.type = parts[3];
            obj.children.push ( entry );
        }
        libxUserMenuPrefs.contextmenu.children.push ( obj );
    }
    
    function saveT ( type ) {
        saveTree ( document.getElementById( 'libx-contextmenu-' + type + '-prefs-tree' ) );
    }
    saveT ( 'isbn' );
    saveT ( 'issn' );
    saveT ( 'doi' );
    saveT ( 'general' );
    saveT ( 'pmid' );
    saveT ( 'proxy' );
    
    libxUserMenuPrefs.save();
    
    /** Save AJAX Preferences tab options **/
    libxEnv.setBoolPref ( 'libx.proxy.ajaxlabel', 
        document.getElementById ( 'libx-proxy-ajax-checkbox' ).getAttribute ( 'checked' ) == 'true' ? true : false );
    
    
}

// Saves all preferences and closes window
function libxSaveAndQuit() {
    libxSavePreferences();
    window.close();
}

// Deletes the userprefs.xml file and restores the tree
// based on defaultprefs.xml
function restoreDefault () {
    
    // Remove user prefs file
    libxEnv.removeFile ( userPrefs );
    libxMenuPrefs = new LibxXMLPreferences ( 
        libxEnv.getLocalXML ( userPrefs ) ? userPrefs : defaultPrefs );
    // Re-set prefs to default
    var nodes = document.getElementsByTagName ( 'treecell' );
    for ( var i = 0; i < nodes.length; i++ ) {
        var node = nodes[i];
        if ( node.getAttribute ( 'value' ) )
            isEnabled ( node.getAttribute ( 'id' ) ) ? 
                node.setAttribute ( 'properties', 'enabled' ) : 
                node.setAttribute ( 'properties', 'disabled' );          
        
    }
}



// Initializes all of the context menu trees
function libxInitContextMenuTrees() {
    
    /*
     * Appends a child row to the parent
     * parent should be a treeitem or tree
     */
    function addChild ( parent ) {
        parent.setAttribute ( "container", true );
        var tchildren = document.createElement ( "treechildren" );
        parent.appendChild ( tchildren );
        return tchildren;
    }

    /*                    
     * Creates the following:
     * <treeitem container=isContainer >
     *     <treerow>
     *         <treecell attr1=attrs[atr1] />
     *     </treerow>
     * </treeitem>
     * Copies all attrs to the treecell
     */
    function createRow ( attrs ) {
        var titem = document.createElement ( "treeitem" );
        
        var trow = document.createElement ( "treerow" );
        var tcell = document.createElement ( "treecell" );
    
        titem.appendChild ( trow );
        trow.appendChild ( tcell );
        for ( var k in attrs ) {
            tcell.setAttribute ( k, attrs[k] );
        }
    
        titem.setAttribute ( 'onclick', 'toggleImage ( this.children[0].children[0] )' );
        return titem;    
    }

    /*
     * Creates the high level labels for the given tree
     * @param tree      -- tree to initialize
     * @param attrs    -- array of labels & id's to create entries for
     * @return children -- array of treeitem entries that were created
     */
    function initTree ( tree, attrs ) {
        tree.setAttribute ( 'width', '250' );
        tree.setAttribute ( 'height', '150' );
        tree.setAttribute ( 'onclick', 'treeEventHandler(event, this);' );
        tree.setAttribute ( 'flex', '1' );
        
        var child = addChild ( tree );
        var children = new Array();
        for ( var k in attrs ) {
            var tmp = child.appendChild ( createRow (  {label:attrs[k][0], id:attrs[k][1]} ) );        
            children.push ( addChild ( tmp ) );
        }
        return children;
    }

    /*
     * Adds a catalog entry to the given tree
     * Can be used for a catalog or open url resolver entries
     * @param parent   -- Where to append catalog to
     * @param options  -- what options to add under catalog
     * @param idprefix -- id prefix ( each opt will be appended to the prefix
     */
    function addCatalog ( parent, name, options, idprefix ) {
        var cat1 = parent.appendChild ( createRow ( {label:name } ) );
        var cat1Children = addChild ( cat1 );
         
        var open = false;
        for ( var k in options ) {
            var opt = options[k];
            var id = idprefix + "." + name + "." + opt;
            var lbl = libxConfig.searchOptions[opt] ?
                libxConfig.searchOptions[opt] : opt;
            var enabled = isEnabled ( id ) ? 'enabled' : 'disabled';
            if ( enabled == 'enabled' )
                open = true;
            cat1Children.appendChild ( createRow ( {label:lbl, id:id, properties:enabled, value:opt} ) );
        }
         
        // Opens elements holding a enabled item
        if ( open ) {
            parent.parentNode.setAttribute ( 'open', 'true' );
    //         cat1Children.childNodes[0].setAttribute ( 'open', 'true' );
            cat1Children.parentNode.setAttribute ( 'open', 'true' );
        }
    }
    /*
     * Initializes the preferences tree with a Catalogs and OpenUrlResolvers label
     * other must specify { type:, name:, id:, options: }
     */
    function initPrefsTree ( type, catF, resolverF, proxyF, other ) {
        // unhide the tab
        var tabId = "libx-contextmenu-" + type + "-prefs-tab";
        var tabPanelId = "libx-" + type + "-tab";
        var id = "libx-contextmenu-" + type + "-prefs-tree";
        var tree = document.getElementById ( id );
        
        var types = new Array ();
        var count = 0;
        var catI;
        var resolverI;
        var proxyI;
        var otherI;
        if ( catF && libxConfig.numCatalogs > 0 ) {
            types.push ( ["Catalogs", type + ".catalog" ] );
            catI = count;
            count++;
        }
        
        if ( resolverF && libxConfig.numResolvers > 0 ) {
            types.push ( ["Open Url Resolvers", type + ".openurl" ] );
            resolverI = count;
            count++;
        }
        
        if ( proxyF && libxConfig.numProxy > 0 ) {
            types.push ( ["Proxy", type + ".proxy" ] );
            proxyI = count;
            count++;
        }
        
        if ( other ) {
            types.push ( [other.type, other.id] );
            otherI = count;
            count++;
        }
        
        
        if ( count == 0 ) {
            
            var tab = document.getElementById ( tabId );
            var tabPanel = document.getElementById ( tabPanelId );
            var tabPanels = tabPanel.parentNode;
            
            tab.parentNode.removeChild ( tab );
            tabPanel.parentNode.removeChild ( tabPanel );
            return;
        }
        
            
        var labels = initTree ( tree, types );
        
        var catalogChildren = labels[catI];
        var resolverChildren = labels[resolverI];
        var proxyChildren = labels[proxyI];
        var otherChildren = labels[otherI];
        
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
        toggleEnabled ( node.firstChild.firstChild );
    }
}



// Returns all nodes which have the enabled attribute set to true
function getEnabledNodes ( tree ) {
    return getElementsByAttribute ( tree, 'treecell', 'properties', 'enabled' );
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
function isEnabled ( id ) { //catalog, searchtype, type ) {
    var parts = id.split ( '.' );
    var type = parts[0];
    var nodeType = parts[1];
    var name = parts[2];
    var searchType = parts[3];
    
    var children = libxMenuPrefs.contextmenu[type] ? libxMenuPrefs.contextmenu[type].children : new Array();
    for ( var i = 0; children && i < children.length; i++ ) {
        if ( children[i].nodeName == nodeType ) // node type matches , ie <catalog /> is catalog node name
            if ( name && children[i].attr.name ? children[i].attr.name == name : true )   // name matches, if it is defined
                if ( searchType && children[i].attr.type ? children[i].attr.type == searchType : true ) // searchtype matches, if it is defined
                    return true;
    }
    return false;
}



