/*
 * Run unit tests in Rhino
 */

// see http://java.sun.com/javase/6/docs/technotes/guides/scripting/programmer_guide/index.html#jsimport
importPackage(org.w3c.dom);
importPackage(java.io);
importPackage(javax.xml.xpath);
importPackage(javax.xml.parsers);
importPackage(javax.xml.namespace);
importClass(java.util.TimerTask);
importClass(org.xml.sax.SAXException);
load("env.rhino.js");

function println(msg) {
    java.lang.System.out.println(msg);
}
function print(msg) {
    java.lang.System.out.print(msg);
}

var libxbase = "../base/core/";
var libxscripts1 = [
    "global/shared/core.js",
    "global/shared/libx.js",
    "global/shared/cache/memorycache.js",
    "global/shared/cache/validators.js",
    "global/shared/config.js",
    "global/shared/config/xmlconfigwrapper.js",
    "global/shared/config/editionconfigurationreader.js",
    "global/shared/events.js",
    "global/shared/utils/json.js",
    "global/shared/catalog.js",
    "global/shared/catalog/catalog.js",
    "global/shared/catalog/factory/bookmarklet.js",
    "global/shared/catalog/factory/scholar.js",
	"global/shared/catalog/factory/millenium.js",
	"global/shared/catalog/factory/horizon.js",
	"global/shared/catalog/factory/voyager.js",
	"global/shared/catalog/factory/aleph.js",
	"global/shared/catalog/factory/sirsi.js",
	"global/shared/catalog/factory/web2.js",
	"global/shared/catalog/factory/centralsearch.js",
	"global/shared/catalog/factory/custom.js",
	"global/shared/catalog/factory/evergreen.js",
	"global/shared/catalog/factory/worldcat.js",
	"global/shared/catalog/factory/vubis.js",
	"global/shared/catalog/factory/voyager7.js",
	"global/shared/catalog/factory/talisprism.js",
	"global/shared/catalog/factory/openurlresolver.js",
    "global/shared/citeulike.js",
	"global/shared/proxy.js",
	"global/shared/openurl.js",
	"global/shared/utils/stdnumsupport.js",
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

libx.core.Class.mixin(libx.utils.xml, {
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
        } catch (e) {
            return null;
        } finally {
            this.saxParserLock.unlock();
        }
    }
}, true);

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

libx.utils.timer = {
    setTimeout: setTimeout,
    setInterval: setInterval
};

/*
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
*/

/**
 * Emulate HTML5 localStorage.
 * http://dev.w3.org/html5/webstorage/#the-storage-interface
 */
localStorage = new Array();
localStorage.byKey = { };
localStorage.key = function (index) {
    return this[index] == undefined ? null : this[index].key;
}

localStorage.getItem = function (key) {
    var rc = this.byKey[key] != undefined ? this.byKey[key].data : null;
    return rc;
}

localStorage.setItem = function (key, data) {
    if (this.byKey[key] == undefined) {
        var entry = { key : key, index: this.length };
        this.push(entry);
        this.byKey[key] = entry;
    }

    this.byKey[key].data = data;
}

localStorage.removeItem = function (key) {
    var entry = this.byKey[key];
    if (entry != undefined) {
        this.splice(entry.index, 1);
        delete this.byKey[key];
    }
}

localStorage.clear = function () {
    this.splice(0, this.length);
    this.byKey = { };
}

localStorage.dump = function () {
    for (var i = 0; i < this.length; i++) {
        var entry = this[i];
        println(i + ": key=" + entry.key + " size=" 
            + entry.data.length + " data=" + entry.data.substring(0, 80));
    }
}

/**
 * Implement LibX storage using localStorage.
 */
libx.storage = {
    Store: libx.core.Class.create({
        
        initialize: function(prefix) {
            this.prefix = prefix + '.';
        },
        
        setItem: function(paramObj) {
            localStorage.setItem(this.prefix + paramObj.key, paramObj.value);
            paramObj.success && paramObj.success();
        },
        
        getItem: function(paramObj) {
            var value = localStorage.getItem(this.prefix + paramObj.key);
            if (value == null)
                paramObj.notfound && paramObj.notfound();
            else
                paramObj.success && paramObj.success(value);
        },
        
        find: function(paramObj) {
            var matches = [];
            var pattern = paramObj.pattern;
            if (!pattern)
                pattern = /.*/;
            for (var i in localStorage) {
                if (i.indexOf(this.prefix) == 0) {
                    var itemName = i.substr(this.prefix.length);
                    if (pattern.test(itemName))
                        matches.push(itemName);
                }
            }
            paramObj.success && paramObj.success(matches);
        },
        
        removeItem: function(paramObj) {
            var value = null;
            localStorage.removeItem(this.prefix + paramObj.key);
            paramObj.success && paramObj.success();
        },

        clear: function(paramObj) {
            for (var i in localStorage)
                if (i.indexOf(this.prefix) == 0)
                    localStorage.removeItem(i);
            paramObj && paramObj.success && paramObj.success();
        }
    })
    
};

libx.storage.metacacheStore = new libx.storage.Store('metacache');
libx.storage.cacheStore = new libx.storage.Store('cache');
libx.storage.prefsStore = new libx.storage.Store('prefs');

function exec(cmd) {
    var process = java.lang.Runtime.getRuntime().exec(cmd);
    var inp = new DataInputStream(process.getInputStream());
    var line = null;
    while ((line = inp.readLine()) != null) {
        println(line);
    }
    process.waitFor();
    $exit = process.exitValue();
}

libx.log = {
    write : function (msg) {
        println(msg);
    },
};

libx.locale = {
    initialize: function () {}
};


libx.testsetup = {
    /**
     * Enter a local URL where this directory can be accessed via HTTP.  This
     * exact directory must be served (for instance, by using a symbolic link
     * to this directory) so that the unit tests can modify the files.
     */
    baseUrl : "http://theta.cs.vt.edu/~gback/libx2/src/unittests/",
}

var testConn = new java.net.URL(libx.testsetup.baseUrl + "loadlibx.js").openConnection();
testConn.connect();
if (testConn.responseCode != "200") {
    println("\n\nSetup Error: I expected to access loadlibx.js at " + testConn.getURL());
    println("But couldn't.  Please adjust libx.testsetup.baseUrl. ");
    java.lang.System.exit(1);
}


libx.utils.getBootstrapURL = function (path) {
    return libx.testsetup.baseUrl + "tests/resources/" + path;
};

var libxscripts2 = [
    "global/gc/utils/hash.js",
    "global/shared/cache/objectcache.js",
    "global/shared/cache/scheduler.js",
    "../bootstrapped/global/shared/services/crossref.js",
    "../bootstrapped/global/shared/services/pubmed.js",
    "global/shared/utils/stdnumsupport.js",
    "global/shared/preferences.js",
    // "window/shared/ui/magicsearch.js",
	"global/shared/libapp.js",
];

loadScript(libxscripts2);

libx.initialize();
