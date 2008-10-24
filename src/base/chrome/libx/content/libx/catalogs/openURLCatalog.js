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
 *                 Michael Doyle ( vtdoylem@gmail.com )
 *
 * ***** END LICENSE BLOCK ***** */

(function() 
{

function OpenURLCatalog() {
    this.options = libxEnv.openUrlResolver.options;
}

libxEnv.catalogClasses["openurlresolver"] = OpenURLCatalog;

OpenURLCatalog.prototype = new libxCatalog();

libxAddToPrototype(OpenURLCatalog.prototype, {
	search: function (fields) {
	    return libxEnv.openUrlResolvers[this.resolvernum].search( fields );
	}
});

})();

// vim: ts=4
