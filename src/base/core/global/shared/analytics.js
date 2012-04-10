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
  *	@fileoverview Implementation of LibX  Analytics API 
  *	@author Rupinder Paul Khandpur <rupen.paul@gmail.com>
  */

/**
 * LibX Analytics.
 * @namespace Holds all libx analytics api
 */ 
libx.analytics = (function() {

    var _trackEvent    = '_trackEvent';
    var _trackPageview = '_trackPageview';
    var _setAccount    = '_setAccount';
    var _accountId     =  "$gaaccountid$";
    /* Google analytics cookies -- that need to be removed*/
    var _cookiesToRemove = ["__utma", "__utmb", "__utmc", "__utmz", "__utmv", "_utmx"];

    var push = function (args) {
      try { 
        libx.analytics.bd.push(args);
      }catch(err) {
        libx.log.write("Error! Unable to send analytics 'push' request =>\n"+ err.message);
      }
    }
    var _track = {
        /**
         * Track search activity 
         * @param {object} args An object containing activity specific
         * information
         * @param {property} args.catalog selected catalog name with which search
         * was run 
         * @param {property} [args.searchtype] describes the search type user ran, such 
         * preview or full-search)
         */
        search : function( args ) {
           if(! libx.prefs.browser.trackextension._value) return;

           if(args && args.catalog) {
             push([ _trackPageview,
                     /*page url*/
                    "/" + (args.searchtype || "searches") + "/" + args.edition.id + "/" + args.catalog
             ]);
           }
        },
        /**
         * Track libapp usage 
         * @param {object} args An object containing activity specific
         * information
         * @param {property} args.libapp libapp-id
         * @param {property} args.module module-id
         * @param {property} [args.actiontype] describes the user action type such
         * click, hover, select, etc)
         */
        libapp : function( args ) {
           if(! libx.prefs.browser.tracklibapps._value) return;
           if(args && args.module && args.libapp) {
             args.module = "mod_" + args.module;
             args.libapp = "lib_" + args.libapp;
             var eventAction  = ( args.actiontype ? ( "|" + args.actiontype.toUpperCase() ) : "");
             push([_trackEvent, args.module, args.libapp + eventAction, args.edition.id]);            
             push([_trackEvent, args.libapp, args.module + eventAction, args.edition.id]);            
           } 
        },
        /**
         * Track first install of libx extension
         * @param {object} args.edition edition object
         * @param {property} args.edition.id edition id
         * @param {property} args.edition.name long name of the edition
         */
        firstRun : function( args ) {
           if(! libx.prefs.browser.trackextension._value) return;
            /*if first run, track firstRun pageview separately and set a cookie 
              named 'firstRun in background libx page*/
           if( args.edition && !libx.utils.browserprefs.getBoolPref('libx.firstRun',false) ) {
              var arg = '/firstRun/' + args.edition.id + "/" + unescape(args.edition.name['long']);
              push([_trackPageview, arg]);
              libx.utils.browserprefs.setBoolPref('libx.firstRun',true);
           }
        },
        /**
         * Track an active edition either at first Install or at new browser
         * session
         * @param {object} args.edition edition object
         * @param {property} args.edition.id edition id
         * @param {property} args.edition.name long name of the edition
         */
        activeEdition : function ( args ) {
           if(! libx.prefs.browser.trackextension._value) return;
           /*track active use-state of libx extension with specific edition */
           if( args.edition ) {
              /* we unescape , since FF libx.analytics.bd.push may have encoded
               * special chars in args.edtion.name.long. And we had done that, 
               * so it could safely parse as json string in FF's GA HTML emulation env.
               * But here, we 'unescape', since ga.js automatically handles cases where
               * a string might contain special chars and therefore encodes/decodes the
               * string. If we were to not apply unescape here, and if arg.edition.name.long
               * string contains encoded chars. It was observed that the string was never
               * decoded back by ga.js when seen GA dashboard, which looked
               * ugly*/
              var arg = '/active/' + args.edition.id + '/' + unescape(args.edition.name['long']);
              push([_trackPageview, arg]);
           }
        },
        /**
         * Initializes google analytics tracker by setting user account
         */
        setAccount : function ( ) {
           push([_setAccount, _accountId]);
        }
    };

    return {
        /**
         * @name libx.analytics.track
         * @function
         * @description Track a particular activity in libx.analytics. Following activities can be tracked: 
         * (1) search - Tracks clicks to preview & search button in Libx extension
         * (2) libapp - Tracks libapps & module usage 
         * (3) firstRun - Tracks the first time Libx extension is installed in users browser 
         * (4) activeEdition - Tracks everytime an edition is activated in LibX.
         * @param {object} args An object containing activity specific
         * information
         * @param {property} args.activity name of the activity to be tracked
         * @param {property} args.catalog selected catalog name with which search
         * was run. [ args.activity = "search" ] 
         * @param {property} [args.searchtype] describes the search type user ran, such 
         * preview or full-search) [ args.activity = "search" ] 
         * @param {property} args.libapp libapp-id [ args.activity = "libapp" ]
         * @param {property} args.module module-id [ args.activity = "libapp" ]
         * @param {property} [args.actiontype] describes the user action type such
         * click, hover, select, etc) [ args.activity = "libapp" ]
         * @param {object} args.edition edition object [ args.activity =
         * "firstRun" OR "activeEdition" ]
         * @param {property} args.edition.id edition id
         * @param {property} args.edition.name long name of the edition
         */
        track : function( args ) {
          args.edition = args.edition || libx.edition ;
          var activity = args && args.activity;
          _track[activity] && _track[activity](args);
        },
        /**
         * @name libx.analytics.bd
         * @namespace libx.analytics.bd
         * @description Browser-dependent libx.analytics api
         */
        bd : {
          /**
           * @name libx.analytics.bd.push
           * @function
           * @description Browser dependent push request to Google Analytics API. 
           * @param {string[]} args format of this array object is identical to google
           * analytics _gaq.push methods parameter specification. The 'push' request will
           * fail if args do not conform
           * @see http://code.google.com/apis/analytics/docs/gaJS/gaJSApi_gaq.html#_gaq.push
           */
          push : libx.core.AbstractFunction('libx.analytics.bd.push')
        },
        /**
         * @name libx.analytics.cleanCookies
         * @function
         * @description Removes all cookies related to google analytics from the HTML document
         * @param {string} docDomain domain name of document
         * @requires libx.utils.cookie
         * @ignore
         */
        cleanCookies : function ( docDomain ) {
            if( libx.utils.cookie ){
                _cookiesToRemove.forEach(function(c){
                     libx.utils.cookie.removeCookie(c,"."+ docDomain);
                });
            }else { libx.log.write("libx.utils.cookie undefined. No Cookie cleanup done! But, continuing with push request.");}
        },
        /**
         * @name libx.analytics.debug
         * @property
         * @description Debug flag, If set to true loads ga_debug.js other wise ga.js is loaded.
         * @default false 
         */
        debug : false 
    }
}());
