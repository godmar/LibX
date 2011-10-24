
/*
 * Google Chrome-specific implementation of logging.
 */
libx.log.bd = {
    /*
     * @see libx.log.bd.write
     */
    write : function (msg) {
        console.log(msg);
    },

    /*
     * @see libx.log.bd.backtrace
     */
    backtrace : function (msg) {
        throw new Error("libx.log.bd.backtrace() is not supported");
    }
}