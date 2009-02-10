/*
 * Support for running libapps,
 *
 * This file will not stay here.
 */

(function () {

var observer = {
    onContentLoaded: function (event) {

        libx.log.write("user visited: " + event.url + " " + libx.edition.name.long);
    
        /**
         * Create a new sandbox in which the captured per-XUL-window 
         * 'libx' object appears under the global name 'libx'.
         */
        var sbox = new libx.libapp.Sandbox(event.window, { libx: libx });
        if (event.url.match("libx.cs.vt.edu") != null)
            sbox.evaluate("alert('You are running libx: ' + libx.edition.name.long);");
    }
}

libx.events.addListener("ContentLoaded", observer, window);

}());
