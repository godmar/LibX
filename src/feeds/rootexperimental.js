/*
 * Experimental root feed stuff.
 *
 * Configured in edition 
 * http://libx.org/editions/libxtestedition.php?edition=E90A289F.3
 */

var cueUrl = "cues/";
var sandboxUrl = "sandboxScripts/";

/* 
 * This code disables autolinking for result pages for the primary catalog.
 *
 * Currently, all cues are executed after all root feeds (unless during updates, in which case 
 * the order is unpredictable).  This means that 'autolink.js' cue has not executed when this
 * script executes, hence the timeout below to defer this processing in the near future.)
 *
 * I'd like to be able to write this code without the timeout.
 */
setTimeout(function () {
    var dfu_actions = libxEnv.doforurls.getdfu_actions();
    for (var i = 0; i < dfu_actions.length; i++) {
        if (dfu_actions[i].description == "autolink") {
            dfu_actions[i].exclude.push(libx.edition.catalogs.default.url.replace("http://", ""));
        }
    }
}, 1000);

// work-around for non-deterministic cue file execution order
if (undefined == libxEnv.autolink)
    libxEnv.autolink =  { textTransformers: [ ] };

var autolink = libxEnv.autolink;

autolink.textTransformers.push(new autolink.textTransformerClass({
    // new autolink.regExpFilterClass(/(^|\s+)([A-Z][a-z]+)\s+([A-Z][a-z]+)(\s+|$)/g),
    filter: new autolink.regExpFilterClass(/Google/g),
    processor: {
        processFunction: function (match) {
            var span = this.currentDoc.createElement("span");
            span.style.color = "red";
            span.style.fontWeight = "bold";
            var spanText = this.currentDoc.createTextNode(match[0]);
            span.appendChild(spanText);
            return span;
        }
    }
}));

autolink.textTransformers.push(new autolink.textTransformerClass({
    filter: new autolink.regExpFilterClass(/(^|\s)LibX(\s|$)/ig),
    processor: {
        processFunction: function (match) {
            return this.currentDoc.createTextNode(match[0].replace(/LibX/i, "LibX (it rocks!)"));
        }
    }
}));

var sarahTransform = new autolink.textTransformerClass({
    filter: new autolink.regExpFilterClass(/(^|\s)Sarah Palin(\s|$)/ig),
    processor: {
        processFunction: function (match) {
            return this.currentDoc.createTextNode(match[0].replace(/Palin/i, "Barracuda"));
        }
    },
    skippedElementList:
    { 
       noscript: true,
       head:     true,
       script:   true,
       style:    true,
       textarea: true,
       label:    true,
       select:   true,
       button:   true
    }
});
autolink.textTransformers.push(sarahTransform);

libxEnv.coins.handlers.push(function (doc, span, query)
{
    // see http://journal.code4lib.org/articles/108
    var m = /http:\/\/(.*)\.search\.serialssolutions\.com/.exec(libxEnv.openUrlResolver.url);
    if (m == null)
        return;

    // http://CLIENT IDENTIFIER.openurl.xml.serialssolutions.com/openurlxml
    var link360url = "http://" + m[1] + ".openurl.xml.serialssolutions.com/openurlxml";
    link360url += "?version=1.0&" + query;
    libxEnv.getXMLDocument(link360url, function (xmlhttp) {
        var xmlResponse = xmlhttp.responseXML;
        if (xmlResponse == null) {
            libxEnv.writeLog("failure: " + xmlhttp.status);
            return;
        }
        var nsresolver = { 'ssopenurl' : 'http://xml.serialssolutions.com/ns/openurl/v1.0' };
        var linkgroupquery = "//ssopenurl:result[1]//ssopenurl:linkGroup[@type = 'holding']";

        var linkgroup1 = libxEnv.xpath.findSingleXML(xmlResponse, linkgroupquery, xmlResponse, nsresolver);
        if (linkgroup1) {
            var db = libxEnv.xpath.findSingleXML(xmlResponse, 
                "./ssopenurl:holdingData/ssopenurl:databaseName/text()", 
                linkgroup1, nsresolver);

            var fulltexturl = libxEnv.xpath.findSingleXML(xmlResponse, 
                "./ssopenurl:url[@type = 'article']/text()", 
                linkgroup1, nsresolver);

            if (fulltexturl) {
                var a = doc.createElement("a");
                a.setAttribute("href", fulltexturl.nodeValue);
                var label = "(Fulltext";
                if (db) {
                    label += " via " + db.nodeValue;
                }
                label += ")";
                a.appendChild(doc.createTextNode(label));
                span.appendChild(a);
            }
        }
    });

/*
    var a = doc.createElement("a");
    a.setAttribute("href", link360url + query);
    a.setAttribute("title", link360url + query);
    a.appendChild(doc.createTextNode(link360url + query));
    span.appendChild(a);
*/
});

if (libxEnv.getBoolPref ('libx.bleedingedge', false)) {
    addCue( cueUrl + "toggleAmazon.js" );
    addCue( cueUrl + "toggleGoogle.js" );
}
