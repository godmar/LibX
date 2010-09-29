  
function loadLibapps() {

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

function log(msg) {
    libx.log.write("(" + window.location.href + "):\n" + msg, "libapp");
}

function logDetail(msg) {
    libx.log.write("(" + window.location.href + "):\n" + msg, "libappdetail");
}

log ("beginning page visit " + libx.edition.name.long + " #libapps=" + libx.libapp.loadedLibapps.length + " time=" + new Date().getTime());

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
var moduleQueue = new libx.utils.collections.ActivityQueue();

/* map require url to activity */
var requireURL2Activity = { };

var textExplorer = new libx.libapp.TextExplorer();

for (var i = 0; i < libx.libapp.loadedLibapps.length; i++) {
    executeLibapp(libx.libapp.loadedLibapps[i]);
}

var traverseTextActivity = {
    onready: function () {
        // at this point, all libapps and modules that were in the cache (and
        // whose dependencies were in the cache) have been loaded, synchronously.
        log("#textTransformers: " + textExplorer.textTransformerList.length);
        textExplorer.traverse(window.document.documentElement);
    }
};
moduleQueue.scheduleLast(traverseTextActivity);
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

function executeLibapp(libapp) {
    // alert("executing: " + libx.utils.json.stringify(libapp));
    prepLibappOrModule(libapp);

    // unlike for modules, 'include' for libapps is optional.
    if (libapp.include.length > 0) {
        var executeLibapp = checkIncludesExcludes(libapp, window.location.href);
        if (executeLibapp == null) {
            logDetail(libapp.description + " not executed because it did not meet include/exclude: include=" + libapp.include + " exclude=" + libapp.exclude);
            return;
        }
    }

    log("include/exclude check complete, executing libapp: " + libapp.description);
    var libappSpace = new libx.libapp.TupleSpace();
    libappSpace.description = libapp.description;

    for (var i = 0; i < libapp.entries.length; i++) {
    
        // activity to delay the text transformers.  if the module is in the
        // cache, the module is added to the list of transformers if it is a
        // text transformer module.  if it is not in the cache, the
        // transformation will not occur until the page is reloaded.
        var moduleFinishedActivity = new libx.utils.collections.EmptyActivity();
        moduleQueue.scheduleLast(moduleFinishedActivity);
        
        (function (activity) {
            new libx.libapp.PackageWalker(libapp.entries[i].url).walk({
                onmodule: function (module) {
                    if (module.regexptexttransformer.length == 0)
                        activity.markReady();
                    executeModule(module, activity);
                }
            }, activity);
        }) (moduleFinishedActivity);
    }

    function executeModule(module, moduleFinishedActivity) {

        prepLibappOrModule(module);
        var executeModule = checkIncludesExcludes(module, window.location.href);
        if (executeModule == null) {
            moduleFinishedActivity.markReady();
            return;
        }

        log("include/exclude check complete, executing module: " + module.description 
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
                    if (metadata == null)
                        return;
                    if (/.*\.js$/.test(metadata.originURL)) {
                        log("injecting required script: " + metadata.originURL);
                        eval(scriptText);
                    } else
                    if (/.*\.css$/.test(metadata.originURL)) {
                        var doc = window.document;
                        var heads = doc.getElementsByTagName('head');
                        var sheet = doc.createElement('style');
                        sheet.setAttribute('type', 'text/css');
                        sheet.innerText = scriptText;
                        log("injecting stylesheet: " + metadata.originURL);
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
                    moduleFinishedActivity.markReady();
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
                libx.libappdata.textNode = textNode;
                libx.libappdata.match = match;
                libx.libappdata.space = libappSpace;
                
                var jsCode = "(function (__libx) {\n"
                    + setupSandbox
                    + "  var textNode = libx.libappdata.textNode;\n"
                    + "  var match = libx.libappdata.match;\n"
                    +       module.body
                    + "}) (libx);\n";
            
                logDetail("found regular expression match for module '" + module.description + "': " + match[0] + " now evaling:\n" + jsCode);
                return eval(jsCode);
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
            logDetail("Running module '" + module.description + "': \n" + jsCode + "\nusing space: " + libappSpace.description);
            eval(jsCode);
        }
    }
}

}

if (typeof localStorage == "object") {
    // prevent bug in Google Chrome where content script may be included twice
    // run libapps on a given page at most once per second
    var now_ms = Number(new Date());
    var last = Number(localStorage.getItem("libx.lastrun"));
    if (last + 1000 < now_ms) {
        localStorage.setItem("libx.lastrun", now_ms);
        loadLibapps();
    } else {
        var d = Number(localStorage.getItem("libx.doubleinjections"));
        localStorage.setItem("libx.doubleinjections", d + 1);
    }
} else {
    loadLibapps();
}
