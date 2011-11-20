
// implements abstract functions in core/global/shared/libx.js

libx.utils.xml.loadXMLDocumentFromString = function (xmlstring) {
     var xml, parser;
     try {
         if ( window.DOMParser ) { // Standard
             parser = new DOMParser();
             xml = parser.parseFromString( xmlstring , "text/xml" );
         } else { // IE
             xml = new ActiveXObject( "Microsoft.XMLDOM" );
             xml.async = "false";
             xml.loadXML( xmlstring );
         }
    } catch( e ) {
         xml = undefined;
    }

    if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
         libx.log.write( "Invalid XML ==>\n" + xmlstring );
    }
    return xml;
}

libx.utils.xml.convertXMLDocumentToString = function (xmlDoc) {
    var xmlstring, serializer;
    try {
        if( window.XMLSerializer ) { // standard
            serializer = new XMLSerializer();
            xmlstring = serializer.serializeToString(xmlDoc);
        }else { //IE
           xmlstring = xmlDoc.xml;
        }
    } catch( e ) {
       xmlstring = undefined;
    }
   
    if(!xmlstring)
       libx.log.write("Error converting xml to string");

    return xmlstring;
}
