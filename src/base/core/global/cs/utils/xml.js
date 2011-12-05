
// implements abstract functions in core/global/shared/libx.js
/*
 * Client-Side Implementation of xml .js
*/
libx.utils.xml.loadXMLDocumentFromString = function (xmlstring) {
     var xml, parser;
     try {  /*IE doesnt support window.DOMParser*/ 
         if ( libx.cs.browser.safari || libx.cs.browser.opera || libx.cs.browser.chrome || libx.cs.browser.mozilla ) { // Standard
             parser = new DOMParser();
             xml = parser.parseFromString( xmlstring , "text/xml" );
         }else if ( libx.cs.browser.msie ){ // IE
             xml = new ActiveXObject( "Msxml2.DOMDocument.3.0" );
             xml.setProperty("SelectionLanguage","XPath");
             xml.async = "false";
             xml.loadXML( xmlstring );
         }else {
             libx.log.write("Error - Unknown Browser! Check for appropriate feature support for libx.utils.xml.loadXMLDocumentFromString");
             xml = undefined;
         }
    } catch( e ) {
         xml = undefined;
    }

    if ( !xml ) {
         libx.log.write( "Invalid XML [reason:] xml is "+ xml + " \n[xmlstring]:\n" + xmlstring );
    }else if (  !xml.documentElement ||  xml.getElementsByTagName( "parsererror" ).length) {
        var errObj = xml.getElementsByTagName( "parsererror" ).context.parseError;
        libx.log.write("Invalid XML [reason]: \n" + errObj.reason + "\n[srcText]: \n" +errObj.srcText + "\n[url]: \n" + errObj.url + "\n[xmlstring]: \n" + xmlstring);
    }
    return xml;
}

libx.utils.xml.convertXMLDocumentToString = function (xmlDoc) {
    var xmlstring, serializer;
    try {
        if( libx.cs.browser.safari || libx.cs.browser.opera || libx.cs.browser.chrome || libx.cs.browser.mozilla ) { // standard
            serializer = new XMLSerializer();
            xmlstring = serializer.serializeToString(xmlDoc);
        }else if (libx.cs.browser.msie) { //IE
            xmlstring = xmlDoc.xml;
        }else {
            libx.log.write("Error - Unknown Browser! Check for appropriate feature support for libx.utils.xml.convertXMLDocumentToString");
            xmlstring = undefined;
        }
    } catch( e ) {
       xmlstring = undefined;
    }
   
    if(!xmlstring)
       libx.log.write("Error converting xml to string");

    return xmlstring;
}
