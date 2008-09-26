
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
 * Contributor(s): Tobias Wieschnowsky (frostyt@vt.edu)
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * API:
 *
 * To add cues files use:
 * addCue ( url );
 *
 * To add jqplugin files use:
 * addJqueryPlugin( url );
 *
 * This default file can be replaced by edition holder by adding their own into
 * the config.xml either manually or on the edition builder.
 * The location inside the config.xml is : /edition/localizationfeeds/feed/
 * the xml element will look something like this:
 * <feed url="http://libx.cs.vt.edu/~frostyt/Cues/root.js" description="LibX Standard Cues"/>
 * Libx 1.5 supports the use of multiple root.js, so for example you can use 
 * our standard cues as well as your own collection of cues.
 *
 */


var cueUrl = "cues/";
var sandboxUrl = "sandboxScripts/";
var hotfixUrl = "hotfixes/";

// set up autolink handlers
libxEnv.autolink =  { textTransformers: [] };

// handlers: of COinS handlers
// handlers_v0_1: backwards-compatible OpenURL 0.1 handlers
libxEnv.coins = { handlers: [], handlers_v0_1: [] };

// XXX libxEnv.autolink.coins "smuggles" coins object into the sandbox via 
// libxEnv.autolink, which is in the sandbox.  We need to fix this and provide an 
// API for cues to provide properties to the sandbox.
// see also sandboxScripts/setup.js
libxEnv.autolink.coins = libxEnv.coins;
libxEnv.autolink.getXMLDocument = libxEnv.getXMLDocument;

addSandboxScript( sandboxUrl + "setup.js" );
addSandboxScript( sandboxUrl + "jquery-1.2.3.js" );
addSandboxScript( sandboxUrl + "handleCoins.js" );
addSandboxScript( sandboxUrl + "cueAnimation.js" );

addCue( cueUrl + "textexplorer.js" );
addCue( cueUrl + "texttransformer.js" );
addCue( cueUrl + "agricola.js" );
addCue( cueUrl + "alibris.js" );
addCue( cueUrl + "amazon.js" );
addCue( cueUrl + "autolink.js" );
addCue( cueUrl + "barnesandnoble.js");
addCue( cueUrl + "booklistonline.js" );
addCue( cueUrl + "chapters.js" );
addCue( cueUrl + "ecampus.js" );
addCue( cueUrl + "globalbooksinprint.js" );
addCue( cueUrl + "google.js" );
addCue( cueUrl + "nytimes.js" );
addCue( cueUrl + "powells.js" );
addCue( cueUrl + "serialsolutions.js" );
addCue( cueUrl + "wam.js" );
addCue( cueUrl + "yahoo.js" );
addCue( cueUrl + "coins.js" );
addCue( cueUrl + "abebooks.js" );
