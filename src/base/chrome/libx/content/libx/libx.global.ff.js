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

/**
 *	Initiates a timeout that will trigger the callback function exactly once
 *	after the specified timeout
 *	@param {Integer} Timeout ( in milliseconds )
 *	@param {Function} Callback function 
 */
libx.utils.timer.setTimeout = function ( timeout, callback ) {
	Components.classes['@mozilla.org/timer;1']
    	.createInstance(Components.interfaces.nsITimer)
        .initWithCallback({notify: callback}, timeout,
                Components.interfaces.nsITimer.TYPE_ONE_SHOT );
};
