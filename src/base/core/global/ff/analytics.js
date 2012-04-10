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
 * LibX toolbar extension
 *
 * Author: Annette Bailey <annette.bailey@gmail.com>
 */ 

/**
 *@fileoverview Sets up a fake HTML DOMWindow environment for
 *google-analtic's ga.js to live in. Emulates the libx background page
 *in google chrome extension.
 *@author Rupinder Paul Khandpur <rupen.paul@gmail.com>
 */
(function () {
    var gaSbox = (function(){
        /*get active window*/
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                           .getService(Components.interfaces.nsIWindowMediator);
        var mrw = wm.getMostRecentWindow("navigator:browser");
        var xpiguid = "$xpiguid$".replace(/\{|\}|\-/g,"");
        /*Build libx background emulation*/
        var loc = {
            protocol : "http:",
            href   : "firefox-extension://" + xpiguid + "/libx.html",
            host   : xpiguid,
            hostname : xpiguid,
            pathname : "/libx.html",
            origin   : "firefox-extension://" + xpiguid,
            port : "",
            hash : "",
            search : "",
            __noSuchMethod__: function(methodName, args) {
                libx.log.write( "The global " + methodName + " method isn't implemented yet." );
            }
        };
        /*prepare the global scope to include in sandbox*/
        var libxbackgroundscope = {
            libx: libx.global,
            window  : {
                _gaq : [],
                console : {
                    error : libx.log.write,
                    warn  : libx.log.write,
                    log   : libx.log.write,
                    info  : libx.log.write,
                },
                history   : {
                    length  : 0,
                    __noSuchMethod__: function(methodName, args) {
                        libx.log.write( "The global " + methodName + " method isn't implemented yet." );
                    }
                },
                navigator : {
                    appName: mrw.navigator.appName,
                    appCodeName: mrw.navigator.appCodeName,
                    javaEnabled: function () { return mrw.navigator.javaEnabled(); },
                    userAgent: mrw.navigator.userAgent,
                    plugins : [],
                    mimeTypes : [],
                    language: mrw.navigator.language,
                    product: mrw.navigator.product,
                    platform:  mrw.navigator.platform
                },
                screen    : {
                   colorDepth: mrw.screen.colorDepth,
                   height: mrw.screen.height,
                   pixelDepth: mrw.screen.pixelDepth,
                   width: mrw.screen.width
                },
                location : loc,
                document  : {
                    body : {
                        clientWidth : mrw.screen.width,
                        clientHeight : mrw.screen.height,
                        title : "LibX 2.0"
                    },
                    title : "LibX 2.0",
                    anchors : [ ],
                    compatMode: "BackCompat",
                    domain   : xpiguid,
                    referrer : "",
                    __cookies : { }, 
                    URL   : "firefox-extension://" + xpiguid + "/libx.html",
                    location : loc,
                    charset: "ISO-8859-1",
                    characterSet: "ISO-8859-1",
                    defaultCharset: "ISO-8859-1",
                    createElement : function (tag) {
                        libx.log.write("createElement: " + tag);
                    },
                    addEventListener : function (l) {
                        libx.log.write("addEventListener: " + l);
                    },
                    __noSuchMethod__: function(methodName, args){
                        libx.log.write( "The global " + methodName + " method isn't implemented yet." );
                    }
                },
                setTimeout : libx.utils.timer.setTimeout,
                __noSuchMethod__ : function (methodName, args){
                    libx.log.write( "The global " + methodName + " method isn't implemented yet." );
                },
                Image : function (width,height) {
                    var _src;
                    this.__defineSetter__("src",function(src){
                         _src = src;
                         libx.cache.defaultMemoryCache.get({
                            type: "GET",
                            url: _src,
                            bypassCache: true,
                         });
                     });
                }
            }
        };
        /*Define getter & setter for document.cookie, to properly emulate the
         * behavior of document.cookie
         */
        libxbackgroundscope.window.document.__defineSetter__("cookie", function (value) {
            var p = value.split(/;\s*/);
            var kv = p[0].split("=");
            var cookie = kv[0];
            var attr = { value: kv[1] };
            for (var i = 1; i < p.length; i++) {
                if (/\s+/.test(p[i]))
                    continue;
                kv = p[i].split("=");
                if (kv.length > 1)
                    attr[kv[0]] = kv[1];
            }
            this.__cookies[cookie] = attr;
        });
        libxbackgroundscope.window.document.__defineGetter__("cookie", function () {
            var c = "";
            var sep = "";
            for (var key in this.__cookies) {
                c += sep + key + "=" + this.__cookies[key].value;
                sep = "; ";
            }
            return c;
        });

        try {
            gaSbox = new libx.libapp.Sandbox(libxbackgroundscope.window,libxbackgroundscope);
            /*load cookie.js synchronously*/
            gaSbox.loadSubScript("chrome://libx/content/core/window/shared/cookie.js");
            
            if( libx.analytics.debug ) 
                libxbackgroundscope.window.ga_debug = { trace : false };

            gaSbox.evaluate('libx.analytics.bd.push = function (args) {' +
                                //'libx.analytics.cleanCookies(' + libxbackgroundscope.window.document.domain +' );' +
                                'window._gaq.push( args );' +
                            '};'
            );
            gaSbox.evaluate('libx.analytics.track({activity:"setAccount"});');

            var ga = "http://www.google-analytics.com/";
            if( libxbackgroundscope.window.ga_debug )
               ga += "u/ga_debug.js";
            else
               ga += "ga.js";
            
            gaSbox.loadScript(ga);

            return gaSbox;
        }
        catch(e)
        {
            libx.log.write("Error while creating ga sandbox in FF. "+ e.message);
        }
    })();

    libx.events.addListener("EditionConfigurationLoaded",{
        onEditionConfigurationLoaded: function (event) {
            /*In FF 'EditionConfiguration' event is immediately fired, and
             * libx.edition may not be set yet!. therefore we capture the
             * edition info from the event object iteself*/
            var edition = { id: event.edition.id, name: { long: escape(event.edition.name['long']) } };
            edition = libx.utils.json.stringify(edition);
            var scriptToRun = 'libx.analytics.track ( {activity:"activeEdition",edition: ' + edition + '} );';
            scriptToRun += 'libx.analytics.track ( {activity:"firstRun",edition: ' + edition + '} );';
            gaSbox.evaluate(scriptToRun);
        }
    });
})();
