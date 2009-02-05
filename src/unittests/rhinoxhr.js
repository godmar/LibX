// XMLHttpRequest
// Originally implemented by Yehuda Katz
// taken from John Resig's env.js
var window = this;
var curLocation = (new java.io.File("./")).toURL();

window.XMLHttpRequest = function(){
    this.headers = {};
    this.responseHeaders = {};
};

XMLHttpRequest.prototype = {
    open: function(method, url, async, user, password){ 
        this.readyState = 1;
        if (async)
            this.async = true;
        this.method = method || "GET";
        this.url = url;
        this.onreadystatechange();
    },
    setRequestHeader: function(header, value){
        this.headers[header] = value;
    },
    getResponseHeader: function(header){ },
    send: function(data){
        var self = this;
        
        function makeRequest(){
            var url = new java.net.URL(curLocation, self.url);
            
            if ( url.getProtocol() == "file" ) {
                if ( self.method == "PUT" ) {
                    var out = new java.io.FileWriter( 
                            new java.io.File( new java.net.URI( url.toString() ) ) ),
                        text = new java.lang.String( data || "" );
                    
                    out.write( text, 0, text.length() );
                    out.flush();
                    out.close();
                } else if ( self.method == "DELETE" ) {
                    var file = new java.io.File( new java.net.URI( url.toString() ) );
                    file["delete"]();
                } else {
                    var connection = url.openConnection();
                    connection.connect();
                    handleResponse();
                }
            } else { 
                var connection = url.openConnection();
                
                connection.setRequestMethod( self.method );
                
                // Add headers to Java connection
                for (var header in self.headers)
                    connection.addRequestProperty(header, self.headers[header]);
            
                connection.connect();
                
                // Stick the response headers into responseHeaders
                for (var i = 0; ; i++) { 
                    var headerName = connection.getHeaderFieldKey(i); 
                    var headerValue = connection.getHeaderField(i); 
                    if (!headerName && !headerValue) break; 
                    if (headerName)
                        self.responseHeaders[headerName] = headerValue;
                }
                
                handleResponse();
            }
            
            function handleResponse(){
                self.readyState = 4;
                self.status = parseInt(connection.responseCode) || undefined;
                self.statusText = connection.responseMessage || "";
                
                var stream = new java.io.InputStreamReader(connection.getInputStream()),
                    buffer = new java.io.BufferedReader(stream), line;
                
                while ((line = buffer.readLine()) != null)
                    self.responseText += line;
                    
                self.responseXML = null;
                
                if ( self.responseText.match(/^\s*</) ) {
                    try {
                        self.responseXML = new DOMDocument(
                            new java.io.ByteArrayInputStream(
                                (new java.lang.String(
                                    self.responseText)).getBytes("UTF8")));
                    } catch(e) {}
                }
            }
            
            self.onreadystatechange();
        }

        if (this.async)
            (new java.lang.Thread(new java.lang.Runnable({
                run: makeRequest
            }))).start();
        else
            makeRequest();
    },
    abort: function(){},
    onreadystatechange: function(){},
    getResponseHeader: function(header){
        if (this.readyState < 3)
            throw new Error("INVALID_STATE_ERR");
        else {
            var returnedHeaders = [];
            for (var rHeader in this.responseHeaders) {
                if (rHeader.match(new Regexp(header, "i")))
                    returnedHeaders.push(this.responseHeaders[rHeader]);
            }
        
            if (returnedHeaders.length)
                return returnedHeaders.join(", ");
        }
        
        return null;
    },
    getAllResponseHeaders: function(header){
        if (this.readyState < 3)
            throw new Error("INVALID_STATE_ERR");
        else {
            var returnedHeaders = [];
            
            for (var header in this.responseHeaders)
                returnedHeaders.push( header + ": " + this.responseHeaders[header] );
            
            return returnedHeaders.join("\r\n");
        }
    },
    async: true,
    readyState: 0,
    responseText: "",
    status: 0
};
