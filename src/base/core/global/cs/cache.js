
libx.cache.bd = {
    getXMLHttpReqObj : function () {

       var xmlhttp=null;
       if( libx.cs.browser.safari || libx.cs.browser.opera || libx.cs.browser.chrome || libx.cs.browser.mozilla )
       {
          try {
             xmlhttp = new XMLHttpRequest();
          }catch(err){
             libx.log.write("Unable to create XMLHttpRequest object");
             xmlhttp = undefined;
          }
       }else if ( libx.cs.browser.msie ) {
          try {
             
             if (window.XMLHttpRequest) {//IE 7+ supports XMLHttpRequest Object
                 xmlhttp = new XMLHttpRequest();
             } 
             else if( window.ActiveXObject) { //fall back
                 xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
             } 
         }catch ( err ){
             libx.log.write("Unbale to create XMLHttpRequest object for IE, "+err.message);
             xmlhttp = undefined;
          }
       }else{
          libx.log.write("Error - Unknown Browser! Check for appropriate feature support for getXMLHttpReqObj");
          xmlhttp = undefined;
       }
       //NOTE TO SELF(RPK): not sure about this
       if (!xmlhttp && window.createRequest) {
            try {
                xmlhttp = window.createRequest();
            } catch (e) {
                xmlhttp=false;
            }
       }
    
       if(xmlhttp) {
            var origOpen = xmlhttp.open;
            xmlhttp.open = function(sMethod, sUrl, bAsync, sUser, sPassword) {
                var reqdomainMatch = sUrl.match(/:\/\/(.[^/]+)/);
                // reqdomainMatch is null for relative URLs, which are same-domain
                if (reqdomainMatch == null || reqdomainMatch[1] == document.domain)
                        origOpen.apply(this,[sMethod, sUrl, bAsync, sUser, sPassword]);
                else
                        origOpen.apply(this,[sMethod, 
                                             libx.cs.proxy(sUrl),
                                             bAsync,
                                             sUser,
                                             sPassword
                                            ]
                                      );
                            } 
       }else {
         libx.log.write("Error: In libx.cache.bd.getXMLHttpReqObj xmlhttprequest is undefined.");
       }
       return xmlhttp;
    }
};
