
var autolink = libxEnv.doforurls.autolink = new libxEnv.doforurls.DoForURL(/.*/, function (doc) {
    // to work around https://bugzilla.mozilla.org/show_bug.cgi?id=315997
    // we skip autolink if the page contains any textarea element.
    // (though the bug purportedly only affects large textarea elements.)
    var n = libxEnv.xpath.findNodes(doc, "//textarea");
    if (n.length > 0)
        return;

    if (libxEnv.options.autolink_active)
        libxRunAutoLink(doc, false); // false -> not right away
});

/* Add Serials Solution page to list of sites where we don't autolink */
if (libxEnv.openUrlResolver && libxEnv.openUrlResolver.type == "sersol") {
    autolink.exclude = [libxEnv.openUrlResolver.url.replace("http://", "")];
}
