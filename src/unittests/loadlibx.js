/*
 * Run unit tests in Rhino
 */

// see http://java.sun.com/javase/6/docs/technotes/guides/scripting/programmer_guide/index.html#jsimport
importPackage(org.w3c.dom);
importPackage(javax.xml.xpath);
importPackage(javax.xml.parsers);
importPackage(javax.xml.namespace);
importClass(java.util.TimerTask);
importClass(org.xml.sax.SAXException);

var libxbase = "../base/chrome/libx/content/libx/";
var libxscripts1 = [
    "libxcoreclass.js",
    "libx.js",
    "documentrequestcache.js",
    "config.js",
    "events.js",
    "json2.js",
    "catalogs/catalog.js",
	"catalogs/milleniumopac.js",
	"catalogs/horizonopac.js",
	"catalogs/voyageropac.js",
	"catalogs/alephopac.js",
	"catalogs/sirsiopac.js",
	"catalogs/web2opac.js",
	"catalogs/centralsearch.js",
	"catalogs/custom.js",
	"catalogs/evergreen.js",
	"catalogs/worldcat.js",
	"catalogs/vubis.js",
	"catalogs/voyager7.js",
	"catalogs/talisprism.js",
	"catalogs/openURLCatalog.js",
    "citeulike-checkurl.js",
	"proxy.js",
	"openurl.js",
	"isbnutils.js",
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

libx.utils.xml = {
    saxParserLock : new Lock(),
    loadXMLDocumentFromString : function (input) {
        try {
            this.saxParserLock.lock();

            // println("parsing: " + input);
            input = new java.io.ByteArrayInputStream((new java.lang.String(input)).getBytes("UTF8"));

            /*DocumentBuilderFactory*/var domFactory = DocumentBuilderFactory.newInstance();
            domFactory.setNamespaceAware(true);
            /*DocumentBuilder*/var builder = domFactory.newDocumentBuilder();
            /*Document*/var doc = builder.parse(input);
            return doc;
        } finally {
            this.saxParserLock.unlock();
        }
    }
};

// XMLHttpRequest
load("rhinoxhr.js");
// XXX: look at env.js


// libx.cache.bd
libx.cache.bd = {
    getXMLHttpReqObj : function () {
        return new XMLHttpRequest();
    }
};

// libx.utils.browserprefs
var returnDefault = function (pref, defvalue) { return defvalue; }
libx.utils.browserprefs.getBoolPref = returnDefault;
libx.utils.browserprefs.getIntPref = returnDefault;

libx.utils.xpath = {
    findSingleXML : function (doc, xpathexpr, root, namespaceresolver) {
        var nodes = this.findNodesXML(doc, xpathexpr, root, namespaceresolver);
        if (nodes == null)
            return null;

        switch (nodes[0].nodeType) {
        /* 'nodeValue' is function that returns a java.lang.String object, not a JavaScript string
         * this causes ambiguities when 'replace' is called, like so:

            sun.org.mozilla.javascript.internal.EvaluatorException: 
                The choice of Java constructor replace matching JavaScript argument types (function,string) 
                is ambiguous; candidate constructors are: 
                    class java.lang.String replace(char,char)
                    class java.lang.String replace(java.lang.CharSequence,java.lang.CharSequence)

            to work around this, we could return a dummy node whose nodeValue is a JavaScript string, 
            rather than a java.lang.String; 

            The problem with this is that such a node cannot be used as a text node.

            Instead, we require that the client perform a cast to a JavaScript string 
            via the String( ) operator.

        case Node.TEXT_NODE:
            return { nodeValue: String(nodes[0].nodeValue),
                     nodeType: Node.TEXT_NODE
                   };
        */
        default:
            return nodes[0];
        }
    },
    findNodesXML : function (doc, xpathexpr, root, namespaceresolver) {
        try {
            /*XPathFactory*/var factory = XPathFactory.newInstance();
            /*XPath*/ var xpath = factory.newXPath();
            xpath.setNamespaceContext(NamespaceContext({
                getNamespaceURI : function (prefix) {
                    return prefix in namespaceresolver ? namespaceresolver[prefix] : javax.xml.XMLConstants.NULL_NS_URI;
                }
            }));
            /*XPathExpression*/ var expr = xpath.compile(xpathexpr);
            /*NodeList*/var nodes = expr.evaluate(root || doc, XPathConstants.NODESET);
        } catch (er) {
            println("Error in xpath: " + er.javaException);
            if ('getUndeclaredThrowable' in er.javaException) 
                println(er.javaException.getUndeclaredThrowable());

            throw er;
        }

        if (nodes.getLength() == 0)
            return null;

        var r = new Array();
        for (var i = 0; i < nodes.getLength(); i++) {
            r.push(nodes.item(i)); 
        }
        return r;
    }
}

libx.ui = { }

importPackage(org.libx.utils);
libx.utils.hash = {
    hashString: function (input) {
        var sha1 = new SHA1();
        input = new java.lang.String(input).getBytes("UTF8");
        sha1.engineUpdate(input, 0, input.length);
        var dig = sha1.engineDigest();
        var r = "";
        for (var i = 0; i < dig.length; i++) {
            r += java.lang.String.format("%02X", [ new java.lang.Byte(dig[i]) ]);
        }
        return r;
    }
}

libx.io = { }
var iodir = "libx";
function getPath(fname, createDirs) {
    var f = new File(fname);
    if (f.isAbsolute())
        throw "Absolute path " + fname + " not allowed";

    var path = new File(iodir + File.separator + f.getParentFile());
    if (createDirs)
        path.mkdirs();
    return new File(path, f.getName());
}

libx.io.fileExists = function (fname) {
    return getPath(fname, false).exists();
}

libx.io.writeToFile = function (fname, data, create, append) {
    // println("writeToFile: fname=" + fname + " create=" + create + " append=" + append + " data.length=" + data.length);
    if (append)
        throw "Append not supported";

    var file = getPath(fname, true);
    try {
        var out = new java.io.FileOutputStream(file);
        for (var i = 0; i < data.length; i++) {
            out.write(data.charCodeAt(i));
        }
    } finally {
        out.close();
    }
}

libx.io.getFileText = function (fname) {
    // println("getFileText: path=" + fname);
    var file = getPath(fname, false);
    try {
        var stream = new java.io.FileInputStream(file);
        var c;
        var sb = new java.lang.StringBuilder();
        while ((c = stream.read()) != -1)
            sb.append(new java.lang.Character(c));

        return String(sb.toString());
    } finally {
        stream.close();
    }
    return "could not read data";
}
var javaTimer = java.util.Timer("libx-timer", true);
libx.utils.timer = {
    setTimeout: function (func, timeout) {
        // TimerTaskAdapter is needed since we cannot implement abstract base classes
        // such as java.util.TimerTask, see 
        // http://blogs.sun.com/sundararajan/entry/implementing_java_interfaces_in_javascript
        javaTimer.schedule(new org.libx.utils.TimerTaskAdapter(java.lang.Runnable({
            run: function () {
                func();
            }
        })), timeout);
    },
    setInterval: function (func, timeout) {
        javaTimer.schedule(new org.libx.utils.TimerTaskAdapter(java.lang.Runnable({
            run: function () {
                func();
            }
        })), timeout, timeout);
    }
};
libx.log = {
    write : function (msg) { println (msg); },
};
var libxscripts2 = [
    "objectcache.js",
    "crossref.js",
    "pubmed.js",
    "xisbn.js",
    "magicsearch.js",
    "testing.js"
];

loadScript(libxscripts2);
