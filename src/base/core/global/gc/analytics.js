/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is LibX Firefox Extension.
 *
 * The Initial Developer of the Original Code is Annette Bailey (libx.org@gmail.com)
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer and Virginia Tech. All Rights Reserved.
 *
 * Contributor(s): Rupinder Paul Khandpur (rupen.paul@gmail.com)
 *
 * ***** END LICENSE BLOCK ***** */
 
 
 /**
  *	@fileoverview Implementation of (part of) 
  *	              LibX  Analytics (browser dependent) API 
  *	@author Rupinder Paul Khandpur <rupen.paul@gmail.com>
  */

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
libx.analytics.track({activity:"setAccount"});

(function() {
  /* Syntax for async download google analytics tracking script */
  /* See http://developer.chrome.com/chrome/extensions/tut_analytics.html#toc-installing */
  var ga = document.createElement('script'); ga.type = 'text/javascript';
  ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/' + (window.ga_debug ? 'u/ga_debug.js' : 'ga.js');
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(ga, s); 
})();
