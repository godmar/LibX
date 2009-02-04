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
 * Contributor(s): see file AUTHORS
 * 
 * ***** END LICENSE BLOCK ***** */

/**
 * @fileoverview
 *
 * This file contains functionality related to CiteULike support in LibX.
 */

/**
 * @namespace libx.citeulike
 *
 * Support for CiteULike
 */
libx.citeulike = { 
    /**
     * Initialize CiteULike support
     *
     * Creates a URL Bar icon and hides/shows based on whether 
     * or not posting to CiteULike is supported from a given website
     */
    initialize: function () {
        var icon = new libx.bd.utils.UrlBarIcon();
        icon.setHidden ( true );
        icon.setImage ( "chrome://libx/skin/citeulike.ico" );
        icon.setOnclick ( function  (e) {
            var contentWindow = libxEnv.getCurrentWindowContent();
            var url = contentWindow.location.href;
            var title = contentWindow.document.title;
            libxEnv.openSearchWindow("http://www.citeulike.org/posturl?url=" 
                + encodeURIComponent(url) 
                + "&title=" + encodeURIComponent(title), 
                /* do not uri encode */true, "libx.sametab");
        } );
        icon.setTooltipText ( libxEnv.getProperty ( "citeulike.tooltiptext" ) );

        libx.events.addListener("ContentChange", {
            onContentChange: function ( e, args ) {
                var contentWindow = libxEnv.getCurrentWindowContent();
                var url = contentWindow.location.href;
                citeulike.canpost(url, function ( url, reg ) {
                    libx.log.write ( "Enabled: " + url, "citeulike" );
                    icon.setHidden (!libx.utils.browserprefs.getBoolPref('libx.urlbar.citeulike', true));
                }, function ( url ) {
                    libx.log.write ( "Disabled: " + url, "citeulike" );
                    icon.setHidden ( 'true' );
                });
            }
        });
    }
}
