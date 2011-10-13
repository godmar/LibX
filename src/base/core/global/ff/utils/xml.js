
// implements abstract functions in core/global/shared/libx.js

libx.utils.xml.loadXMLDocumentFromString = function (xmlstring) {
    var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
             .createInstance(Components.interfaces.nsIDOMParser);
    var xml = parser.parseFromString(xmlstring, "text/xml");
    if (xml.documentElement.nodeName == "parsererror")
        throw new Error("Error parsing XML string");
    return xml;
}

libx.utils.xml.convertXMLDocumentToString = function (xmlDoc) {
    var serializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"]
            .createInstance(Components.interfaces.nsIDOMSerializer);
    return serializer.serializeToString(xmlDoc);
}
