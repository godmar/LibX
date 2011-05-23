
// stores the string bundle for each module that is run
libx.libappdata.stringBundles = {};

/*
 * Return the string bundle for the the specified module.
 */
libx.libapp.getStringBundle = function (url) {
    return libx.libappdata.stringBundles[url];
};

var sbox = new libx.libapp.Sandbox( window, { libx: libx } );

/*
 * Aliases for scripts
 */
var requireAlias = {
    "jquery" : "jquery-latest.js",
    "jgrowl" : "jquery.jgrowl.js",
    "jgrowl.css" : "jquery.jgrowl.css",
    "legacy-cues" : "legacy-cues.js",
    "jquery-ui" : "jquery-ui.js",
    "jquery-ui.css" : "theme/ui.all.css"
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

var debugLevel = libx.utils.browserprefs.getIntPref('libx.libapp.debuglevel', 0);
libx.log.write("executing with a debug level of " + debugLevel);
/*
 * Log libapp activity.
 * 0: no logging
 * 1: show which modules execute
 * 2: show which modules are not executed
 * 3: show module bodies
 */
function logDetail(args) {
    if (!args.length)
        args = [ args ];
    var msg = "";
    args.forEach(function (arg) {
        if (debugLevel >= arg.level)
            msg += arg.msg;
    });
    msg && libx.log.write(msg);
}

logDetail({
    msg: "beginning page visit " + libx.edition.name.long +
        " time=" + new Date().getTime(),
    level: 1
});

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
var cachedTextTransformerModuleQueue = new libx.utils.collections.ActivityQueue();

/* map require url to activity */
var requireURL2Activity = { };

var textExplorer = new libx.libapp.TextExplorer();
    
// This code recursively walks packages, executing all libapps.
function processEntries(entries) {

    for (var i = 0; i < entries.length; i++) {
        
        (function (entry) {
        
            // this activity is used to block traverseTextActivity (below)
            // until every module in every libapp has been added to the queue
            var activity = new libx.utils.collections.EmptyActivity();
            cachedTextTransformerModuleQueue.scheduleFirst(activity);
        
            new libx.libapp.PackageWalker(entry.url).walk({
                onpackage: function (pkg) {
                    if (libx.prefs[pkg.id]._enabled._value)
                        processEntries(pkg.entries);
                    // all subpackages have been queued
                    activity.markReady();
                },
                onlibapp: function (libapp) {
                    
                    var cat = libx.prefs.getCategoryForUrl(libapp.id, [{
                        name: "_enabled",
                        type: "boolean",
                        value: "true"
                    }]);
                    
                    if (cat._enabled._value)
                        executeLibapp(libapp, entry.args);
                    // all modules in this libapp have been queued
                    // since this libapp has been executed
                    activity.markReady();
                }
            }, activity);
            
        }) (entries[i]);
    }

}

processEntries(libx.libapp.getEnabledPackages());

var traverseTextActivity = {
    onready: function () {
        // at this point, all libapps and modules that were in the cache (and
        // whose dependencies were in the cache) have been loaded, synchronously.
        logDetail({
            msg: "#textTransformers: " + textExplorer.textTransformerList.length,
            level: 1
        });
        textExplorer.traverse(window.document.documentElement);
    }
};

cachedTextTransformerModuleQueue.scheduleLast(traverseTextActivity);
traverseTextActivity.markReady();

function prepLibappOrModule(libapp) {
    var regexpClauses = [ "include", "exclude", "regexptexttransformer" ];
    for (var i = 0; i < regexpClauses.length; i++) {
        var clause = regexpClauses[i];
        for (var j = 0; j < libapp[clause].length; j++) {
            var r = libapp[clause][j];
            libapp[clause][j] = new RegExp(r.regex, r.flag);
        }
    }
}

// function ends here.  Modules and libapps will continue executing asynchronously.

function executeLibapp(libapp, pkgArgs) {
    // alert("executing: " + libx.utils.json.stringify(libapp));
    prepLibappOrModule(libapp);

    // unlike for modules, 'include' for libapps is optional.
    if (libapp.include.length > 0) {
        var executeLibapp = checkIncludesExcludes(libapp, window.location.href);
        if (executeLibapp == null) {
            logDetail({
                msg: "libapp '" + libapp.description
                    + "' not executed because it did not meet include/exclude: include="
                    + libapp.include + " exclude=" + libapp.exclude,
                level: 2
            });
            return;
        }
    }

    logDetail({
        msg: "executing libapp: " + libapp.description,
        level: 1
    });
    var libappSpace = new libx.libapp.TupleSpace();
    libappSpace.description = libapp.description;
    
    for (var i = 0; i < libapp.entries.length; i++) {
    
        (function (entry) {
    
            // activity to block the text transformers.  if the module is in the
            // cache, the module is added to the list of transformers.  
            // if it is not in the cache, the transformation will not occur until
            // the page is reloaded.
            var moduleFinishedActivity = new libx.utils.collections.EmptyActivity();
            cachedTextTransformerModuleQueue.scheduleFirst(moduleFinishedActivity);
            
            new libx.libapp.PackageWalker(entry.url).walk({
                onmodule: function (module) {
                    if (module.regexptexttransformer.length == 0)
                        moduleFinishedActivity.markReady();
                    executeModule(module, pkgArgs, entry.args, moduleFinishedActivity);
                }
            }, moduleFinishedActivity);
            
        }) (libapp.entries[i]);
    }
    
    function executeModule(module, pkgArgs, libappArgs, moduleFinishedActivity) {

        prepLibappOrModule(module);
        var executeModule = checkIncludesExcludes(module, window.location.href);
        if (executeModule == null) {
            logDetail({
                msg: "module '" + module.description
                    + "' not executed because it did not meet include/exclude: include="
                    + module.include + " exclude=" + module.exclude,
                level: 2
            });
            moduleFinishedActivity.markReady();
            return;
        }

        logDetail([
            {
                msg: "executing module: " + module.description,
                level: 1
            },
            {
                msg: "\nthis module requires: " + module.require 
                    + "\nmatching URL was: " + executeModule,
                level: 2
            }
        ]);

        /* schedule required scripts on which this module depends */
        for (var k = 0; k < module.require.length; k++) {
            var rUrl = module.require[k];
            if (rUrl in requireAlias)
                rUrl = libx.locale.getLibappScriptURL(requireAlias[rUrl]);

            if (rUrl in requireURL2Activity)
                continue;

            var rAct = requireURL2Activity[rUrl] = {
                onready : function (scriptText, metadata) {
                    if (metadata == null)
                        return;
                    if (/.*\.js$/.test(metadata.originURL)) {
                        logDetail({
                            msg: "injecting required script: " + metadata.originURL,
                            level: 1
                        });
                        sbox.evaluate(scriptText, metadata.originURL);
                    } else
                    if (/.*\.css$/.test(metadata.originURL)) {
                        var doc = window.document;
                        var heads = doc.getElementsByTagName('head');
                        var sheet = doc.createElement('style');
                        sheet.setAttribute('type', 'text/css');
                        sheet.innerHTML = scriptText;
                        logDetail({
                            msg: "injecting stylesheet: " + metadata.originURL,
                            level: 1
                        });
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
        
        var setupArgs = "";
        if (libappArgs) {
            for (var arg in libappArgs) {
                var value = libappArgs[arg].value;
                if (pkgArgs) {
                    for (var pkgArg in pkgArgs)
                        value = value.replace("{" + pkgArg + "}", pkgArgs[pkgArg].value);
                }
                setupArgs += "var " + arg + " = \"" + value + "\";\n";
                if (module.regexptexttransformer.length > 0) {
                
                    // escape any regular expression characters in the argument
                    value = value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                    
                    // replace the argument
                    var m = module.regexptexttransformer[0]
                        // convert the regex to a string to change the filter
                        .toString()
                        // replace any parameters given
                        .replace("${" + arg + "}", value)
                         // remove the surrounding slashes
                        .match(/^\/(.*)\/([^\/]*)$/)
                    
                    // convert the string back to a regex
                    module.regexptexttransformer[0] = new RegExp(m[1], m[2]);
                    
                }
            }
        }
          
        /* now schedule the module itself */
        var runModuleActivity = {
            onready: function () {
                if (module.regexptexttransformer.length > 0) {
                    runTextTransformerModule(module);
                    moduleFinishedActivity.markReady();
                } else {
                    runModule(module);
                }
            }
        };

        /* schedule the module's string bundle */
        var getModuleStringBundle = {
            onready: function () {
                var stringBundle = libx.libappdata.stringBundles[module.id];
                if (stringBundle) {
                    runModuleActivity.markReady();
                } else {
                    libx.locale.getBundle({
                        feed: module.id,
                        success: function (bundle) {
                            libx.libappdata.stringBundles[module.id] = bundle;
                            runModuleActivity.markReady();
                        }
                    });
                }
            }
        };
        requiredScripts.scheduleLast(getModuleStringBundle);
        requiredScripts.scheduleLast(runModuleActivity);
        getModuleStringBundle.markReady();
        
        function runTextTransformerModule(module) {
            logDetail({
                msg: "Adding RegexpTextTransformer Module: "
                    + module.regexptexttransformer[0],
                level: 1
            });
            var textTransformer = new libx.libapp.RegexpTextTransformer(module.regexptexttransformer[0]);
            textTransformer.onMatch = function (textNode, match) {
                // Place textNode, match, and libapp.space into the sandbox.
                libx.libappdata.textNode = textNode;
                libx.libappdata.match = match;
                libx.libappdata.space = libappSpace;
                
                var jsCode = "(function (__libx) {\n"
                    + setupSandbox
                    + setupArgs
                    + "  libx.libapp.getCurrentModule = function () { return '" + module.id + "'; };\n"
                    + "  libx.libapp.getCurrentLibapp = function () { return '" + libapp.id + "'; };\n"
                    + "  var textNode = libx.libappdata.textNode;\n"
                    + "  var match = libx.libappdata.match;\n"
                    +       module.body
                    + "}) (libx);\n";
            
                logDetail({
                    msg: "found regular expression match for module '"
                        + module.description + "': " + match[0]
                        + " now evaling:\n" + jsCode,
                    level: 3
                });
                return sbox.evaluate(jsCode, module.id);
            }
            textExplorer.addTextTransformer(textTransformer);
        }
        
        function runModule(module) {
        
            libx.libappdata.space = libappSpace;
            var jsCode = "/* begin module body */\n" + module.body + "\n/* end module body */\n";

            jsCode = "var __getCurrentModule = libx.libapp.getCurrentModule;\n"
                   + "var __getCurrentLibapp = libx.libapp.getCurrentLibapp;\n"
                   + "libx.libapp.getCurrentModule = function () { return '" + module.id + "'; };\n"
                   + "libx.libapp.getCurrentLibapp = function () { return '" + libapp.id + "'; };\n"
                   + jsCode
                   + "libx.libapp.getCurrentModule = __getCurrentModule;\n"
                   + "libx.libapp.getCurrentLibapp = __getCurrentLibapp;\n";
            
            // wrap in 'guardedby' clauses, if needed
            // compute indentation
            var indent = [ "  " ];
            for (var i = 1; i < module.guardedby.length; i++)
                indent[i] = indent[i-1] + indent[0];

            for (var i = module.guardedby.length - 1; i >= 0; i--) {
                var ind = indent[i];
                var guardTuple = module.guardedby[i].replace(/}\s*$/, ", '_processed_by_module_" + module.id + "': libx.space.NOT }");
                jsCode = ""
                + ind + "var __takereq" + i + " = {\n"
                + ind + "  priority: " + module.priority + ", \n"
                + ind + "  template: " + guardTuple + ", \n"
                + ind + "  ontake: function (tuple) {\n"
                + ind + "     __cumulativetuple = libx.core.Class.mixin(__cumulativetuple, tuple, true);\n"

                + (i == module.guardedby.length - 1 ? (
                  ind + "     tuple = __cumulativetuple;\n" 
                + ind + "     tuple['_processed_by_module_" + module.id + "'] = true;\n"
                ) : "")

                + ind +            jsCode

                + (i == module.guardedby.length - 1 ? (
                  ind + "     __cumulativetuple = { }; /* reset cumulativetuple and start over */\n"
                + ind + "     libx.space.take(__takereq0);\n"
                ) : "")

                + ind + "   }\n"
                + ind + " };\n"

                jsCode += ind + "libx.space.take(__takereq" + i + ");\n";

                if (i == 0)
                    jsCode = "var __cumulativetuple = { };\n" + jsCode;
            }

            jsCode = "(function (__libx) {\n"
                + setupSandbox
                + setupArgs
                + jsCode
                + "}) (libx);\n"
            // clean global space
            /*lib
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
            logDetail({
                msg: "Running module '" + module.description
                    + "': \n" + jsCode + "\nusing space: "
                    + libappSpace.description,
                level: 3
            });
            sbox.evaluate(jsCode, module.id);
        }
    }
}
