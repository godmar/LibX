
/*
 * Load XML Document from String
 *
 * @param {String} xmlstring
 * @return {DOMDocument} parsed document
 */
libx.utils.xml.loadXMLDocumentFromString = function (xmlstring) {
    var parser = new DOMParser();
    return parser.parseFromString(xmlstring, "text/xml");
}

/*
 * Convert XML Document to String
 *
 * @param {DOMDocument} XML document
 * @return {String} string representation of document
 */
libx.utils.xml.convertXMLDocumentToString = function (xmlDoc) {
    var serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
}
