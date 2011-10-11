/*
 * This code executes in the Firefox sandbox.
 *
 * We do not share the global scope here with anybody.
 * ff/window.js will have prepared this scope.
 */

libx.libappdata = {};
        
// Load all URLs marked as @type = 'bootwindow' in configuration
var bootWindowUrls = libx.edition.localizationfeeds.bootwindow;
if (bootWindowUrls.length == 0) {
    // Fall back to local preference
    bootWindowUrls.push({
        url: libx.utils.browserprefs.getStringPref( "libx.bootstrap.contentscript.url", 
                libx.locale.getBootstrapURL("bootstrapcontentscript.js") )
    });
}

var bootStrapper = new libx.bootstrap.BootStrapper();

if (!libx.initialize.globalBootStrapper.hasFinished) {
    /* Global boot strapping still in progress.  Delay bootstrapping
     * of window scripts until this is done. */
    var blockUntilGlobalBootstrapDone = new libx.utils.collections.EmptyActivity();
    bootStrapper.scriptQueue.scheduleFirst(blockUntilGlobalBootstrapDone);
    
    libx.events.addListener("GlobalBootstrapDone", {
        onGlobalBootstrapDone: function (globalBootstrapDoneEvent) {
            blockUntilGlobalBootstrapDone.markReady();
        }
    });
}

for (var i = 0; i < bootWindowUrls.length; i++)
    bootStrapper.loadScript(bootWindowUrls[i].url, {
        "libx": libx,
        "libxTemp": libxTemp,
        //"window": window
    }, window);
