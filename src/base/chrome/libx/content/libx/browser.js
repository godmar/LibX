





/**
 *	libx.browser namespace
 *	Responsible for holding the instantiated objects for 
 *	browser abstractions ( ie, context menu, toolbar )
 */
libx.browser = (function () { 

var contextMenu;

var browser = { 

	/**
	 *	This is the function called once, after the initial configuration has
	 *	been loaded, to initialize the GUI elements of the interface.
	 *
	 *	In order to activate a new configuration, reload should be used instead
	 */
	initialize : function () {
		contextMenu = this.contextMenu = new ContextMenu (libx.ui.contextMenuConfig);
		libx.bd.contextmenu.initialize();
		loadContextMenu();
		// To implement:  this.toolbar = new Toolbar();
	},
	
	/**
	 *	Clears all elements, and re-loads from the current libx.edition object
	 */
	reload : function () {
		clearContextMenu();
		loadContextMenu();
	
	}
};
/**
 *	Loads the items into the context menu
 */
function loadContextMenu () {
	// Initialization of LibX Menu Items
	var libxGroupList = contextMenu.getGroupList ( 'libx' );
	var isbnGroup = libxGroupList.getGroup ( 'isbn' );
    var issnGroup = libxGroupList.getGroup ( 'issn' );
    var pmidGroup = libxGroupList.getGroup ( 'pmid' );
    var doiGroup = libxGroupList.getGroup ( 'doi' );
    var generalGroup = libxGroupList.getGroup ( 'general' );

    for ( var i = 0; i < libx.edition.catalogs.length; i++ ) {
		var catalog = libx.edition.catalogs[i];
		var options = catalog.options.split(';');
		for ( var k = 0; k < options.length; k++ ) {
			var searchOption = options[k];
			if ( searchOption != '' ) {
				if ( searchOption == 'i' ) {
					isbnGroup.createItem ( 'catalog', { name : catalog.name, searchType: searchOption } );
					issnGroup.createItem ( 'catalog', { name : catalog.name, searchType: searchOption } );
				} else {
					generalGroup.createItem ( 'catalog', { name : catalog.name, searchType: searchOption } );
				}
			}
		}
		if ( catalog.xisbn && ( catalog.xisbn.opacid ||  catalog.xisbn.oai ) ) {
           	isbnGroup.createItem ( 'catalog', { name : catalog.name, searchType: 'xisbn' } );
       	}	
	}
	
	for ( var i = 0; i < libx.edition.openurl.length; i++  ) {
		var resolver = libx.edition.openurl[i];
		isbnGroup.createItem ( 'openurl', { name : resolver.name, searchType: 'i' } );
		issnGroup.createItem ( 'openurl', { name : resolver.name, searchType: 'i' } );
		doiGroup.createItem ( 'openurl', { name : resolver.name, searchType: 'doi' } );
		pmidGroup.createItem ( 'openurl', { name : resolver.name, searchType: 'pmid' } );
	}
		
	generalGroup.createItem ( 'scholar' );
		    	
    	
	var alwaysGroupList = contextMenu.getGroupList ( 'always' );
	var proxyGroup = alwaysGroupList.getGroup ( 'proxy' );
	    
    for ( var i = 0; i < libx.edition.proxy.length; i++ ) {
    	var proxy = libx.edition.proxy[i];
		proxyGroup.createItem ( 'proxy', { name: proxy.name } );
	}
}

/**
 *	Instantiate a new ContextMenu object
 */
function clearContextMenu () {
	contextMenu = this.contextMenu = new ContextMenu (libx.ui.contextMenuConfig);
}



return browser;
})();

