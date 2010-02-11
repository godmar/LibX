
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