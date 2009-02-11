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
 * ***** END LICENSE BLOCK ***** */

/**
 * Bootstrap LibX code from a script URL.
 *
 * The code below is include twice.
 * Once in global space (where 'libx' refers to the global libx object)
 * and once per window (where 'libx' refers to the per-window wrapper
 * and where 'window' is captured).
 *
 * @namespace
 */
libx.bootstrap = {
    /**
     * Load a script.
     *
     * @param {String} scriptURL  URL
     */
    loadScript : function (scriptURL, depends) {
        var bootstrapSelf = this;
        var scriptBase = {
            baseURL : scriptURL.match (/.*\//),
            loadDependentScript : function (depScriptURL) {
                bootstrapSelf.loadScript(depScriptURL, [ this.request ]);
            },
            request : {
                url: scriptURL,
                keepUpdated: true,
                success: function (scriptText, metadata) { 
                    try {
                        libx.log.write("evaluating: " + metadata.originURL, "bootstrap");
                        eval (scriptText);
                    } catch (e) {
                        libx.log.write( "error loading " + metadata.originURL + " -> " + e);
                    }
                },
                depends: depends
            }
        };

        libx.cache.defaultObjectCache.get(scriptBase.request);
    }
};

// vim: ts=4
