/*
 * Browser dependent definitions of global functions.
 */

/*
 * FF-specific implementation of logging.
 */
libx.log.bd = {
    /*
     * @see libx.log.bd.write
     */
    write : function (msg) {
        var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
            .getService(Components.interfaces.nsIConsoleService);
        consoleService.logStringMessage(msg);
    },

    /*
     * @see libx.log.bd.backtrace
     */
    backtrace : function (msg) {
        var stack = Components.stack;
        this.write(msg);
        while (stack) {
            this.write(" *** " + stack.name + " (" + stack.fileName + ":" + stack.lineNumber + ")");
            stack = stack.caller;
        }
    }
}

libx.cache.bd = {
    getXMLHttpReqObj : function () {
       return Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                .createInstance(Components.interfaces.nsIXMLHttpRequest);
    }
};

(function () {
// store reference to interval timers to prevent GC
var timers = [];

function setTimer(callback, timeout, nsITimer_TYPE) {
	var timer = Components.classes['@mozilla.org/timer;1']
    	.createInstance(Components.interfaces.nsITimer);
    timer.initWithCallback({notify: function (timer) {		
                    if (typeof callback == "string")
                        eval (callback);
                    else
                        callback ();
                }}, timeout, nsITimer_TYPE);
    return timer;
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
    var timer = setTimer(callback, timeout, Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);
    // Need to keep a reference to this timer to prevent it from being GC'd
    timers.push ( timer );
}

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
}

}) ();

/*
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

/**
 * Browser-dependent implementation of a bundle of strings representing
 * properties.
 *
 * @class
 */
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
