/*
 * This code is run as a content script in the isolated world (Chrome) or the
 * sandbox emulating it (Firefox)
 *
 * An edition may not have been loaded yet.
 * Preferences are also not available yet (in Chrome)
 */
(function () {

/*
 * Internal storage of string bundles.
 * String bundles should be accessed using {@link libx.libapp.getStringBundle}.
 */
libx.libappdata.stringBundles = {};

/**
 * Return the string bundle for the the specified URL.
 * Available only to content scripts and LibApps.
 * @param {String} url  url of a libapp or module
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
    "autolink.css" : "autolink.css",
    "tooltip.css" : "tooltip.css",
    "legacy-cues" : "legacy-cues.js",
    "search-widget" : "search.js"
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

var debugLevel;

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

/* This activity queue controls all dependencies here.
 * It's marked ready in processPage below once the edition is known.
 */
var cachedTextTransformerModuleQueue = new libx.utils.collections.DelayedActivityQueue();

/* map require url to activity */
var requireURL2Activity = { };

var textExplorer = new libx.libapp.TextExplorer();

var overridden;         // list of override pairs
var haveOverridden = new libx.utils.collections.EmptyActivity();
cachedTextTransformerModuleQueue.scheduleFirst(haveOverridden);

/*
 * libx.libapp.getOverridden() only returns items that are in the cache,
 * meaning our list of overridden pairs may be incomplete.  As we execute
 * libapps, check all loaded entries to see if they override others; it's
 * possible that we may detect overriding libapps that weren't available when
 * we called libx.libapp.getOverriden().  If so, we still need to be lucky in
 * that the overriding libapp must be walked before the overridden one.  Blame
 * Dr. Back for this extreme optimization.
 */
function checkOverride(entry, callback) {
    libx.prefs.getCategoryForUrl(entry.id,
        [{ name: "_enabled", type: "boolean", value: "true" }]);
    if (libx.prefs[entry.id]._enabled._value) {
        if (entry.override) {
            var overridee = entry.override;
            var overrider = entry.id;
            if (!overridden[overridee])
                overridden[overridee] = {};
            overridden[overridee][overrider] = 1;
        }
        callback();
    }
}

// This code recursively walks packages, executing all libapps.
function processEntries(entries) {

    entries.forEach(function (entry) {

        // if this entry is overridden, it will be processed later
        // (or has already been processed)
        if (overridden[entry.url]) {
            var overriders = [];
            for (var i in overridden[entry.url])
                overriders.push(i);
            logDetail({
                msg: entry.url + " did not execute because it was overridden by "
                               + overriders.join(', '),
                level: 1
            });
            return;
        }
    
        // this activity is used to block traverseTextActivity (below)
        // until every module in every libapp has been added to the queue
        var activity = new libx.utils.collections.EmptyActivity();
        cachedTextTransformerModuleQueue.scheduleFirst(activity);
    
        new libx.libapp.PackageWalker(entry.url).walk({
            onpackage: function (pkg) {
                checkOverride(pkg, function () {
                    processEntries(pkg.entries);
                });
                // all subpackages have been queued
                activity.markReady();
            },
            onlibapp: function (libapp) {
                checkOverride(libapp, function () {
                    executeLibapp(libapp, entry.args);
                });
                // all modules in this libapp have been queued
                // since this libapp has been executed
                activity.markReady();
            },
            error: function () {
                logDetail({
                    msg: "Error: entry '" + entry.url + "' could not be loaded",
                    level: 1
                });
                activity.markReady();
            }
        }, activity);
        
    });

}

// processing entries has returned, which means that all in-cache
// modules have run; the text transformer queue is primed for document
// traversal.
var haveProcessedEntries = new libx.utils.collections.EmptyActivity();

var doWalk = {
    onready: function (enabledPackages) {
        processEntries(enabledPackages.map(function (pkg) {
            return { url: pkg };
        }));
        haveProcessedEntries.markReady();
    }
};

cachedTextTransformerModuleQueue.scheduleLast(doWalk);
libx.libapp.getPackages(true, function (enabledPackages) {
    doWalk.markReady(enabledPackages);
});

cachedTextTransformerModuleQueue.scheduleLast(haveProcessedEntries);

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

    // unlike for modules, 'include'/'exclude' for libapps is optional.
    if (libapp.include.length > 0 || libapp.exclude.length > 0) {
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
                    libx.prefs.getCategoryForUrl(module.id,
                        [{ name: "_enabled", type: "boolean", value: "true" }]);
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
        module.require.forEach(function (rUrl) {
            if (rUrl in requireAlias)
                rUrl = libx.utils.getBootstrapURL('scripts/' + requireAlias[rUrl]);

            if (rUrl in requireURL2Activity)
                return;

            var rAct = requireURL2Activity[rUrl] = {
                /* In FF, sbox.evaluate is not synchronous. We have seen executeAsync callbacks
                 * delivered, which would move forward our activity queue.  Place an additional
                 * blocker here.
                 */
                hasCompleted: new libx.utils.collections.EmptyActivity(),
                onready : function (scriptText, metadata) {
                    if (metadata == null) {
                        this.hasCompleted.markReady();
                        return;
                    }
                    if (/.*\.js$/.test(rUrl)) {
                        logDetail({
                            msg: "injecting required script: " + rUrl,
                            level: 1
                        });
                        logDetail({
                            msg: scriptText,
                            level: 2
                        });
                        sbox.evaluate(scriptText, rUrl);
                        logDetail({
                            msg: "required script injected: " + rUrl,
                            level: 1
                        });
                    } else
                    if (/.*\.css$/.test(rUrl)) {
                        var doc = window.document;
                        var heads = doc.getElementsByTagName('head');
                        var sheet = doc.createElement('style');
                        sheet.setAttribute('type', 'text/css');
                        sheet.innerHTML = scriptText;
                        logDetail({
                            msg: "injecting stylesheet: " + rUrl,
                            level: 1
                        });
                        heads[0].appendChild(sheet);
                    }
                    this.hasCompleted.markReady();
                }
            }

            requiredScripts.scheduleLast(rAct);
            requiredScripts.scheduleLast(rAct.hasCompleted);

            var success = false;
            libx.cache.defaultObjectCache.get({
                validator: libx.cache.validators.bootstrapped,
                url: rUrl,
                success: function (scriptText, metadata) {
                    success = true;
                    requireURL2Activity[rUrl].markReady(scriptText, metadata);
                },
                complete: function () {
                    if (!success)
                        requireURL2Activity[rUrl].markReady(null, null);
                }
            });
        });

        /* code to set up the sandbox by shallow-cloning libx and setting the 
         * correct libx.space property.  Assumes that libxDotLibappData was
         * initialized correctly prior to calling into the sandbox.
         * Repeated execution will clone the previous clone, which 
         * is fine (and almost autopoeitic.) 
         *
         * We also create a shallow copy of libx.libapp to capture the
         * getCurrentModule/getCurrentLibapp functions.
         */
        var setupSandbox = 
            "var libx = __libx.core.Class.mixin({ }, __libx, true); /* clone libx */\n"
          + "libx.space = libx.libappdata.space;\n"
          + "libx.libapp = __libx.core.Class.mixin({ }, libx.libapp, true);\n"
          + "libx.libapp.getCurrentModule = function () { return '" + module.id + "'; };\n"
          + "libx.libapp.getCurrentLibapp = function () { return '" + libapp.id + "'; };\n"
          + "libx.libapp.track = function (args) { "
          +     "libx.analytics.track({"
          +         "activity  : 'libapp',"
          +         "libapp    : args.libapp || libx.libapp.getCurrentLibapp(),"
          +         "module    : args.module || libx.libapp.getCurrentModule(),"
          +         "actiontype: args.actiontype || 'CLICK' "
          +     "});"
          + "};\n" ;
        
        var setupArgs = "";
        if (libappArgs) {
            for (var arg in libappArgs) {
                var value = libappArgs[arg].value;
                if (pkgArgs) {
                    for (var pkgArg in pkgArgs)
                        value = value.replace("{" + pkgArg + "}", pkgArgs[pkgArg].value);
                }
                setupArgs += "var " + arg + " = \"" + value + "\";\n";

                // allow libapp arguments in text transformers
                if (module.regexptexttransformer.length > 0) {
                
                    // escape any regular expression characters in the argument
                    value = value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                    
                    // replace the argument
                    var m = module.regexptexttransformer[0]
                        // convert the regex to a string to change the filter
                        .toString()
                        // replace any arguments given
                        .replace("${" + arg + "}", value)
                         // remove the surrounding slashes
                        .match(/^\/(.*)\/([^\/]*)$/)
                    
                    // convert the string back to a regex
                    module.regexptexttransformer[0] = new RegExp(m[1], m[2]);
                    
                }
            }
        }
          
        /* schedule string bundles */
        function loadStringBundle(url) {
            var bundle = libx.libappdata.stringBundles[url];
            if (bundle) return;
            else {
                var stringBundleActivity = new libx.utils.collections.EmptyActivity();

                requiredScripts.scheduleLast(stringBundleActivity);
                libx.locale.getBundle({
                    feed: url,
                    success: function (bundle) {
                        libx.libappdata.stringBundles[url] = bundle;
                        stringBundleActivity.markReady();
                    },
                    error: function () {
                        libx.log.write("error: could not load string bundle for " + url);
                        stringBundleActivity.markReady();
                    }
                });
            }
        }
        loadStringBundle(module.id);

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
        requiredScripts.scheduleLast(runModuleActivity);
        runModuleActivity.markReady();
        
        function runTextTransformerModule(module) {
            logDetail({
                msg: "adding RegexpTextTransformer module: "
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

/* Actions that require preferences and edition loaded */
function processPage() {
    debugLevel = libx.utils.browserprefs.getIntPref('libx.libapp.debuglevel', 0);
    logDetail({
        msg: "beginning page visit " + libx.edition.name.long +
            " time=" + new Date().getTime() +
            " debuglevel=" + debugLevel +
            " url=" + window.location.href,
        level: 1
    });

    libx.libapp.getOverridden(function (val) {
        overridden = val;
        haveOverridden.markReady();
    });

    cachedTextTransformerModuleQueue.markReady();
}

if (libx.edition) {
    processPage();
} else {
    libx.events.addListener("EditionConfigurationLoaded", {
        onEditionConfigurationLoaded: processPage
    });
}

}) ();  // end namespace encapsulation

