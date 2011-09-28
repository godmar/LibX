
libx.cache.bd = {
    getXMLHttpReqObj : function () {
        var xmlhttp=false;
        /*@cc_on @*/
        /*@if (@_jscript_version >= 5)
        // JScript gives us Conditional compilation, we can cope with old IE versions.
        // and security blocked creation of the objects.
         try {
          xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
         } catch (e) {
          try {
           xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
          } catch (E) {
           xmlhttp = false;
          }
         }
        @end @*/
        if (!xmlhttp && typeof XMLHttpRequest!='undefined') {
            try {
                xmlhttp = new XMLHttpRequest();
            } catch (e) {
                xmlhttp=false;
            }
        }
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
                var reqdomain = sUrl.match(/:\/\/(.[^/]+)/)[1];
                if (reqdomain == document.domain)
                        origOpen.apply(this,[sMethod, sUrl, bAsync, sUser, sPassword]);
                else
                        origOpen.apply(this,[sMethod, 
                        "libxrestructuring/src/base/core/global/cs/proxy.php?url="+ encodeURIComponent(sUrl),
                        bAsync, sUser, sPassword]);
            }
        }
        return xmlhttp;
    }
};
