function publish(symbolSet) {
	publish.conf = {  // trailing slash expected for dirs
		ext: ".html",
		outDir: JSDOC.opt.d || SYS.pwd+"../out/jsdoc/",
		templatesDir: SYS.pwd+"../templates/jsdoc/",
		symbolsDir: "symbols/",
		srcDir: "symbols/src/",
		urlprefix: JSDOC.opt.chrome || ""
	};
	
	
	if (JSDOC.opt.s && defined(Link) && Link.prototype._makeSrcLink) {
		Link.prototype._makeSrcLink = function(srcFilePath) {
			return "&lt;"+srcFilePath+"&gt;";
		}
	}
	
	IO.mkPath((publish.conf.outDir+"symbols/src").split("/"));
		
	// used to check the details of things being linked to
	Link.symbolSet = symbolSet;

	try {
		var classTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"class.tmpl");
		
	}
	catch(e) {
		print(e.message);
		quit();
	}
	
	// filters
	function hasNoParent($) {return ($.memberOf == "")}
	function isaFile($) {return ($.is("FILE"))}
	function isaClass($) {return ($.is("CONSTRUCTOR") || $.isNamespace)}
	
	var symbols = symbolSet.toArray();
	
	var files = JSDOC.opt.srcFiles;
 	for (var i = 0, l = files.length; i < l; i++) {
 		var file = files[i];
 		var srcDir = publish.conf.outDir + "symbols/src/";
		makeSrcFile(file, srcDir);
 	}
 	
 	var classes = symbols.filter(isaClass).sort(makeSortby("alias"));
	
	Link.base = "../";
 	//publish.classesIndex = classesTemplate.process(classes); // kept in memory
	
	for (var i = 0, l = classes.length; i < l; i++) {
		var symbol = classes[i];
		var output = "";
		output = classTemplate.process(symbol);
		
		IO.saveFile(publish.conf.outDir+"symbols/", symbol.alias+publish.conf.ext, output);
	}
	
	// regenrate the index with different relative links
	Link.base = "";
	//publish.classesIndex = classesTemplate.process(classes);
	
	try {
		var classesindexTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"index.tmpl");
		var classlistTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"classlist.tmpl");
		var allclassesTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"allclasses.tmpl");
	}
	catch(e) { print(e.message); quit(); }
	
	var classlistHTML = classlistTemplate.process(classes);
	IO.saveFile ( publish.conf.outDir, "classlist"+publish.conf.ext, classlistHTML );
	
	var classesHTML = allclassesTemplate.process ( classes );
	IO.saveFile ( publish.conf.outDir, "allclasses"+publish.conf.ext, classesHTML );
	
	var classesIndex = classesindexTemplate.process(classes);
	IO.saveFile(publish.conf.outDir, "index"+publish.conf.ext, classesIndex);
	classesindexTemplate = classesIndex = classes = null;
	
	
	
	try {
		var fileindexTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"allfiles.tmpl");
	}
	catch(e) { print(e.message); quit(); }
	
	var documentedFiles = symbols.filter(isaFile);
	var allFiles = [];
	
	for (var i = 0; i < files.length; i++) {
		allFiles.push(new JSDOC.Symbol(files[i], [], "FILE", new JSDOC.DocComment("/** */")));
	}
	
	for (var i = 0; i < documentedFiles.length; i++) {
		var offset = files.indexOf(documentedFiles[i].alias);
		allFiles[offset] = documentedFiles[i];
	}
		
	allFiles = allFiles.sort(makeSortby("name"));

	var filesIndex = fileindexTemplate.process(allFiles);
	IO.saveFile(publish.conf.outDir, "files"+publish.conf.ext, filesIndex);
	
	var jquerySrcDir = publish.conf.templatesDir + "jquery/";
	var jqueryOutDir = publish.conf.outDir + "jquery/";
	
	IO.mkPath(jqueryOutDir.split("/"));
	IO.copyFile( jquerySrcDir+"jquery-1.2.6.js", jqueryOutDir);
	IO.copyFile( jquerySrcDir+"jquery.treeview.js", jqueryOutDir);
	IO.copyFile( jquerySrcDir+"treeviewInit.js", jqueryOutDir);
	IO.copyFile( jquerySrcDir+"jquery.treeview.css", jqueryOutDir);
	IO.copyFile( jquerySrcDir+"jquery.cookie.js", jqueryOutDir);
	
	var imgSrcDir = jquerySrcDir + "images/";
	var imgOutDir = jqueryOutDir + "images/";	
	IO.mkPath(imgOutDir.split("/"));
	IO.copyFile ( imgSrcDir + "minus.gif", imgOutDir );
	IO.copyFile ( imgSrcDir + "plus.gif", imgOutDir );
	IO.copyFile ( imgSrcDir + "treeview-default-line.gif", imgOutDir );
	IO.copyFile ( imgSrcDir + "treeview-default.gif", imgOutDir );
	
	fileindexTemplate = filesIndex = files = null;
}


/** Just the first sentence. Should not break on dotted variable names. */
function summarize(desc) {
	if (typeof desc != "undefined")
		return desc.match(/([\w\W]+?\.)[^a-z0-9_$]/i)? RegExp.$1 : desc;
}

/** make a symbol sorter by some attribute */
function makeSortby(attribute) {
	return function(a, b) {
		if (a[attribute] != undefined && b[attribute] != undefined) {
			a = a[attribute].toLowerCase();
			b = b[attribute].toLowerCase();
			if (a < b) return -1;
			if (a > b) return 1;
			return 0;
		}
	}
}

function include(path) {
	var path = publish.conf.templatesDir+path;
	return IO.readFile(path);
}

function makeSrcFile(path, srcDir, name) {
	if (JSDOC.opt.s) return;
	
	if (!name) {
		name = path.replace(/\.\.?[\\\/]/g, "").replace(/[\\\/]/g, "_");
		name = name.replace(/\:/g, "_");
	}
	
	var src = {path: path, name:name, charset: IO.encoding, hilited: ""};
	
	if (defined(JSDOC.PluginManager)) {
		JSDOC.PluginManager.run("onPublishSrc", src);
	}

	if (src.hilited) {
		IO.saveFile(srcDir, name+publish.conf.ext, src.hilited);
	}
}

function makeSignature(params) {
	if (!params) return "()";
	var signature = "("
	+
	params.filter(
		function($) {
			return $.name.indexOf(".") == -1; // don't show config params in signature
		}
	).map(
		function($) {
			return $.name;
		}
	).join(", ")
	+
	")";
	return signature;
}

/** Find symbol {@link ...} strings in text and turn into html links */
function resolveLinks(str, from) {
	str = str.replace(/\{@link ([^} ]+) ?\}/gi,
		function(match, symbolName) {
			return new Link().toSymbol(symbolName);
		}
	);
	
	return str;
}
