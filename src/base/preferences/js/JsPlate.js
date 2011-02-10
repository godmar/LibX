
/**
 *  Original code from the jsdoc-toolkit project: code.google.com/p/jsdoc-toolkit
 *
 *  Heavily modified for use with the LibX Preferences system by Michael Doyle (doylem@vt.edu)
 */
 
/**
    @constructor
*/
JsPlate = function(templateFileText, templateFile, aQueues, data) {
    this.template = templateFileText;
    this.templateFile = templateFile;
    this.aQueues = aQueues;
    this.code = "";
    this.data = data;
    this.parse();
}

JsPlate.prototype.parse = function() {
    this.template = this.template.replace(/\{#[\s\S]+?#\}/gi, "");
    this.code = "(function () { var output=``"+this.template;

    this.code = this.code.replace(
        /<for +each="(.+?)" +in="(.+?)" *>/gi, 
        function (match, eachName, inName) {
            return "``;\rvar $"+eachName+"_keys = keys("+inName+");\rfor(var $"+eachName+"_i = 0; $"+eachName+"_i < $"+eachName+"_keys.length; $"+eachName+"_i++) {\rvar $"+eachName+"_last = ($"+eachName+"_i == $"+eachName+"_keys.length-1);\rvar $"+eachName+"_key = $"+eachName+"_keys[$"+eachName+"_i];\rvar "+eachName+" = "+inName+"[$"+eachName+"_key];\routput+=``";
        }
    );
    this.code = this.code.replace(/<if test="(.+?)">/g, "``;\rif ($1) { output+=``");
    this.code = this.code.replace(/<elseif test="(.+?)"\s*\/>/g, "``;}\relse if ($1) { output+=``");
    this.code = this.code.replace(/<else\s*\/>/g, "``;}\relse { output+=``");
    this.code = this.code.replace(/<\/(if|for)>/g, "``;\r};\routput+=``");
    this.code = this.code.replace(
        /\{\+\s*([\s\S]+?)\s*\+\}/g,
        function (match, code) {
            code = code.replace(/"/g, "``"); // prevent quote-escaping of inline code
            code = code.replace(/(\r?\n)/g, " ");
            return "``+ ("+code+") +``";
        }
    );
    this.code = this.code.replace(
        /\{!\s*([\s\S]+?)\s*!\}/g,
        function (match, code) {
            code = code.replace(/"/g, "``"); // prevent quote-escaping of inline code
            code = code.replace(/(\n)/g, " ");
            return "``; "+code+";\routput+=``";
        }
    );
    
    var self = this;
    // Custom Additions for LibX Templating
    // The {P pref, templateName P} tag for processing
    this.code = this.code.replace(
        /\{\P\s*([\s\S]+?)\s*P\}/g,
        function (match, code) {
            code = code.replace(/"/g, "``"); // prevent quote-escaping of inline code
            code = code.replace(/(\r?\n)/g, " ");
            return "``+ ( process ( aQueues, " + code + " ) ) +``";
        }
    );
    
    // The {L propName, default L} for localized template strings
    this.code = this.code.replace(
        /\{\L\s*([\s\S]+?)\s*L\}/g,
        function (match, code) {
            code = code.replace(/"/g, "``"); // prevent quote-escaping of inline code
            code = code.replace(/(\r?\n)/g, " ");
            return "``+ ( templateBundle.getProperty (" + code + " ) ) +``";
        }
    );
    
    this.code = this.code + "``;";

    this.code = this.code.replace(/(\r?\n)/g, "\\n");
    this.code = this.code.replace(/"/g, "\\\"");
    this.code = this.code.replace(/``/g, "\"");
    this.code += "return output;})()";
};

JsPlate.prototype.toCode = function() {
    return this.code;
};

JsPlate.keys = function(obj) {
    var keys = [];
    if (obj.constructor.toString().indexOf("Array") > -1) {
        for (var i = 0; i < obj.length; i++) {
            keys.push(i);
        }
    }
    else {
        for (var i in obj) {
            keys.push(i);
        }
    }
    return keys;
};

JsPlate.values = function(obj) {
    var values = [];
    if (obj.constructor.toString().indexOf("Array") > -1) {
        for (var i = 0; i < obj.length; i++) {
            values.push(obj[i]);
        }
    }
    else {
        for (var i in obj) {
            values.push(obj[i]);
        }
    }
    return values;
};

JsPlate.prototype.process = function(data) {
    var keys = JsPlate.keys;
    var values = JsPlate.values;
        
    try {
        var aQueues = this.aQueues;
        var templateScope = {
            data: this.data,
            queueFunction: function (fn) {
                var q = new libx.utils.collections.ActivityQueue();
                fnAct = { onready: fn };
                q.scheduleLast(fnAct);
                aQueues.push(fnAct);
            }
        }
        var output = eval(this.code);
    }
    catch (e) {
        var erstr = "";
        erstr += (">> There was an error evaluating the compiled code from template: "+this.templateFile) + "\n";
        erstr += ("   The error was on line "+e.lineNumber+" "+e.name+": "+e.message) + "\n";
        var lines = this.code.split("\r");
        if (e.lineNumber-2 >= 0) erstr+=("line "+(e.lineNumber-1)+": "+lines[e.lineNumber-2]) + "\n";
        erstr += ("line "+e.lineNumber+": "+lines[e.lineNumber-1]) + "\n";
        erstr += ("this.code: " + this.code) + "\n";
        libx.log.write ( erstr );
    }
    
    return output;
};
