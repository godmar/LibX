/*
 * Support for running libapps,
 */

(function () {

/* Adjust this */
var libappBase = "http://libx.org/libx2/libapps/";
var scriptBase = libappBase + "scripts/";

/*
 * Aliases for scripts
 */
var requireAlias = {
    "jquery" : scriptBase + "jquery-1.2.3.js",
    "legacy-cues" : scriptBase + "legacy-cues.js"
};

// This URL will be read from the edition/user configuration.
// For now, this is where I keep my feeds - ADJUST THIS FOR YOUR TESTING
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
    libx.log.write("user visited: " + event.url + " " + libx.edition.name.long + " #libapps=" + libapps.length);
    
    /**
     * Create a new sandbox in which the captured per-XUL-window 
     * 'libx' object appears under the global name 'libx'.
     */
    var sboxGlobalSpace = { libx: libx };
    var sbox = new libx.libapp.Sandbox(event.window, sboxGlobalSpace);
/*
    if (event.url.match("libx.cs.vt.edu") != null)
        sbox.evaluate("alert('You are running libx: ' + libx.edition.name.long);");
*/

    /*
     * queue that determines order of required scripts and modules.
     *
     * XXX: should not be a global queue, but rather (probably) per module.
     * Global makes it simpler to ensure that each script was loaded only
     * once. XXX
     */
    var requireQueue = new libx.utils.collections.ActivityQueue();

    /* map require url to activity */
    var requireURL2Activity = { };
    var tupleSpace = new libx.libapp.TupleSpace();
    var textExplorer = new libx.libapp.TextExplorer();

    for (var i = 0; i < libapps.length; i++) {
        executeLibapp(libapps[i]);
    }
    libx.log.write("#textTransformers: " + textExplorer.textTransformerList.length);
    textExplorer.traverse(event.window.document.documentElement);

    function executeLibapp(libapp) {

        libx.log.write("checking include/exclude for libapp: " + libapp.description, "libapp");
        // unlike for modules, 'include' for libapps is optional.
        if (libapp.include.length > 0) {
            var executeLibapp = checkIncludesExcludes(libapp, event.url);
            if (executeLibapp == null)
                return;
        }

        libx.log.write("executing libapp: " + libapp.description, "libapp");

        var moduleExecutor = {
            onmodule: function (module) {
                var executeModule = checkIncludesExcludes(module, event.url);
                if (executeModule == null)
                    return;

                libx.log.write("executing module: " + module.description + " requires: " + module.require + " match was: " + executeModule, "libapp");

                /* schedule required modules */
                for (var k = 0; k < module.require.length; k++) {
                    var rUrl = module.require[k];
                    if (rUrl in requireAlias)
                        rUrl = requireAlias[rUrl];

                    /* schedule loading of script if not already scheduled */
                    if (!(rUrl in requireURL2Activity)) {
                        requireURL2Activity[rUrl] = {
                            onready : function (scriptText, metadata) {
                                libx.log.write("Running in sandbox: " + metadata.originURL, "libapp");
                                sbox.evaluate(scriptText);
                            }
                        }

                        var rAct = requireURL2Activity[rUrl];
                        requireQueue.scheduleLast(rAct);

                        libx.log.write("requesting script: " + rUrl, "libapp");
                        libx.cache.defaultObjectCache.get({
                            url: rUrl,
                            success: function (scriptText, metadata) {
                                libx.log.write("received script: " + metadata.originURL, "libapp");
                                requireURL2Activity[rUrl].markReady(scriptText, metadata);
                            }
                        });

                    } else {
                        var rAct = requireURL2Activity[rUrl];
                    }
                }

                /* now schedule the module itself */
                var runModuleActivity = {
                    onready: function () {
                        runModule(module);
                    }
                };
                requireQueue.scheduleLast(runModuleActivity);
                runModuleActivity.markReady();

                function runModule(module) {
                    if (module.regexptexttransformer.length > 0) {
                        libx.log.write("regexptexttransformer: " + module.regexptexttransformer[0]);
                        var textTransformer 
                            = new libx.libapp.RegexpTextTransformer(module.regexptexttransformer[0]);
                        textTransformer.onMatch = function (textNode, match) {
                            libx.log.write("regexptexttransformer.match called: " + match[0] + " evaling: " + module.body);
                            return eval("(function (textNode, match) {" + module.body + "})(textNode, match);");
                        }
                        textExplorer.addTextTransformer(textTransformer);
                        return;
                    }

                    libx.log.write("Module in sandbox: " + module.description);
                    var jsCode = ""
                    + "      (function () {\n"
                    + "      " + module.body + "\n"
                    + "      }) (); \n"

                    if ('guardedby' in module) {
                        jsCode = "var takeRequest = {\n"
                        + "  priority: " + module.priority + ", \n"
                        + "  template: " + module.guardedby + ", \n"
                        + "  ontake: function (tuple) {\n"
                        +           jsCode
                        + "      libx.libapp.space.take(takeRequest);\n"
                        + "  }\n"
                        + "};\n"
                        + "libx.libapp.space.take(takeRequest);"
                    }
                    // cleaning global space
                    jsCode += "for (var p in this) {\n";
                    jsCode += "  if (p != 'window' && p != 'document' && p != 'unsafeWindow'";
                    for (var p in sboxGlobalSpace)
                        jsCode += " && p != '" + p + "'";
                    jsCode += ")\n";
                    jsCode += "   delete p;\n";
                    jsCode += "}\n";
                    jsCode += "delete p;\n";
                    libx.libapp.space = tupleSpace;
                    libx.log.write("Running code: " + jsCode, "libapp");
                    sbox.evaluate(jsCode);
                }
            }
        };

        for (var i = 0; i < libapp.entries.length; i++) {
            new libx.libapp.PackageWalker(libapp.entries[i].url).walk(moduleExecutor);
        }
    }
};

libx.events.addListener("ContentLoaded", contentLoadedObserver, window, "libapploader");

}());
