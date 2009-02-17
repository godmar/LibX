/*
 * Support for running libapps,
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
    "jquery" : scriptBase + "jquery-1.2.3.js",
    "legacy-cues" : scriptBase + "legacy-cues.js"
};

var rootPackages = [ libappBase + "libxcore" ];

var libapps = [];

// Step 1. Find all libapps in the root packages
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
    var libxDotRegexp = { }; 
    var libxClone = { space : new libx.libapp.TupleSpace(), regexp : libxDotRegexp };
    libx.core.Class.mixin(libxClone, libx, true);

    var sboxGlobalSpace = { libx: libxClone };
    var sbox = new libx.libapp.Sandbox(event.window, sboxGlobalSpace);

/*
    if (event.url.match("libx.cs.vt.edu") != null)
        sbox.evaluate("alert('You are running libx: ' + libx.edition.name.long);");
*/

    /*
     * queue that determines order of required scripts and modules.
     *
     * In the implementation below, this is a global queue.
     * Each module, and thus each dependent script, is loaded 
     * exactly once.
     *
     * This will work for many cases, and is the most efficient since
     * scripts such as jQuery are loaded into only 1 sandbox.
     *
     * However, it will not allow any separation of libapps. 
     * Not clear what to do -
     * Should we separate all libapps, give each its own sandbox and tuple space?
     * Or should we separate a libapp if it is denoted wit a "separate" flag?
     *
     * An additional issue are text transformers.  Ideally, we'd like to
     * run only one - but then the question arises into which tuple space this
     * one text transformers places tuples... but it may actually be possible
     * to have just one text explorer whose transformers place items into multiple 
     * tuple spaces.
     */
    var requireQueue = new libx.utils.collections.ActivityQueue();

    /* map require url to activity */
    var requireURL2Activity = { };

    var textExplorer = new libx.libapp.TextExplorer();

    for (var i = 0; i < libapps.length; i++) {
        executeLibapp(libapps[i]);
    }

    log("#textTransformers: " + textExplorer.textTransformerList.length);
    textExplorer.traverse(event.window.document.documentElement);

    function executeLibapp(libapp) {

        // unlike for modules, 'include' for libapps is optional.
        if (libapp.include.length > 0) {
            var executeLibapp = checkIncludesExcludes(libapp, event.url);
            if (executeLibapp == null)
                return;
        }

        log("after URL check, executing libapp: " + libapp.description);

        // we run each module only once, no matter how many libapps refer to it
        var hasModuleRun = { };

        for (var i = 0; i < libapp.entries.length; i++) {
            new libx.libapp.PackageWalker(libapp.entries[i].url).walk({
                onmodule: function (module) {
                    if (module.id in hasModuleRun)
                        return;

                    hasModuleRun[module.id] = 1;
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

                requireURL2Activity[rUrl] = {
                    onready : function (scriptText, metadata) {
                        if (/.*\.js$/.test(metadata.originURL)) {
                            log("injecting required script: " + metadata.originURL);
                            sbox.evaluate(scriptText);
                        } else
                        if (/.*\.css$/.test(metadata.originURL)) {
                            // $('head').append ( '<link href="http://libx2/libx2/libapps/scripts/jquery.jgrowl.css" rel="stylesheet" type="text/css" />');
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

                var rAct = requireURL2Activity[rUrl];
                requireQueue.scheduleLast(rAct);

                libx.cache.defaultObjectCache.get({
                    url: rUrl,
                    success: function (scriptText, metadata) {
                        requireURL2Activity[rUrl].markReady(scriptText, metadata);
                    }
                });
            }

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
            requireQueue.scheduleLast(runModuleActivity);
            runModuleActivity.markReady();

            function runTextTransformerModule(module) {
                log("Adding RegexpTextTransformer Module: " + module.regexptexttransformer[0]);
                var textTransformer = new libx.libapp.RegexpTextTransformer(module.regexptexttransformer[0]);
                textTransformer.onMatch = function (textNode, match) {
                    //
                    libxDotRegexp.textNode = textNode;
                    libxDotRegexp.match = match;

                    var jsCode = "(function () {\n"
                        + "  var textNode = libx.regexp.textNode;\n"
                        + "  var match = libx.regexp.match;\n"
                        +       module.body
                        + "}) ();\n";
                
                    log("found regular expression match for module '" + module.description + "': " + match[0] + " now evaling:\n" + jsCode);
                    return sbox.evaluate(jsCode);
                }
                textExplorer.addTextTransformer(textTransformer);
            }

            function runModule(module) {

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
                log("Running module '" + module.description + "': \n" + jsCode);
                sbox.evaluate(jsCode);
            }
        }
    }
};

libx.events.addListener("ContentLoaded", contentLoadedObserver, window, "libapploader");

}());
