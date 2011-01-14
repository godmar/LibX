

(function () {

/*
 * Support for context menu.  
 * @class
 *
 * Requires
 *  chrome://global/content/nsDragAndDrop.js
 *  chrome://global/content/nsTransferable.js
 */
var ContextPopupHelper = libx.core.Class.create({
    /*
     * Determine if popup was opened over element of kind 'tagname'
     * @return true if so
     */
    isTag: function(/** String */ tagname) { },

    /*
     * @return true if popup was opened over hyperlink? 
     */
    isOverLink: function() { },

    /*
     * @return {String} selection, if any, else null
     */
    getSelection: function() { },

    /*
     * Determine is user selected text
     * @return {Boolean} true if text is selected
     */
    isTextSelected: function() { },

    /*
     * Get DOM node over which popup was opened
     * @return {DOMNode} over which popup was opened
     */
    getNode: function() { }
});
  
/**
 *	Returns a popuphelper object
 */
libx.ui.getPopupHelper = function () {
	return new ContextPopupHelper ();
};

/**
 *	Initializes the browsers context menu handlers
 *	Ensures that libx.browser.contextMenu.onshowing/onhiding functions
 *	are called as appropriate 
 *		
 */
libx.ui.bd = {
	initializeContextMenu : function (contextmenu) {
        // "prime" onshowing since Google Chrome has no onshowing equivalent
        contextmenu.onshowing();
	}
};

/**
 * Represents a browser-dependent Context Menu Item
 */
libx.ui.bd.ContextMenuItem = libx.core.Class.create ( {
	initialize : function () {
        this.id = chrome.contextMenus.create({
            type: "normal",
            title: "---",
            contexts: ["all"],
            onclick: this.doCommand
        });
	},
	
	doCommand : function () {
		libx.log.write ( "Error: Event handler is not set for menu item" );
	},
	
	/**
     *  Sets the label of an item
     *  @param {String} Label text
     */
	setLabel : function ( text ) {
        chrome.contextMenus.update(this.id, {
            title: text
        });
	},
	
	/**
     *	Sets the tooltip title of an item
     *	@param {String} Tooltip text
     */
	setTooltip : function ( text ) { },
	
	/**
     * Sets the event function for the menuitem
     *	@param {Function} handler function to be called when this item is clicked
     */
	setHandler : function ( handlerFunct ) {
		this.doCommand = handlerFunct;
	},
	
	/**
     * Sets the image for a menu object
     *	@param {String} url of the icon
     */
    setIcon : function (iconurl) { },
	
	/**
	 *	Sets whether this item is visible
	 *	@param {boolean} true if visible
	 */
	setVisible : function( visible ) { },
	
	/**
	 *	Sets whether this item is active ( able to be clicked )
	 *	@param {boolean} true if it is clickable
	 */
    setActive : function ( active ) { }
} );

}) ();