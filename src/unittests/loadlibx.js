/*
 * Run unit tests in Rhino
 */

importClass(Packages.nu.xom.Builder);
importClass(Packages.nu.xom.XPathContext);

var libxbase = "../base/chrome/libx/content/libx/";
var libxscripts1 = [
    "libxcoreclass.js",
    "libx.js",
    "documentrequestcache.js",
];

function loadScript(libxscripts) {
    for (var i = 0; i < libxscripts.length; i++) {
        try {
            load(libxbase + libxscripts[i]);
        } catch (er) {
            println("Exception loading: " + libxscripts[i] + " " + er);
        }
    }
}
loadScript(libxscripts1);

var Lock = java.util.concurrent.locks.ReentrantLock;

libx.bd = { }
libx.bd.utils = {
    saxParserLock : new Lock(),
    loadXMLDocumentFromString : function (text) {
        try {
            this.saxParserLock.lock();
            saxparser = org.xml.sax.helpers.XMLReaderFactory.createXMLReader("org.apache.xerces.parsers.SAXParser");
            parser = new Builder(saxparser);
            doc = parser.build(new java.io.ByteArrayInputStream((new java.lang.String(text)).getBytes("UTF8")));
            return doc;
        } finally {
            this.saxParserLock.unlock();
        }
    }
}

// XMLHttpRequest
load("rhinoxhr.js");

// libx.cache.bd
libx.cache.bd = {
    getXMLHttpReqObj : function () {
        return new XMLHttpRequest();
    }
};

// libx.utils.browserprefs
var returnDefault = function (pref, defvalue) { return defvalue; }
libx.utils.browserprefs.getBoolPref = returnDefault;

// 
// a wrapper class that acts somewhat like the JavaScript DOMNodes
// we return from XPath queries
//
// XXX complete this implementation to fully implement DOM Level 2
// or, don't use nu.xom's XML nodes and XPath (?)
// see http://www.xom.nu/apidocs/nu/xom/converters/DOMConverter.html
//
var DOMFromXOM = new libx.core.Class.create({
    initialize : function(xomNode) {
        this.xomNode = xomNode;
        this.ownerDocument = xomNode.getDocument();
        this.nodeValue = String(xomNode.getValue());
    },
    getAttribute : function(attrName) {
        var attr = this.xomNode.getAttribute(attrName);
        return attr == null ? null : String(this.xomNode.getAttribute(attrName).getValue());
    }
    /* emulation is incomplete, iterating over children will not work */
});

libx.utils.xpath = {
    findSingleXML : function (doc, xpathexpr, root, namespaceresolver) {
        var nodes = this.findNodesXML(doc, xpathexpr, root, namespaceresolver);
        return nodes[0];
    },
    findNodesXML : function (doc, xpathexpr, root, namespaceresolver) {
        ctxt = new XPathContext();
        for (var prefix in namespaceresolver)
            ctxt.addNamespace(prefix, namespaceresolver[prefix]);

        if (root == null) root = doc.getRootElement();
        // if 'root' was a DOMFromXOM node, extract the XOM node
        // XXX
        if ('xomNode' in root)
            root = root.xomNode;

        var xomNodes = root.query(xpathexpr, ctxt);
        var xpathNodes = [ ];
        for (var i = 0; i < xomNodes.size(); i++)
            xpathNodes.push(new DOMFromXOM(xomNodes.get(i)));
        return xpathNodes;
    }
}

logger = {
    write : function (what) { print (what); }
};

var libxscripts2 = [
    "crossref.js",
    "pubmed.js",
    "xisbn.js",
];

loadScript(libxscripts2);

