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
 *      //alert("you're at amazon");
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
    
    // variables for the update functions
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
    // Default Root in case no Roots are specified in config.xml
	var defaultRoot = "http://libx.org/libx/src/feeds/root.js";
	
	// Cue Object
    var cue = function ( url, type )
    {
        this.url = url;
        this.type = type;
        this.text = null;
    }
    
	function isRelativeURL( url )
	{
		if ( url.match(/http/) )
			return false;
		return true;
	}
	
    // Adds a cue to the list
    function addCue( url )
    {
		if ( isRelativeURL ( url ) )
		{
			url = curroot.baseURL + url;
		}
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
    
	// Adds a sandbox script to the list
    function addSandboxScript( url )
    {
		if ( isRelativeURL ( url ) )
		{
			url = curroot.baseURL + url;
		}
        var c = new cue( url , "sandbox", curroot );
        sandboxScriptList.push( c );
        if ( curroot.updating == true )
            libxEnv.fileCache.updateCue( c );
        else
            libxEnv.fileCache.getCue( c );
    }
    
	// Adds a hotfix to the list
    function addHotfix( url )
    {
		if ( isRelativeURL ( url ) )
		{
			url = curroot.baseURL + url;
		}
        var c = new cue( url, "hotfix", curroot );
        that.hotfixList.push( c );
        if ( curroot.updating == true )
            libxEnv.fileCache.updateCue( c );
        else
            libxEnv.fileCache.getCue( c );
    }
    
	// Adds a root to the list and processes its content
    function addRoot( url, updating )
    {
        var c = new cue( url, "root" );
		c.baseURL = c.url.substring(0,c.url.lastIndexOf("/")+1);
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
    
	// runs through all the doforurls once a new page is loaded ( IE version)
    this.onPageComplete_ie = function(doc, location)
    {
        if (!doc) return;

        if (location == 'about:blank')
                return;
	
		for ( var l = 0; l < sandboxScriptList.length; l++ )
		{
			eval( sandboxScriptList[l].text );
		} 
				
				
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
                    dfu.action(doc, m);
                } catch (e) { 
                    dfu_log(e.message);
                }
            }
        }
    
    }
    
    
    // runs through all the doforurls once a new page is loaded (FF version)
    this.onPageComplete_ff = function(ev)
    {
        if (!ev) return;
        
        var win = ev.explicitOriginalTarget.defaultView;
        var doc = win.document;
        if (ev.originalTarget.location == 'about:blank')
                return;     
                
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
					libxEnv.sandbox.evaluateInSandbox( func , sandbox);
                } catch (e) { 
                    dfu_log(" sandbox " + e);
                }
            }
        }
    }

	// loads and initializes the roots 
	// if updating parameter is specified instead of initializing we attempt to update the roots
    function initRoots( updating )
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
		if ( rootList.length == 0 ) 
        {
            addRoot( defaultRoot, updating );
        }
    }
    
	// Retrieves the information of the roots for the prefs menu
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
            temp.url = defaultRoot;
            temp.lastMod = libxEnv.fileCache.getLastModifiedDate( temp.url );
            rootInfo.push( temp );
        }
        return rootInfo;
    }
    
	// Helper function for init and updateDoforurls
	function processDoforurls( updating )
	{
		rootList = new Array();
		this.cueList = new Array();
		sandboxScriptList = new Array();
		this.hotfixList = new Array();
		initRoots( updating );
	}

	
    // initializes the doforurls by reading them from file and adding them to 
    // the cueList.
    this.initDoforurls = function () 
    {
		processDoforurls( false );
        libxEnv.fileCache.saveFileList();
        that.setUpdateTimeOut( false );
    }
	
	
    // updates all the doforurls with the most current version found online
    this.updateDoforurls = function () 
    {   // think about detecting failure to update and then not setting new update date
        dfu_log( "Updating Cues" );
        var curdate = Date();
        updating = true;
		setNextUpdatePref( Date.parse(curdate) + 24*hour);
		processDoforurls( true );
        dfu_log( "Done Updating Cues" );
    }

    
	// This function is called by the timeout we set and is used to revive the update process
    function reviveUpdate()
	{
        var curdate  = Date();
		var timeout = getTimeoutPref();
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
				var update = getNextUpdatePref();
                timeDifference = Date.parse(curdate) - update;
                var timeToResetUpdate = Math.floor(((6*hour/timeDifference)*
                    hour*Math.random()));
                if ( timeToResetUpdate > 6*hour )
                {
                    timeToResetUpdate = 4*hour + Math.floor( 
                        Math.random()*2*hour );
                }
				
                dfu_log( "Update: timeout is set for : " + timeToResetUpdate );
                //    makeUpdateTimeString( timeToResetUpdate ));
				
				setTimeoutPref( Date.parse(curdate) + timeToResetUpdate );
                setTimeout( reviveUpdate, timeToResetUpdate + sec*15 );
            }
        }
    }
    
	// Converts the updateTime into a nice string that we can print out for debugging
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
    
	function setNextUpdatePref( value )
	{
		libxEnv.setUnicharPref( "libx.nextupdate" , value );
	}
	
	function getNextUpdatePref()
	{
		var temp = libxEnv.getUnicharPref( "libx.nextupdate" );
		return parseFloat( temp );
	}
	
	function setTimeoutPref( value )
	{
		libxEnv.setUnicharPref( "libx.timeout" , value );
	}
	
	function getTimeoutPref()
	{
		var temp = libxEnv.getUnicharPref( "libx.timeout" );
		return parseFloat( temp );
	}
	
	// Sets the timeout for the update and if needed the nextUpdate preference in about:config
    this.setUpdateTimeOut = function ( setNew )
    {
        var nextUpdate = getNextUpdatePref();
        if ( !nextUpdate || setNew )
        {
            dfu_log( "Update: Next Update has not been set, setting it now " );
            var curdate = Date();
            var update = Math.floor( Math.random()*day );
			
            dfu_log( "Update: current date is " + curdate + 
                " setting update for " + new Date(
                Date.parse(curdate) + update) );			
			setNextUpdatePref( Date.parse(curdate) + update );
			var x = getNextUpdatePref();
				
            dfu_log( "Update: timeout is set for : " + 
                makeUpdateTimeString( update ));
			
			setTimeoutPref( Date.parse(curdate) + update );
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
				
				setTimeoutPref( curdate + timeToResetUpdate );
				
                window.setTimeout( reviveUpdate, timeToResetUpdate );
            }
            else
            {   // timeout is in the future so we just set it for that date
                var timeLeft = nextUpdate - curdate;
				
                dfu_log( "Update: update is still good and will occure at " + 
                    new Date(nextUpdate) );
                dfu_log( "Update: timeout is set for : " + 
                    makeUpdateTimeString( timeLeft ));
					
				setTimeoutPref( curdate + timeLeft );
				
                window.setTimeout( reviveUpdate, timeLeft );
            }
        }
    }
    
    return this;
}

// creates a new doforurlClass object to attach to libxEnv
libxEnv.doforurls = new libxEnv.doforurlClass();
