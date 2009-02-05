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

