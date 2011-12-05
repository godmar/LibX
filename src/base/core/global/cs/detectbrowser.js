/*Defining cs.browser namespace here*/
 libx.cs.browser = {};
/*Set the bowser type for Client-Side implementation
* for example if Client browser is chrom then
   libx.cs.browser.chrome will evaluate to true
   and libx.cs.browser.[webkit]|[msie]|[opera]|[mozilla] will be unddefined

 and current browser version ==> libx.cs.browser.version 
*/
(function () {
  /*Browser specific regex*/
  var rwebkit = /(webkit)[ \/]([\w.]+)/,
      ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/,
      rmsie = /(msie) ([\w.]+)/,//IE
      rchrome = /(chrome)[ \/]([\w.]+)/,
      rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/,
      ua = window.navigator.userAgent.toLowerCase();

  var match = rchrome.exec( ua ) ||
              rwebkit.exec( ua ) ||
              ropera.exec( ua ) ||
              rmsie.exec( ua ) ||
              ua.indexOf("compatible") < 0 && rmozilla.exec( ua ) ||
              [];
  if(match[1])
  {
    libx.cs.browser[match[1]] = true;
    libx.cs.browser.version = match[2] || "0";
  }
  //if not chrome but webkit is true, then its safari
  if( libx.cs.browser.webkit ) {
     libx.cs.browser.safari = true;
  }
})();
