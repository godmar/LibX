
// implements abstract functions in core/global/shared/libx.js

libx.utils.xml.loadXMLDocumentFromString = function (xmlstring) {
    var parser = new DOMParser();
    return parser.parseFromString(xmlstring, "text/xml");
}

libx.utils.xml.convertXMLDocumentToString = function (xmlDoc) {
    var serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
}
