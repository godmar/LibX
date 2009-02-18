/**
 * @namespace
 * Support for Serials Solutions Link 360 Service
 * as described at <a href="http://journal.code4lib.org/articles/108">http://journal.code4lib.org/articles/108</a>
 */
libx.services.link360 = {
    /**
     * See if the current configuration contains a Serials Solutions
     * OpenURL resolver that provides Link360 services
     *
     * @param {Object} an edition configuration, such as libx.edition
     * @return {Link360|null} new Link360 service object
     */
    getLink360 : function (edition) {
        for (var i = 0; i < edition.openurl.length; i++) {
            var resolver = edition.openurl[i];
            var ssidMatch = /http:\/\/(.*)\.search\.serialssolutions\.com/.exec(resolver.url);
            if (ssidMatch != null)
                return new libx.services.link360.Link360(ssidMatch[1]);
        }
        return null;
    }
};

libx.services.link360.Link360 = libx.core.Class.create(
    /** @lends libx.services.link360.Link360.prototype */{
    /**
     * A Link360 service object
     * @param {String} ssid - Serials Solutions Client ID
     * @constructs
     */
    initialize : function (ssid) {
        this.baseURL = "http://" + ssid + ".openurl.xml.serialssolutions.com/openurlxml";
        this.ssNamespaceResolver = { 'ssopenurl' : 'http://xml.serialssolutions.com/ns/openurl/v1.0' };
    },
    /**
     * @param {Object} options
     * @param {String} options.query - OpenURL query (as URL fragment)
     * @param {String} options.type - type: e.g., 'journal', 'article' - optional
     * @param {Function} options.notFound
     * @param {Function} options.hasFullText
     * @param {Function} options.foundNoFullText
     */
    getMetadata : function (options) {
        var self = this;
        libx.cache.defaultMemoryCache.get({
            url: this.baseURL + "?version=1.0&" + options.query,
            dataType: "xml",
            success: function (xmlResponse, status, xhr) {

                var linkgroupquery = "//ssopenurl:result[1]//ssopenurl:linkGroup[@type = 'holding']";

                var linkgroup1 = libx.utils.xpath.findSingleXML(xmlResponse, linkgroupquery, 
                                            xmlResponse, self.ssNamespaceResolver);
                if (linkgroup1 == null) {
                    options.notFound(xmlResponse);
                } else {
                    var typeConstraint = options.type ? "[@type = '" + options.type + "']" : "";
                    var fulltexturl = libx.utils.xpath.findSingleXML(xmlResponse, 
                        "./ssopenurl:url" + typeConstraint + "/text()", 
                        linkgroup1, self.ssNamespaceResolver);

                    if (fulltexturl) {
                        var databaseName = libx.utils.xpath.findSingleXML(xmlResponse, 
                            "./ssopenurl:holdingData/ssopenurl:databaseName/text()", 
                            linkgroup1, self.ssNamespaceResolver);
                        var dbName = databaseName != null ? databaseName.data : "";

                        options.hasFullText(xmlResponse, fulltexturl.data, dbName);
                    } else {
                        options.foundNoFullText(xmlResponse);
                    }
                }
            }
        });
    }
});
