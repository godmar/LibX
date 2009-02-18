/*
 * Support for running libapps.
 */

(function () {

/* This URL will be read from the edition/user configuration.
 * For now, this is where I keep my feeds - ADJUST THIS FOR YOUR TESTING
 */
var libappBase = "http://libx.org/libx2/libapps/";
var scriptBase = libappBase + "scripts/";

/*
 * Aliases for scripts
 */
var requireAlias = {
    "jquery" : scriptBase + "jquery-latest.js",
    "legacy-cues" : scriptBase + "legacy-cues.js"
};

var rootPackages = [ libappBase + "libxcore" ];

var libapps = [];

// Step 1. Find all libapps in the root packages
// This code registers all libapps on browser-window startup
// registrations will progress as quickly as the package tree
// can be walked.  It may be the case that an ContentLoaded event
// fires before the walk is complete, resulting in libapps
// not being executed on the first visit.
var RegisterLibappsClass = new libx.core.Class.create(libx.libapp.PackageVisitor, {
    onlibapp: function (libapp) {
        libapps.push(libapp);
        libx.log.write("registered libapp: " + libapp.description);
    }
});
var registerLibapps = new RegisterLibappsClass();

for (var i = 0; i < rootPackages.length; i++) {
    new libx.libapp.PackageWalker(rootPackages[i]).walk(registerLibapps);
}

// record last set of loaded libapps with global object, for prefs display
libx.global.libapp.loadedLibapps = libapps;

/*
 * Check if include/exclude applies.
 * Returns match if successful, null otherwise
 */
function checkIncludesExcludes(spec, url)
{
    var executeModule = null;
    for (var k = 0; k < spec.include.length; k++) {
        var executeModule = url.match(spec.include[k]);
        if (executeModule != null)
            break;
    }

    for (var k = 0; executeModule != null && k < spec.exclude.length; k++) {
        if (spec.exclude[k].test(url)) {
            executeModule = null;
        }
    }

    return executeModule;
}

var contentLoadedObserver = { };
contentLoadedObserver.onContentLoaded = function (event) {

    function log(msg) {
        libx.log.write("Sandbox (" + event.url + "):\n" + msg, "libapp");
    }

    log ("beginning page visit " + libx.edition.name.long + " #libapps=" + libapps.length);
    
    /*
     * A shallow clone of the per-XUL-window 'libx' object appears 
     * under the global name 'libx'
     *
     * libx.space refers to the per-page tuple space.
     *
     * libx.regexp refers to the match if a regexp text transformer
     * executes.
     */
    var libxDotLibappData = { };    // an object for holding data that is per libapp.
    var libxClonePlusAppData = libx.core.Class.mixin({ libappdata : libxDotLibappData }, libx, true);

    var sboxGlobalSpace = { libx: libxClonePlusAppData };
    var sbox = new libx.libapp.Sandbox(event.window, sboxGlobalSpace);

/*
    if (event.url.match("libx.cs.vt.edu") != null)
        sbox.evaluate("alert('You are running libx: ' + libx.edition.name.long);");
*/

    /*
     * Queue that determines order of required scripts.
     * In the implementation below, this is a global queue.
     * Each script and style-sheet is loaded exactly once
     * into the sandbox.  Thus, scripts share the global
     * namespace within the sandbox.
     *
     * Module execution is added to this queue as well to 
     * ensure it occurs after all required scripts have been
     * loaded and all required style sheets have been injected.
     *
     * Each libapp has however its own tuple space.  On each entry 
     * into the sandbox, we clone 'libx' and capture the current 
     * libapp's tuple space in libx.space.
     */
    var requiredScripts = new libx.utils.collections.ActivityQueue();

    /* map require url to activity */
    var requireURL2Activity = { };

    var textExplorer = new libx.libapp.TextExplorer();

    for (var i = 0; i < libapps.length; i++) {
        executeLibapp(libapps[i]);
    }

    // at this point, all libapps and modules that were in the cache (and
    // whose dependencies were in the cache) have been loaded, synchronously.
    log("#textTransformers: " + textExplorer.textTransformerList.length);
    textExplorer.traverse(event.window.document.documentElement);

    // function ends here.  Modules and libapps will continue executing asynchronously.

    function executeLibapp(libapp) {

        // unlike for modules, 'include' for libapps is optional.
        if (libapp.include.length > 0) {
            var executeLibapp = checkIncludesExcludes(libapp, event.url);
            if (executeLibapp == null)
                return;
        }

        log("after URL check, executing libapp: " + libapp.description);
        libapp.space = new libx.libapp.TupleSpace()

        for (var i = 0; i < libapp.entries.length; i++) {
            new libx.libapp.PackageWalker(libapp.entries[i].url).walk({
                onmodule: function (module) {
                    executeModule(module);
                }
            });
        }

        function executeModule(module) {
            var executeModule = checkIncludesExcludes(module, event.url);
            if (executeModule == null)
                return;

            log("after URL check, executing module: " + module.description 
                + "\nthis module requires: " + module.require 
                + "\nmatching URL was: " + executeModule);

            /* schedule required scripts on which this module depends */
            for (var k = 0; k < module.require.length; k++) {
                var rUrl = module.require[k];
                if (rUrl in requireAlias)
                    rUrl = requireAlias[rUrl];

                if (rUrl in requireURL2Activity)
                    continue;

                var rAct = requireURL2Activity[rUrl] = {
                    onready : function (scriptText, metadata) {
                        if (/.*\.js$/.test(metadata.originURL)) {
                            log("injecting required script: " + metadata.originURL);
                            sbox.evaluate(scriptText);
                        } else
                        if (/.*\.css$/.test(metadata.originURL)) {
                            var doc = event.window.document;
                            var heads = doc.getElementsByTagName('head');
                            var sheet = doc.createElement('link');
                            sheet.setAttribute('rel', 'stylesheet');
                            sheet.setAttribute('type', 'text/css');
                            sheet.setAttribute('href', metadata.chromeURL);
                            log("injecting stylesheet: " + metadata.originURL + " as " + metadata.chromeURL);
                            heads[0].appendChild(sheet);
                        }
                    }
                }

                requiredScripts.scheduleLast(rAct);

                libx.cache.defaultObjectCache.get({
                    url: rUrl,
                    success: function (scriptText, metadata) {
                        requireURL2Activity[this.url].markReady(scriptText, metadata);
                    }
                });
            }

            /* code to set up the sandbox by shallow-cloning libx and setting the 
             * correct libx.space property.  Assumes that libxDotLibappData was
             * initialized correctly prior to calling into the sandbox.
             * Repeated execution will clone the previous clone, which 
             * is fine (and almost autopoeitic.) */
            var setupSandbox = 
                "libx = libx.core.Class.mixin({ }, libx, true);\n"
              + "libx.space = libx.libappdata.space;\n";

            /* now schedule the module itself */
            var runModuleActivity = {
                onready: function () {
                    if (module.regexptexttransformer.length > 0) {
                        runTextTransformerModule(module);
                    } else {
                        runModule(module);
                    }
                }
            };
            requiredScripts.scheduleLast(runModuleActivity);
            runModuleActivity.markReady();

            function runTextTransformerModule(module) {
                log("Adding RegexpTextTransformer Module: " + module.regexptexttransformer[0]);
                var textTransformer = new libx.libapp.RegexpTextTransformer(module.regexptexttransformer[0]);
                textTransformer.onMatch = function (textNode, match) {
                    // Place textNode, match, and libapp.space into the sandbox.
                    libxDotLibappData.textNode = textNode;
                    libxDotLibappData.match = match;
                    libxDotLibappData.space = libapp.space;

                    var jsCode = setupSandbox + "(function () {\n"
                        + "  var textNode = libx.libappdata.textNode;\n"
                        + "  var match = libx.libappdata.match;\n"
                        +       module.body
                        + "}) ();\n";
                
                    log("found regular expression match for module '" + module.description + "': " + match[0] + " now evaling:\n" + jsCode);
                    return sbox.evaluate(jsCode);
                }
                textExplorer.addTextTransformer(textTransformer);
            }

            function runModule(module) {

                libxDotLibappData.space = libapp.space;
                var jsCode = ""
                + "      (function () {\n"
                + "      " + module.body + "\n"
                + "      }) (); \n"

                // wrap in 'guardedby' clause, if needed
                if ('guardedby' in module) {
                    jsCode = "(function () {\n"
                    + " var takeRequest = {\n"
                    + "   priority: " + module.priority + ", \n"
                    + "   template: " + module.guardedby + ", \n"
                    + "   ontake: function (tuple) {\n"
                    +            jsCode
                    + "       libx.space.take(takeRequest);\n"
                    + "   }\n"
                    + " };\n"
                    + " libx.space.take(takeRequest);\n"
                    + "}) ();\n"
                }
                // clean global space
                /*
                 * We cannot clean the global space, or we kill items added by required scripts,
                 * such as $.  We could remember which items were there before, and remove all
                 * others.
                 *
                jsCode += "for (var p in this) {\n";
                jsCode += "  if (p != 'window' && p != 'document' && p != 'unsafeWindow'";
                for (var p in sboxGlobalSpace)
                    jsCode += " && p != '" + p + "'";
                jsCode += ")\n";
                jsCode += "   delete this[p];\n";
                jsCode += "}\n";
                jsCode += "delete this.p;\n";
                */
                jsCode = setupSandbox + jsCode;
                log("Running module '" + module.description + "': \n" + jsCode);
                sbox.evaluate(jsCode);
            }
        }
    }
};

libx.events.addListener("ContentLoaded", contentLoadedObserver, window, "libapploader");

}());
