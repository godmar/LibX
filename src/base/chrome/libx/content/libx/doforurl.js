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

/*
 * doforurl.js
 * Author: Godmar Back
 *
 * Associate an action when the user reaches a given URL, greasemonkey style.
 * The difference between this and greasemonkey is that
 * greasemonkey scripts will run inside the DOM of the page, just ordinary
 * user javascripts, whereas the scripts here will run inside Chrome JS.
 *
 * Example:
 * function doAmazon(doc) {
 *      // doc is document to be loaded
 *      alert("you're at amazon");
 * }
 *
 * then place outside a function:
 *
 * new DoForURL(/\.amazon\.com/, doAmazon);
 * Voila!
 *
 * The actual DoForURLs are now hosted as automatically updated file on:
 * http://libx.cs.vt.edu/~frostyt/Cues/rootList.js
 * This list will tell you the location and name of the DoForUrls
 *
 */

//**********************************************************************
// doforurl Class
// This class initializes all our doforurls and then executes them when a 
// new page is loaded.
// ********************************************************************** 
libxEnv.doforurlClass = function()
{
    //  logging functions for errors within this class
    function dfu_log( msg ) {
        libxEnv.writeLog( msg, 'doforurl');
    }
    
    
    var sec = 1000;
    var minute = 60*sec;
    var hour = 60*minute;
    var day = 24*hour;
    
    // reference to this 
    var that = this;
    // list of doforurl actions
    var dfu_actions = new Array();
    // list of cue files read from root.js
    this.cueList = new Array();
    // list of sandbox files read from root.js
    sandboxScriptList = new Array();
    // list of hotfix files
    this.hotfixList = new Array();
    // list of roots
    var rootList = new Array();
    //the current root to tell cues and such if they should update
    var curroot;
    
    var cue = function ( url, type )
    {
        this.url = url;
        this.type = type;
        this.text = null;
    }
    
    
    function addCue( url )
    {
        var c = new cue( url, "cue", curroot );
        that.cueList.push( c );
        if ( curroot.updating == true )
            libxEnv.fileCache.updateCue( c );
        else
            libxEnv.fileCache.getCue( c );
        c.callback = function ()
        {
            try {
                eval( c.text );
            }
            catch ( e )
            {
                dfu_log( "Error from cue " + c.url + " of type " + c.type + "\n error: " + e );
            }
        }
            
    }
    
    function addSandboxScript( url )
    {
        var c = new cue( url , "sandbox", curroot );
        sandboxScriptList.push( c );
        if ( curroot.updating == true )
            libxEnv.fileCache.updateCue( c );
        else
            libxEnv.fileCache.getCue( c );
    }
    
    function addHotfix( url )
    {
        var c = new cue( url, "hotfix", curroot );
        that.hotfixList.push( c );
        if ( curroot.updating == true )
            libxEnv.fileCache.updateCue( c );
        else
            libxEnv.fileCache.getCue( c );
    }
    
    function addRoot( url, updating )
    {
        var c = new cue( url, "root" );
        c.callback = function ()
        {
            try {
                if ( libxEnv.displayLastUpdateDate !== undefined )
                {   // if it exists we are in the perfs part and need to update last update date
                    libxEnv.displayLastUpdateDate();
                }
                if ( libxEnv.displayLastModifieds !== undefined )
                { // if it exists we are in the prefs part and need to update the last modified dates
                    libxEnv.displayLastModifieds();
                }
                curroot = c;
                eval( c.text );
            }
            catch ( e )
            {
                dfu_log( "Error from cue " + c.url + " of type " + c.type + "\n error: " + e );
            }
        }
        rootList.push( c );
        if ( updating == true )
            libxEnv.fileCache.updateCue( c );
        else
            libxEnv.fileCache.getCue( c );
    }
    
    // DoForUrl function to create the doforurls and automatically add them to the dfu_actions list
    this.DoForURL = function (/* a regex */urlpattern, /* function */what, /* array<regex> */exclude)
    {
        this.pattern = urlpattern;
        this.action = what;
        this.exclude = exclude;
        this.aidx = dfu_actions.push(this);
    }
    
    this.onPageComplete_ie = function(doc, location)
    {
        if (!doc) return;

        if (location == 'about:blank')
                return;

    outer:
        for (var i = 0; i < dfu_actions.length; i++) {
            var dfu = dfu_actions[i];
            var m = location.match(dfu.pattern);
            if (m) {
                var exclude = dfu.exclude;
                if (exclude) {
                    for (var j = 0; j < exclude.length; j++)
                        if (location.match(exclude[j]))
                            continue outer;
                }
                try {
                    for ( var l = 0; l < sandboxScriptList.length; l++ )
                    {
                        eval( sandboxScriptList[l].text );
                    } 
                    dfu.action(doc, m);
                } catch (e) { 
                    dfu_log(e.message);
                }
            }
        }
    
    }
    
    
    // runs through all the doforurls once a new page is loaded
    this.onPageComplete_ff = function(ev)
    {
        if (!ev) return;
        
        var win = ev.explicitOriginalTarget.defaultView;
        var doc = win.document;
        if (ev.originalTarget.location == 'about:blank')
                return;     
                
    outer:
        for (var i = 0; i < dfu_actions.length; i++) {
            var dfu = dfu_actions[i];
            var m;
            if (m = ev.originalTarget.location.href.match(dfu.pattern)) {
                var exclude = dfu.exclude;
                if (exclude) {
                    for (var j = 0; j < exclude.length; j++)
                        if (ev.originalTarget.location.href.match(exclude[j]))
                            continue outer;
                }

                try {                    
                    var func = "this.action = " + dfu.action + "; run();";				
					var sandbox = libxEnv.sandbox.createSandbox( win, ev.originalTarget.location.href, m );
                    for ( var l = 0; l < sandboxScriptList.length; l++ )
                    {
                        try {
                                libxEnv.sandbox.evaluateInSandbox( sandboxScriptList[l].text, sandbox );
                        }
                        catch(f)
                        {
                            dfu_log(" sandboxScript " + f );
                        }
                    }
					libxEnv.sandbox.evaluateInSandbox( func , sandbox);
                } catch (e) { 
                    dfu_log(" sandbox " + e);
                }
            }
        }
    }

    function getRoots( updating )
    {
        if ( libxEnv.xmlDoc.xml )
        {
            var rootsInXML = libxEnv.xpath.findNodesXML( libxEnv.xmlDoc.xml,
                "/edition/localizationfeeds/feed" );
            if ( rootsInXML )
            {
                for (var i = 0; i < rootsInXML.length; i++ )
                {
                    addRoot(rootsInXML[i].getAttribute( "url" ), updating );
                }
            }
            else
            {
                dfu_log( "Did not find any roots specified in config.xml switching to default" );
            }
        }
        else 
        {   
            dfu_log( "Could not access libxEnv.xmlDoc.xml!" );
        }
    }
    
    this.getRootInfo = function()
    {
        var rootInfo = new Array();
        if ( libxEnv.xmlDoc.xml )
        {
            var rootsInXML = libxEnv.xpath.findNodesXML( libxEnv.xmlDoc.xml, "/edition/localizationfeeds/feed" );
            if ( rootsInXML )
            {
                for ( var i = 0; i < rootsInXML.length; i++ )
                {
                    var temp = new Object();
                    temp.url = rootsInXML[i].getAttribute( "url" );
                    temp.lastMod = libxEnv.fileCache.getLastModifiedDate( temp.url );
                    rootInfo.push( temp );
                }
            }
        }
        if ( rootInfo.length == 0 )
        {
            var temp = new Object();
            temp.url = "http://libx.cs.vt.edu/~frostyt/Cues/root.js";
            temp.lastMod = libxEnv.fileCache.getLastModifiedDate( temp.url );
            rootInfo.push( temp );
        }
        return rootInfo;
    }
    
    // updates all the doforurls with the most current version found online
    this.updateDoforurls = function () 
    {   // think about detecting failure to update and then not setting new update date
        dfu_log( "Updating Cues" );
        var curdate = Date();
        updating = true;
        libxEnv.setIntPref("libx.nextupdate", (Date.parse(curdate) + 24*hour));
        rootList = new Array();
        this.cueList = new Array();
        sandboxScriptList = new Array();
        this.hotfixList = new Array();
        getRoots( true );
        if ( rootList.length == 0 ) 
        {
            addRoot( "http://libx.cs.vt.edu/~frostyt/Cues/root.js", updating );
        }
        dfu_log( "Done Updating Cues" );
    }

    // initializes the doforurls by reading them from file and adding them to 
    // the cueList.
    this.initDoforurls = function () 
    {
        rootList = new Array();
        this.cueList = new Array();
        sandboxScriptList = new Array();
        this.hotfixList = new Array();
        getRoots(false);
        if ( rootList.length == 0 ) 
        {
            addRoot( "http://libx.cs.vt.edu/~frostyt/Cues/root.js" );
        }
        libxEnv.fileCache.saveFileList();
        that.setUpdateTimeOut();
    }
    
    function reviveUpdate()
    {
        var curdate  = Date();
        var timeout = libxEnv.getIntPref( "libx.timeout" );
        var timeDifference = Date.parse(curdate) - timeout;
        if ( timeDifference >= 0 )
        {
            if ( timeDifference < hour )
            { // we woke up around the right time
                dfu_log( "Updating NOW!" );
                that.updateDoforurls();
                that.setUpdateTimeOut( true );
            }
            else
            {   //we missed by a lot setting a new random update in the future
                var update = libxEnv.getIntPref( "libx.nextupdate" );
                timeDifference = Date.parse(curdate) - update;
                var timeToResetUpdate = Math.floor(((6*hour/timeDifference)*
                    hour*Math.random()));
                if ( timeToResetUpdate > 6*hour )
                {
                    timeToResetUpdate = 4*hour + Math.floor( 
                        Math.random()*2*hour );
                }
                dfu_log( "Update: timeout is set for : " + 
                    makeUpdateTimeString( timeToResetUpdate ));
                setTimeout( reviveUpdate, timeToResetUpdate );
            }
        }
    }
    
    var makeUpdateTimeString = function( updateTime )
    {
        var result = "";
        var tdays = Math.floor(updateTime/day);
        if ( tdays > 0 )
        {
            updateTime -= tdays*day;
            result += tdays + " Days ";
        }
        var thours = Math.floor( updateTime/hour);
        if ( thours > 0 )
        {
            updateTime -= thours*hour;
            result += thours + " Hours ";
        }
        var tmins = Math.floor( updateTime/minute);
        if (tmins > 0 )
        {
            updateTime -= tmins*minute;
            result += tmins + " Minutes ";
        }
        var tsecs = Math.floor( updateTime/sec );
        if ( tsecs > 0 )
        {
            result += tsecs + " Seconds ";
        }
        return result;
    }
    
    this.setUpdateTimeOut = function ( setNew )
    {
        var nextUpdate = libxEnv.getIntPref( "libx.nextupdate" );
        if ( !nextUpdate || setNew )
        {
            dfu_log( "Update: Next Update has not been set, setting it now " );
            var curdate = Date();
            var update = Math.floor( Math.random()*day );
            dfu_log( "Update: current date is " + curdate + 
                " setting update for " + new Date(
                Date.parse(curdate.toString()) + update) );
            libxEnv.setIntPref( "libx.nextupdate" , (Date.parse(
                curdate.toString()) + update) );
            dfu_log( "Update: timeout is set for : " + 
                makeUpdateTimeString( update ));
            libxEnv.setIntPref( "libx.timeout", 
                (Date.parse(curdate.toString()) + update ) );
            window.setTimeout ( reviveUpdate, update );
        }
        else
        {
            var curdate = Date.parse(Date());
            dfu_log( "Update: current date " + new Date(curdate) );
            dfu_log( "Update: next update will be " + new Date( nextUpdate ));
            if ( curdate > nextUpdate )
            {   // set timeout missed its update somehow reseting
                var timeSinceUpdateTarget = curdate - nextUpdate;
                var timeToResetUpdate = Math.floor((
                    6*hour/timeSinceUpdateTarget)*hour*Math.random());
                if ( timeToResetUpdate > 6*hour )
                {
                    timeToResetUpdate = 4*hour + Math.floor( 
                        Math.random()*2*hour );
                }
                dfu_log( "Update: timeout is set for : " + 
                    makeUpdateTimeString( timeToResetUpdate ));
                libxEnv.setIntPref( "libx.timeout", 
                    (curdate + timeToResetUpdate ) );
                window.setTimeout( reviveUpdate, timeToResetUpdate );
            }
            else
            {   // timeout is in the future so we just set it for that date
                var timeLeft = nextUpdate - curdate;
                dfu_log( "Update: update is still good and will occure at " + 
                    new Date(nextUpdate) );
                dfu_log( "Update: timeout is set for : " + 
                    makeUpdateTimeString( timeLeft ));
                libxEnv.setIntPref( "libx.timeout", (curdate + timeLeft ) );
                window.setTimeout( reviveUpdate, timeLeft );
            }
        }
    }
    
    return this;
}

libxEnv.doforurls = new libxEnv.doforurlClass();

    libxEnv.addEventHandler(window, "load", 
    function () {
        var ac = document.getElementById("appcontent");
        if (ac) {
            libxEnv.addEventHandler(ac, "DOMContentLoaded", 
                libxEnv.doforurls.onPageComplete_ff, true);
        }
    },
    false);

