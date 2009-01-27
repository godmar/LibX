
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
	 *	Initialize the browser-specific GUI elements, if needed.
	 *	Called once.
	 *
	 *	This function does not read and activate a LibX configuration; this
	 *	is done by activateConfiguration
	 */
	initialize : function () {		
		libx.bd.initialize();
		
		// To implement:  this.toolbar = new Toolbar();
	},
	
	/**
	 * Activate a given configuration.
	 *
	 * @param edition edition configuration object
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

