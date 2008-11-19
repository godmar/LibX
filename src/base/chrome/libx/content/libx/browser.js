
/**
 *
 *  @namespace libx.browser
 *	@constructor
 *	libx.browser namespace
 *	Responsible for holding the instantiated objects for 
 *	browser abstractions ( ie, context menu, toolbar )
 */
libx.browser = (function () { 
/** @private */
var contextMenu;

/**
 *	This is the browser object
 */
var browser = 
/** @lends libx.browser */
{ 
	/**
	 *	This is the function called once, after the initial configuration has
	 *	been loaded, to initialize the GUI elements of the interface.
	 *
	 *	In order to activate a new configuration, reload should be used instead
	 */
	initialize : function () {		
		libx.bd.initialize();
		
		// To implement:  this.toolbar = new Toolbar();
	},
	
	/**
	 *	
	 */
	activateConfiguration : function (edition) {
        libx.bd.activateConfiguration (edition);
		contextMenu = this.contextMenu = 
            new libx.ui.ContextMenu 
                (libx.ui.basicContextMenuDescriptor, edition);
	}
};


return browser;
})();

