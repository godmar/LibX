/*
 * Call google analytics api's _gaq.push method, after clean up of 
 * all GA related cookies. We clean up first before evry 'push' call 
 * so that each pageview is tracked as a unique pageview
 */
libx.analytics.bd.push = function (args) {
    //libx.analytics.cleanCookies( document.domain );
    _gaq.push(args);
}
/* if libx.analytics.debug is defined, GA will use ga_debug.js
 * and further if 'trace' is set to 'true' to enable verbose debug output to console. 
 * By default ga.js is used.
 */
if ( libx.analytics.debug )
    var ga_debug = { trace: false }

/*initialize google analytics queue (as per async syntax)*/
var _gaq = _gaq || [];
libx.analytics._accountId = "UA-30755371-1";
libx.analytics.track({activity:"setAccount"});

(function() {
  /*Syntax for async download google analytics tracking script*/
  var ga = document.createElement('script'); ga.type = 'text/javascript';
  ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/' + (window.ga_debug ? 'u/ga_debug.js' : 'ga.js');
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(ga, s);
})();

