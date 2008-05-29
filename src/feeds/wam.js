// fix up the WAM page that says "The address you are trying to access is invalid."
if (libxProxy != null && libxProxy.type == "wam") {
    // this matches on a WAM DNS'ed URL
    var rexp = new RegExp("\\d+\\-(.*)\\." + libxProxy.url.replace(/\./g, "\\."));
    new libxEnv.doforurls.DoForURL(rexp, function(doc, m) {
        var err = libxEnv.xpath.findSingle(doc, "//*[contains(text(),'The address you are trying to access is invalid')]");
        if (err) {
            var blink = doc.createElement("a");
            blink.setAttribute('href', "javascript:history.back()");
            var p = doc.createElement("p");
            p.appendChild(doc.createTextNode(
                    "LibX cannot reload " + m[1] + " through WAM. " +
                    "Contact your library administrator for details, " +
                    "who may be able to add this URL to the WAM configuration. " +
                    "Click to return to the previous page"));
            blink.appendChild(p);
            err.appendChild(blink);
            // TODO: add the option to set a mailto: link here.
        }
    });
}
