
/*
 * FF-specific implementation of logging.
 * implements abstract functions in core/global/shared/log.js
 */
libx.log.bd = {
    write : function (msg) {
        var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
            .getService(Components.interfaces.nsIConsoleService);
        consoleService.logStringMessage(msg);
    },

    backtrace : function (msg) {
        var stack = Components.stack;
        this.write(msg);
        while (stack) {
            this.write(" *** " + stack.name + " (" + stack.fileName + ":" + stack.lineNumber + ")");
            stack = stack.caller;
        }
    }
}
