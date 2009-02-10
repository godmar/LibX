/*
 * Browser dependent definitions of global functions.
 */

/**
 * @namespace
 *
 * FF-specific implementation of logging.
 */
libx.log.bd = {
    /**
     * Write a message to the JS console
     * @param {String} msg message to write
     */
    write : function (msg) {
        var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
            .getService(Components.interfaces.nsIConsoleService);
        consoleService.logStringMessage(msg);
    }
}

libx.cache.bd = {
    /**
     * Create XHR object
     */
    getXMLHttpReqObj : function () {
       return Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                .createInstance(Components.interfaces.nsIXMLHttpRequest);
    }
}

(function () {

function setTimer(callback, timeout, nsITimer_TYPE) {
	return Components.classes['@mozilla.org/timer;1']
    	.createInstance(Components.interfaces.nsITimer)
        .initWithCallback({notify: function () {
                    if (typeof callback == "string")
                        eval (callback);
                    else
                        callback ();
                }}, timeout, nsITimer_TYPE);
}

/**
 *	Initiates a timeout that will trigger the callback function periodically
 *	after the specified timeout
 *
 *	Intended to be compatible with window.setInterval
 *
 *	@param {Function|String} Callback function or statement
 *	@param {Integer} Timeout ( in milliseconds )
 */
libx.utils.timer.setInterval = function ( callback, timeout ) {
    setTimer(callback, timeout, Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);
};

/**
 *	Initiates a timeout that will trigger the callback function exactly once
 *	after the specified timeout
 *
 *	Intended to be compatible with window.setTimeout
 *
 *	@param {Function|String} Callback function or statement
 *	@param {Integer} Timeout ( in milliseconds )
 */
libx.utils.timer.setTimeout = function ( callback, timeout ) {
    setTimer(callback, timeout, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
};

}) ();

/**
 * Load XML Document from String
 *
 * @param {String} xmlstring
 * @return {DOMDocument} parsed document
 */
libx.utils.xml.loadXMLDocumentFromString = function (xmlstring) {
    var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
             .createInstance(Components.interfaces.nsIDOMParser);
    return parser.parseFromString(xmlstring, "text/xml");
}

libx.locale.bd.StringBundle = libx.core.Class.create ( 
/** @lends libx.locale.bd.StringBundle */ {

	initialize : function ( filename ) {
		var stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"]  
	            .getService(Components.interfaces.nsIStringBundleService);
		this.bundle = stringBundleService.createBundle(filename);
	},
	/**
	 *	Returns a string with specified name
	 *	@param {String} name of property
	 *	@param {String[]} additional arguments
	 *	@return {String} Formatted property
	 */
	getFormattedString : function ( name, args ) {
		return this.bundle.formatStringFromName ( name, args, args.length );
	},
	/**
	 *	Returns a formatted property string
	 *	@param {String} name of property
	 *	@return {String} property
	 */
	getString : function ( name ) {
		return this.bundle.GetStringFromName ( name );
	}
} );
