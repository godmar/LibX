/**
 * Get the bootstrap URL for a path. [client-side implementation]
 *
 * @param {String} path  the relative path of the resource
 * @returns {String} the absolute bootstrap URL for the resource
 */
libx.utils.getBootstrapURL = function (path) {
    return libx.cs.baseurl + "src/base/bootstrapped/" + path;
};

libx.utils.getExtensionURL = function (path) {
    return libx.cs.baseurl + "src/base/" + path;
};

/**
 * Get the browser type. [client-side implementation]
 *
 * @returns {String} browser type code
           ff - firefox
           gc - Chrome
           ie - internet explorer
           op - opera
           sa - safari
*/
libx.utils.browserType = function () {
   var _userAgent = window.navigator.userAgent.toLowerCase();
   
   if ( /firefox/.test(_userAgent) ){
      return "ff";
   }else if (/msie/.test(_userAgent)){
      return "ie";
   }else if(/chrome/.test(_userAgent)){
      return "gc";/*Note: weirldy userAgent string in Chrome outputs both Chrome and Safari*/
   }else if(/safari/.test(_userAgent)){
      return "sa";
   }else if(/opera/.test(_userAgent)){
      return "op";
   }else {
      return "unknown";
   }
};

