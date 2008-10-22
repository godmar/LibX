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
 * Contributor(s): Godmar Back (godmar@gmail.com)
 *
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * A custom catalog is one whose implementation is loaded externally at
 * runtime.  This will impose a load on the server serving it.
 * Use googlepages.com or similar to host your catalogs. 
 *
 * When the external implementation is invoked, the properties
 * url, name, options are set. 
 * jsimplurl is the URL where the configuration is loaded from.
 * Optionally, param0 to param19 may be set.
 */
(function () 
{
function CustomCatalog() { }

libxEnv.catalogClasses["custom"] = CustomCatalog;

CustomCatalog.prototype = new libxCatalog();

libxAddToPrototype(CustomCatalog.prototype, {
	xisbn: { opacid: "Please set thisCatalog.xisbn.opacid as per http://xisbn.worldcat.org/liblook/howtolinkbyopactype.htm" },
    __init: function () {
        var thisCatalog = this;

        libxEnv.writeLog("Loading external catalog implementation from: " + thisCatalog.jsimplurl);
        libxEnv.getDocument(this.jsimplurl, function (code) {
            try {
                eval(code);
            } catch (er) {
                libxEnv.writeLog("Error loading external catalog from " 
                    + thisCatalog.jsimplurl + ". I received: " + code);
            }
        });
    }
});

})();
// vim: ts=4
