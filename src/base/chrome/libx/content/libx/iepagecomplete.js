// runs through all the doforurls once a new page is loaded (IE version)

//We copy libxEnv.doforurls into our own object here and set the necessary
//properties.
var doforurls = libxEnv.doforurls;

//Since libxEnv.doforurls has been initialized, we just copy the "private"
//members (the ones we need at least) and assign them to corresponding
//properties of our own object.  The reason we use a separate object here is
//that a number of properties of libxEnv.doforurls object aren't accessible
//outside that object

doforurls.dfu_actions = libxEnv.doforurls.getdfu_actions();
doforurls.sandboxScriptList = libxEnv.doforurls.getsandboxScriptList();
doforurls.dfu_log = libxEnv.doforurls.getdfu_log();

function onPageComplete_ie (doc, location) {
    if (!doc) return;

    if (location == 'about:blank')
        return;

    //We check the readyState of the document.  If it isn't complete, we attach
    //a function to the onreadystatechange event handler.
    if ("complete" == doc.readyState)
        ProcessDoForURLS(doc, location);
    else {
        doc.onreadystatechange= function () {
            if ("complete" == doc.readyState) {
                ProcessDoForURLS(doc, location)
            }
        }
    }
}

function ProcessDoForURLS(doc, location)
{
    for ( var l = 0; l < doforurls.sandboxScriptList.length; l++ ) {
        try {
            eval( doforurls.sandboxScriptList[l].text );
        } catch (e) {
            doforurls.dfu_log( "Sandbox Script Error: " + e.message );
        }
    }

outer:

    for (var i = 0; i < doforurls.dfu_actions.length; i++) {
        var dfu = doforurls.dfu_actions[i];
        var m = location.match(dfu.pattern);
        if (m) {
            var dfuFunc = dfu.actionText + "(doc, m);";

            if (dfu.pattern == "/.*/")
                continue;
            var exclude = dfu.exclude;
            if (exclude) {
                for (var j = 0; j < exclude.length; j++)
                    if (location.match(exclude[j]))
                        continue outer;
            }
            try {
                eval(dfuFunc);
            } catch (e) { 
                doforurls.dfu_log(e.message);
            }
        }
    }
}
