libx.services.rfc = {
    getRFCURL: function (id) {
        return "http://tools.ietf.org/html/rfc" + id;
    },

    getRFCData: function (id, callback) {
        var params = {
            dataType    : "text",
            type        : "GET",
            url         : libx.services.rfc.getRFCURL(id),
            success     : function (responsetext) {
                var xmlResponse = libx.utils.xml.loadXMLDocumentFromString(responsetext);
                callback(xmlResponse.title);
            }
        }
        libx.cache.defaultMemoryCache.get(params);
    }
};
