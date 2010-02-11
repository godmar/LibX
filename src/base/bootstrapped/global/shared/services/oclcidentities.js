/**
 * @namespace
 * Support for OCLC Identities Service
 */
libx.services.oclcidentities = { };

/**
 * Find most widely held work by Author.
 *
 * @param {Object} options
 * @param {String} options.name - Name to be looked up
 * @param {String} options.restrict - XPath restriction for /nameAuthorities/match[...]
 * @param {Function} options.notFound
 * @param {Function} options.ifFound
 */
libx.services.oclcidentities.findMostWidelyHeldWork = function (options) {
    libx.cache.defaultMemoryCache.get({
        url : "http://orlabs.oclc.org/Identities/find?fullName=" + encodeURIComponent(options.name),
        dataType: "xml",
        success : function (xmlResponse, status, xhr) {
            var nameAuthorities = libx.utils.xpath.findNodesXML(xmlResponse, 
                "/nameAuthorities/match[" + options.restrict + "]");
            if (nameAuthorities.length == 0) {
                if (options.notFound)
                    options.notFound();
                return;
            }

            // find most widely held work
            var maxUsage = 0;
            for (var i = 0; i < nameAuthorities.length; i++) {
                var m = nameAuthorities[i];
                var us = Number(m.getAttribute("usage"));
                if (us > maxUsage) {
                    maxUsage = us;
                    var bestHit = m;
                }
            }
            var result = { };

            var est = libx.utils.xpath.findSingleXML(xmlResponse, "./establishedForm/text()", bestHit);
            if (est != null)
                result.establishedForm = est.nodeValue;

            var uri = libx.utils.xpath.findSingleXML(xmlResponse, "./uri/text()", bestHit);
            if (uri != null)
                result.url = "http://orlabs.oclc.org" + uri.nodeValue;

            var citation = libx.utils.xpath.findSingleXML(xmlResponse, "./citation/text()", bestHit);
            if (citation != null)
                result.citation = citation.nodeValue;

            var genre = libx.utils.xpath.findSingleXML(xmlResponse, "./genre/text()", bestHit);
            if (genre != null)
                result.genre = genre.nodeValue; 

            options.ifFound(result);
        }
    });
}
