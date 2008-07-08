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
 * Contributor(s): Tobias Wieschnowsky (frostyt@vt.edu)
 * Contributor(s): Godmar Back (godmar@gmail.com)
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * doforurl.js
 *
 * Associate an action when the user reaches a given URL, greasemonkey style.
 *
 * Example:
 * function doAmazon(doc) {
 *      // doc is document to be loaded
 *      //alert("you're at amazon");
 * }
 *
 * then place in a cue file
 *
 * new DoForURL(/\.amazon\.com/, doAmazon);
 * Voila!
 *
 * The actual cue files are now sourced as external javascript files.
 * The default set is here:
 * http://libx.cs.vt.edu/libx/src/feeds/root.js
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
    // list of sandbox files read from root.js
    var sandboxScriptList = new Array();
    // list of hotfix files
    this.hotfixList = new Array();
    //the current root to tell cues and such if they should update
    var curroot;
    // Default Root in case no Roots are specified in config.xml
    var defaultRoot = "http://libx.org/libx/src/feeds/root.js";
    // Empty onRootUpdate function so that we don't get an is not a 
    // function error
    this.onRootUpdate = function () { };   

    // resource internal class
    // used for requesting and storing resources
    function resourceClass()
    {
        this.resourceList = new Array();
        var that = this;

        // internal helper for getting resource text
        function getResourceText(url)
        {
            var resource = resourceExists( url );
            if ( resource != false )
            {
                return resource.text;
            }
            return null;
        }

        // internal helper to determine if resource exists
		// returns the resource object if it does
		// false if not
		function resourceExists( url )
		{
			for ( var i = 0; i < that.resourceList.length; i++ )
			{
				if ( that.resourceList[i].url == url )
				{
					return that.resourceList[i];
				}
			}
			return false;
		}
		
		// internal helper for getting a resources chrome url
		function getResourceChrome(url)
		{
			var resource = resourceExists(url);
			if ( resource != false )
			{
				var path = "chrome://libxresource/content/";
				path += libxEnv.fileCache.getFilePath( resource );
				return path;
			}
		}
		
		// Accessor method to a resource
		// method can either be:
		// text	- gets the text content of the resource (for images this might be garbage)
		// chrome	- gets the chrome url of the resouces (can be included in html to get resource)
		this.getResource = function ( url, method )
		{
			if ( !method )
				method = "default";
			switch ( method )
			{
			case "text":
				return getResourceText(url);
			case "chrome":
				return getResourceChrome(url);
			default:
				return getResourceText(url);
			}
		}

    } // End of resources internal class

    // Sets a listener that is called if the root is updated
    this.setRootUpdateListener = function ( func )
    {
        this.onRootUpdate = func;
    }

    // converts a relative url into a absolute url
    function convertRelativeURL( url, baseURL )
    {
        if ( url.match(/^http/) )
        {
            return url;
        }
        return url = baseURL + url;
    }

    // Adds a resource to the list and makes it available to cues for use
	function addResource ( url, ext )
	{
		url = convertRelativeURL ( url, curroot.baseURL );
		if ( ext == ".gif" )
			var contentType = "image/gif";
		var c = { 
			url: url,
			type: "resource",
			ext: ext,
			root: curroot,
			contentType: contentType,
			updating: curroot.updating
		};
		libxEnv.fileCache.getFile( c );
		libxEnv.doforurls.resources.resourceList.push( c );
	}
    
    //Accessor functions
    //This allows IE to access properties and functions that are "private"
    //in this class.  See the iepagecomplete.js file.

    this.getdfu_log = function ()
    {
        return dfu_log;
    }
    this.getdfu_actions = function ()
    {
        return dfu_actions;
    }

    this.getsandboxScriptList = function ()
    {
        return sandboxScriptList;
    }

    this.gethotfixList = function ()
    {
        return gethotfixList;
    }

    this.getcurroot = function ()
    {
        return curroot;
    }
    
    this.getdefaultRoot = function()
    {
        return defaultRoot;
    }

    function convertRelativeURL( url, baseURL )
    {
        if ( url.match(/^http/) )
        {
            return url;
        }
        return url = baseURL + url;
    }
    
    // Adds a cue to the list
    function addCue( url )
    {
        url = convertRelativeURL ( url, curroot.baseURL );  
        var c = {
            url:  url,
            type: "cue",
            root: curroot,
            ext: ".js",
            updating: curroot.updating,
            callback: function () { 
                try {
                    eval( c.text );
                }
                catch ( e )
                {
                    dfu_log( "Error from cue " + c.url + " of type " + c.type +
                        "\n error: " + e );
                }
            }
        };
        libxEnv.fileCache.getFile( c );
    }
    
    // Adds a sandbox script to the list
    function addSandboxScript( url )
    {
        url = convertRelativeURL ( url, curroot.baseURL );
        var c = {
            url: url,
            type: "sandbox",
            root: curroot,
            ext: ".js",
            updating: curroot.updating
        };
        sandboxScriptList.push( c );
        libxEnv.fileCache.getFile( c );
    }
    
    // Adds a hotfix to the list
    function addHotfix( url )
    {
        url = convertRelativeURL( url );
        
        var c = { 
            url: url,
            type: "hotfix",
            root: curroot,
            ext: ".js",
            updating: curroot.updating
        };
        that.hotfixList.push( c );
        libxEnv.fileCache.getFile( c );
    }
    
    // Adds a root to the list and processes its content
    function addRoot( url, updating )
    {
        var c = {
            url: url,
            type: "root",
            baseURL: url.substring(0, url.lastIndexOf("/")+1),
            ext: ".js",
            updating: updating,
            callback: function () {
                try 
                {
                    libxEnv.doforurls.onRootUpdate();
                    curroot = c;
                    eval( c.text );
                }
                catch ( e )
                {
                    dfu_log( "Error from cue " + c.url + " of type " + c.type + 
                        "\n error: " + e );
                }
            }
        };
        libxEnv.fileCache.getFile( c );
    }
    
    // DoForUrl function to create the doforurls and automatically add them to 
    // the dfu_actions list
    // urlpattern ( a reqex )
    // what ( function )
    // exclude ( array<regex> )
    // description ( string )
    this.DoForURL = function (urlpattern, what, exclude, description)
    {
        this.pattern = urlpattern;
        this.action = what;

        //This is a string version of action (and can be used in an eval call)
        this.actionText = "(" + what + ")";

        this.exclude = exclude;
        this.description = 
            description ? description : "No description available";
        this.aidx = dfu_actions.push(this);
    }
    
    // runs through all the doforurls once a new page is loaded (FF version)
    // For IE, see the file iepagecomplete.js
    this.onPageComplete_ff = function(ev)
    {
        if (!ev || !ev.originalTarget) return;
        
        var win = ev.explicitOriginalTarget.defaultView;
        var doc = win.document;
        if (ev.originalTarget.location == 'about:blank')
                return;     
                
        var sandbox = libxEnv.sandbox.createSandbox( win, 
            ev.originalTarget.location.href );
        for ( var l = 0; l < sandboxScriptList.length; l++ )
        {
            try {
                libxEnv.sandbox.evaluateInSandbox( 
                    sandboxScriptList[l].text, sandbox );
            }
            catch(f)
            {
                dfu_log(" sandboxScript " +sandboxScriptList[l].url + " " + f );
            }
        }
                
    outer:
        for (var i = 0; i < dfu_actions.length; i++) {
            var dfu = dfu_actions[i];
            var match;
            if (match = ev.originalTarget.location.href.match(dfu.pattern)) {
                var exclude = dfu.exclude;
                if (exclude) {
                    for (var j = 0; j < exclude.length; j++)
                        if (ev.originalTarget.location.href.match(exclude[j]))
                            continue outer;
                }

                try {
    /* NB: dfu.action is already defined in chrome space.  We'd like to do:
     * sandbox.action = function () {
     *   dfu.action(this.document, match);
     * }
     * and then evaluate 'this.action()'.  However, evaluating
     * a chrome function within the sandbox switches the global object to 
     * the chrome global object, hiding all properties added by the
     * (untrusted) sandbox code (such as jQuery's $ included earlier.)
     *
     * Therefore, we must convert the function back to a string and
     * evaluate that string in the box, as shown below.
     */
                    sandbox.match = match;
                    var func = "(" + dfu.action + 
                        ")(this.document, this.match);";              
                    libxEnv.sandbox.evaluateInSandbox( func , sandbox);
                } catch (e) { 
                    dfu_log(" action: " + dfu.description + " caused error " +
                        e.message);
                }
            }
        }
    }

    // loads and initializes the roots 
    // if updating parameter is specified instead of initializing we attempt to 
    // update the roots
    function initRoots( updating )
    {
        if ( libxEnv.xmlDoc.xml )
        {
            var rootsInXML = libxEnv.xpath.findNodesXML( libxEnv.xmlDoc.xml,
                "/edition/localizationfeeds/feed" );
            var count = 0;
            if ( rootsInXML )
            {
                for (var i = 0; i < rootsInXML.length; i++ )
                {
                    addRoot(rootsInXML[i].getAttribute( "url" ), updating );
                    count++;
                }
            }
            else
            {
                dfu_log( "Did not find any roots specified in config.xml " + 
                    "switching to default" );
            }
        }
        else
        {   
            dfu_log( "Could not access libxEnv.xmlDoc.xml!" );
        }
        if ( count == 0 ) 
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
            var rootsInXML = libxEnv.xpath.findNodesXML( libxEnv.xmlDoc.xml, 
                "/edition/localizationfeeds/feed" );
            if ( rootsInXML )
            {
                for ( var i = 0; i < rootsInXML.length; i++ )
                {
                    var url = rootsInXML[i].getAttribute( "url" );
                    rootInfo.push(
                    {
                        url : url,
                        desc: rootsInXML[i].getAttribute( "description" ),
                        lastMod: libxEnv.fileCache.getLastModifiedDate( url )
                    } );
                }
            }
        }
        if ( rootInfo.length == 0 )
        { 
            rootInfo.push(
            {
                url: defaultRoot,
                desc: "Default Root",
                lastMod: libxEnv.fileCache.getLastModifiedDate( defaultRoot )
            });
        }
        return rootInfo;
    }
    
    // Helper function for init and updateDoforurls
    function processDoforurls( updating )
    {
        sandboxScriptList = new Array();
        this.hotfixList = new Array();
        dfu_actions = new Array();
        initRoots( updating );
    }

    
    // initializes the doforurls by reading them from file and adding them to 
    // the cueList.
    this.initDoforurls = function () 
    {
        this.resources = new resourceClass();
        processDoforurls( false );
        libxEnv.fileCache.saveFileList();
        that.setUpdateTimeOut( false );
    }
    
    
    // updates all the doforurls with the most current version found online
    this.updateDoforurls = function () 
    {   
        dfu_log( "Updating Cues" );
        var curdate = Date();
        updating = true;
        setNextUpdatePref( Date.parse(curdate) + 24*hour);
        processDoforurls( true );
        dfu_log( "Done Updating Cues" );
    }

    
    // This function is called by the timeout we set and is used to revive the 
    // update process
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
    
    // Converts the updateTime into a nice string that we can print out for 
    // debugging
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
    
    // sets the preference in about:config for next update
    function setNextUpdatePref( value )
    {
        libxEnv.setUnicharPref( "libx.nextupdate" , value );
    }
    
    // gets the about:config value of next update
    function getNextUpdatePref()
    {
        var temp = libxEnv.getUnicharPref( "libx.nextupdate" );
        return parseFloat( temp );
    }
    
    // sets the about:config prefs value for the timeout
    function setTimeoutPref( value )
    {
        libxEnv.setUnicharPref( "libx.timeout" , value );
    }
    
    //gets the about:config prefs value for the timeout
    function getTimeoutPref()
    {
        var temp = libxEnv.getUnicharPref( "libx.timeout" );
        return parseFloat( temp );
    }
    
    // Sets the timeout for the update and if needed the nextUpdate preference
    //  in about:config
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
                
                dfu_log( "Update: update is still good and will occur at " + 
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

// vim: ts=4
