
/*
 * Load XML Document from String
 *
 * @param {String} xmlstring
 * @return {DOMDocument} parsed document
 */
libx.utils.xml.loadXMLDocumentFromString = function (xmlstring) {
    var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
             .createInstance(Components.interfaces.nsIDOMParser);
    var xml = parser.parseFromString(xmlstring, "text/xml");
    if (xml.documentElement.nodeName == "parsererror")
        throw new Error("Error parsing XML string");
    return xml;
}

/*
 * Convert XML Document to String
 *
 * @param {DOMDocument} XML document
 * @return {String} string representation of documen
 */
libx.utils.xml.convertXMLDocumentToString = function (xmlDoc) {
    var serializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"]
            .createInstance(Components.interfaces.nsIDOMSerializer);
    return serializer.serializeToString(xmlDoc);
}
