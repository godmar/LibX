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
    "jgrowl" : scriptBase + "jquery.jgrowl.js",
    "jgrowl.css" : scriptBase + "jquery.jgrowl.css",
    "legacy-cues" : scriptBase + "legacy-cues.js",
    "jquery-ui" : scriptBase + "jquery-ui.js",
    "jquery-ui.css" : scriptBase + "theme/ui.all.css"
};

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

    log ("beginning page visit " + libx.edition.name.long + " #libapps=" + libx.libapp.loadedLibapps.length);
    
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

    for (var i = 0; i < libx.libapp.loadedLibapps.length; i++) {
        executeLibapp(libx.libapp.loadedLibapps[i]);
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
        var libappSpace = new libx.libapp.TupleSpace();
        libappSpace.description = libapp.description;

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
                            sbox.evaluate(scriptText, metadata.originURL.split ( '/' ).pop() );
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
                "var libx = __libx.core.Class.mixin({ }, __libx, true); /* clone libx */\n"
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
                    libxDotLibappData.space = libappSpace;

                    var jsCode = "(function (__libx) {\n"
                        + setupSandbox
                        + "  var textNode = libx.libappdata.textNode;\n"
                        + "  var match = libx.libappdata.match;\n"
                        +       module.body
                        + "}) (libx);\n";
                
                    log("found regular expression match for module '" + module.description + "': " + match[0] + " now evaling:\n" + jsCode);
                    return sbox.evaluate(jsCode, module.description );
                }
                textExplorer.addTextTransformer(textTransformer);
            }

            function runModule(module) {

                libxDotLibappData.space = libappSpace;
                var jsCode = "/* begin module body */\n" + module.body + "\n/* end module body */\n";

                // wrap in 'guardedby' clause, if needed
                if ('guardedby' in module) {
                    var guardTuple = module.guardedby.replace(/}\s*$/, ", '_processed_by_module_" + module.id + "': libx.space.NOT }");
                    jsCode =
                      " var takeRequest = {\n"
                    + "   priority: " + module.priority + ", \n"
                    + "   template: " + guardTuple + ", \n"
                    + "   ontake: function (tuple) {\n"
                    + "       tuple['_processed_by_module_" + module.id + "'] = true;\n"
                    +            jsCode
                    + "       libx.space.take(takeRequest);\n"
                    + "   }\n"
                    + " };\n"
                    + " libx.space.take(takeRequest);\n"
                }
                jsCode = "(function (__libx) {\n"
                    + setupSandbox
                    + jsCode
                    + "}) (libx);\n"
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
                log("Running module '" + module.description + "': \n" + jsCode + "\nusing space: " + libappSpace.description);
                sbox.evaluate(jsCode, module.description );
            }
        }
    }
};

libx.events.addListener("ContentLoaded", contentLoadedObserver, window, "libapploader");

}());
