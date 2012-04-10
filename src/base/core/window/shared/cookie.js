(function () {
/**
 * Cookie Manager for current document
 * @see <a href="https://developer.mozilla.org/en/DOM/document.cookie"/>
 * @name libx.utils.cookie
 * @namespace Holds functionality related to cookie management of current
 * document
 */
libx.utils.cookie = {
    /**
     * Get Cookie
     *
     * @param {string} sKey the name of the cookie
     * @returns {string} matching cookie(s)  
     */
      getCookie: function ( sKey ) {
        if (!sKey || !this.hasCookie(sKey)) { return null; }
        return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" 
                        + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") 
                        + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1")
                       );
     },
     /**
      * Set Cookie
      *
      * @param {string} sKey the name of the cookie
      * @param {string} sValue the value of the cookie
      * @param {string|number|date|null} vEnd the max-age in seconds (e.g., 31536e3 for a year) or the
      *  expires date in GMTString format or in Date Object format. If
      *  not specified it will expire at the end of session
      * @param {string|null} [sPath] e.g., "/","/mydir"; if not specified, 
      * defaults to the current path of the current document location
      * @param {string|null} [sDomain] e.g., "example.com", ".example.com" 
      * (includes all subdomains) or "subdomain.example.com". If not
      * specified, defaults to the host portion of the current
      * document location
      * @param {boolean|null} [bSecure] cookie will be transmitted only over 
      * secure protocol as https
      */
     setCookie: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
       if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/.test(sKey)) { return; }
       var sExpires = "";
       if (vEnd) {
         switch (typeof vEnd) {
           case "number": sExpires = "; max-age=" + vEnd; break;
           case "string": sExpires = "; expires=" + vEnd; break;
           case "object": if (vEnd.hasOwnProperty("toGMTString")) { sExpires = "; expires=" + vEnd.toGMTString(); } break;
         }
       }
       document.cookie = escape(sKey) + "=" + escape(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
     },
    /**
     * Check if cookie exists
     *
     * @param {string} sKey the name of the cookie
     * @return {boolean}  true if cookie was found, otherwise false  
     */
    hasCookie : function ( sKey ) {
        return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") 
                    + "\\s*\\=")).test(document.cookie);
    },
    /**
     * Remove cookie
     *
     * @param {string} sKey the name of the cookie
     * @param {string|null} sDomain the domain of the cookie;
     */
    removeCookie : function ( sKey, sDomain ) {
        if (!sKey || !this.hasCookie(sKey)) { return; }
        var oExpDate = new Date();
        oExpDate.setDate(oExpDate.getDate() - 1);
        document.cookie = escape(sKey) + "=;expires=" + oExpDate.toGMTString() + (sDomain ? ";domain=" + sDomain : "") + ";path=/";
    }
};
}) ();
