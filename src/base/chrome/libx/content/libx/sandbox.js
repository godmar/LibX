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
 
// *******************************************************
// sandbox class
// This class creates our sandbox to evaluate our doforurls in
// *******************************************************
 
libxEnv.sandboxClass = function ()
{
    // creates the sandbox with all the functions we need for our doforurls
    // window is the window object, url is the url of the current pages,
    // and m containes the matched part of the url which some doforurls need
    this.createSandbox = function( window, url, m )
    {
        var safeWin = new XPCNativeWrapper(window);
        var theSandBox = new Components.utils.Sandbox( safeWin );
        theSandBox.safeWindow = safeWin;
        theSandBox.window = safeWin;
        theSandBox.unsafeWindow = window;
        theSandBox.document = theSandBox.window.document;
        if ( url )
            theSandBox.url = url;
        theSandBox.alert = alert;
        theSandBox.libxEnv = new Object();
        theSandBox.libxEnv.writeLog = libxEnv.writeLog;
        theSandBox.libxEnv.makeLink = libxEnv.makeLink;
        theSandBox.libraryCatalog = libraryCatalog;
        theSandBox.searchCatalogs = searchCatalogs;
        theSandBox.libxEnv.getProperty = libxEnv.getProperty;
        theSandBox.libxEnv.options = libxEnv.options;
        theSandBox.libxEnv.xpath = libxEnv.xpath;
        theSandBox.isISBN = isISBN;
        theSandBox.libxRunAutoLink = libxRunAutoLink;
        theSandBox.libxEnv.openUrlResolver = libxEnv.openUrlResolver;
        theSandBox.libxEnv.openUrlResolvers = libxEnv.openUrlResolvers;
        theSandBox.libxProxy = libxProxy;
        theSandBox.run = function ()
        {
            theSandBox.action(this.document, this.m);
        }
        theSandBox.m = m;
        return theSandBox;
    }
    
    // evaluates the given function in the sandbox
    this.evaluateInSandbox = function ( func, sandBox )
    {
        Components.utils.evalInSandbox( func , sandBox );
    }
}

libxEnv.sandbox = new libxEnv.sandboxClass();
