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

libx.scripts = { };
libx.scripts.DoForUrl = ( function () {

    //  logging functions for errors within this class
    function dfuLog( msg ) 
    {
        libx.log.write( msg, 'doforurl');
    }
    
    // variables for the update functions
    var sec = 1000;
    var minute = 60*sec;
    var hour = 60*minute;
    var day = 24*hour;
    
    var that = this;                        // reference to this 
    var dfuActions = new Array();          // list of doforurl actions 
    var sandboxScriptList = new Array();    // list of sandbox files read from
                                            // root.js
    
    var curroot;                            // the current root to tell cues and
                                            // such if they should update
    
    // Default Root in case no Roots are specified in config.xml
    //var defaultRoot = "http://top.cs.vt.edu/~aikhokar/feeds/root.js";
    var defaultRoot = "http://libx.org/libx/src/feeds/root.js";

    //currently not used.  Not working due to fileCache refactoring
    var resourceClass = ( function () {

        /** 
         * internal helper for getting resource text
         *
         * @param {Object} thisObj reference to class object that invokes this
         *                         function
         * @param {String} url     location of resource
         *
         * @returns {String | Object } contents of the resource if it exists,
         *                             otherwise null
         */
        function getResourceText(thisObj, url)
        {
            var resource = resourceExists( thisObj, url );
            if ( resource != false )
            {
                return resource.text;
            }
            return null;
        }

        /** 
         * internal helper to determine if resource exists returns the resource
         * object if it does false if not
         *
         * @param {Object} thisObj reference to class object that invokes this
         *                         function
         * @param {String} url     location of resource
         *
         * @returns {String | Object } contents of the resource if it exists,
         *                             otherwise null
         */
		function resourceExists( thisObj, url )
		{
			for ( var i = 0; i < thisObj.resourceList.length; i++ )
			{
				if ( thisObj.resourceList[i].url == url )
				{
					return thisObj.resourceList[i];
				}
			}
			return false;
		}

        /** 
         * internal helper for getting a resources chrome url
         *
         * @param {Object} thisObj reference to class object that invokes this
         *                         function
         * @param {String} url     location of resource
         *
         * @returns {String | Object } contents of the resource if it exists,
         *                             otherwise null
         */
		function getResourceChrome(thisObj, url)
		{
			var resource = resourceExists(thisObj, url);
			if ( resource != false )
			{
				var path = "chrome://libxresource/content/";
                //TODO: fix this
				//path += libx.cache.fileCache.getFilePath( resource );
				return path;
			}
		}

        /**
         * Internal class to manage requesting and storing resources
         */
        var internalResourceClass = libx.core.Class.create( {

            /**
             * Sets up resource array
             */
            initialize : function ()
            {
                this.resourceList = new Array();
            },

            /** 
             *  Accessor method to a resource
             *
             *  @param {String} url    location of resource
             *  @param {String} method either chrome or text 
             *
             *                         text will get the text content of the
             *                         resource (for images, this might be
             *                         garbage)
             *
             *                         chrome will get the chrome url of the
             *                         resource (can be included in html to get
             *                         resource)
             */
            getResource : function ( url, method )
            {
                if ( !method )
                    method = "default";
                switch ( method )
                {
                case "text":
                    return getResourceText(this, url);
                case "chrome":
                    return getResourceChrome(this, url);
                default:
                    return getResourceText(this, url);
                }
            } 
        } );

        return internalResourceClass;

    } )(); // End of resources internal class

    /** 
     * converts a relative url into a absolute url
     *
     * @param {String} url url to convert
     * @param {String} baseURL protcol?
     */
    function convertRelativeURL( url, baseURL )
    {
        if ( url.match(/^http/) )
        {
            return url;
        }
        return url = baseURL + url;
    }

    /**
     * NOT WORKING.
     * Adds a resource to the list and makes it available to cues for use
     *
     * @param {String} url location of resource
     * @param {String} ext file extension of resource
     */
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
		//libxEnv.fileCache.getFile( c );
		//libxEnv.doforurls.resources.resourceList.push( c );
		//libx.scripts.doforurls.resources.resourceList.push( fileParam );
	}

    /**
     * Adds a cue to the list
     *
     * @param {String} url location of code
     */
    function addCue( url )
    {
        url = convertRelativeURL ( url, curroot.baseURL );  

        var fileParam = {
            url : url,
            success : function (path) {
                //libx.log.write("success: doforurl cue status for url " + this.url);
                var text = libx.io.getFileText(path);

                //Eval text here (since cues don't work, leaving statment commented out)
                //eval(text);
            },
            error : function (url, stat) {
                libx.log.write("error: doforurl cue status for url " + this.url);
            },
            dataType : "text"
        };
        libx.cache.fileCache.get(fileParam);
    }

    /**
     * Adds a sandbox script to the list
     *
     * @param {String} url location of code
     */
    function addSandboxScript( url )
    {
        url = convertRelativeURL ( url, curroot.baseURL );

        //Create a new file cache object here:
        var fileParam = {
            url : url,
            success : function (path) {
                var text = libx.io.getFileText(path);

                //Commented out for now
                //eval(text);
            },
            error   : function (url, stat) {
                libx.log.write("sandbox script: did not find url " + url + ", status " + stat);
            },
            dataType : "text"
        };

        libx.cache.fileCache.get(fileParam);

        sandboxScriptList.push( fileParam );
    }
    
    /**
     * Adds a hotfix to the list
     *
     * @param {String} url location of code
     */
    function addHotfix( url )
    {
        url = convertRelativeURL( url );
        
        var fileParam = {
            url : url,
            success : function (path) {
                var text = libx.io.getFileText(path);

                //Commented out for now
                //eval(text);
            },
            error : function (url, stat) {
                libx.log.write("hotfix: did not find url " + url + ", status " + stat);
            },
            dataType : "text"
        };

        //The hotfix list needs to be available to chrome code, so we use
        //the DoForUrls class to hold the list and invoke addToHotfixList to
        //add hotfixes from feed code

        //TODO: change libxEnv.doforurls to libx.scripts.doforurl
        //libx.scripts.doforurl.addToHotfixList(fileParam);

        libx.scripts.doforurls.addToHotfixList( c );
        libx.cache.fileCache.get(fileParam);
    }
    
    /**
     * Adds a root to the list and processes its content
     *
     * @param {String} url       location of code
     * @param {Boolean} updating whether to update root
     */
    function addRoot( url, updating )
    {
        var fileParam {
            url : url,
            success : function (path) {
                var text = libx.io.getFileText(path);

                //Execute root file
                try {
                eval(text);
                }
                catch (e) {
                    dfuLog("Error when evaluating feeds " + e);
                }
            },
            error : function (url, stat) {
                libx.log.write("root: did not find url " + url + ", status " + stat);
            },
            dataType : "text"
        };

        //TODO: change libxEnv.fileCache to libx.cache.FileCache
        //libxEnv.fileCache.getFile( c );
        libx.cache.fileCache.get( fileParam );
    }

    /**
     * loads and initializes the roots if updating parameter is specified
     * instead of initializing we attempt to update the roots
     *
     * @param {Boolean} updating whether to update rather than initialize the
     *                           root
     */
    function initRoots( updating )
    {
        //XXX: feeds info is not being read from config.xml
        var count = 0;
        var feeds = libx.edition.localizationfeeds;

        if ( feeds != null )
        {
            for (var i = 0; i < feeds.length; i++ ) {
                addRoot(feeds[i].url, updating );
                count++;
            }
        }
        else
        {   
            dfuLog( "Did not find localization feeds in libx.edition.localizationfeeds" );
        }

        if ( count == 0 ) 
        {
            addRoot( defaultRoot, updating );
        }
    }

    /**
     * Helper function for init and updateDoforurls
     *
     * @param {Boolean} updating whether to update rather than initialize the
     *                           roots
     */
    function processDoforurls( updating )
    {
        sandboxScriptList = new Array();
        hotfixList = new Array();
        dfuActions = new Array();
        initRoots( updating );
    }

    /**
     * This function is called by the timeout we set and is used to revive the 
     * update process
     *
     * @param {Object} thisObj reference to class object that calls this
     *                         function
     */
    function reviveUpdate( thisObj )
    {
        var curdate  = Date();
        var timeout = getTimeoutPref();
        var timeDifference = Date.parse(curdate) - timeout;
        
        if ( timeDifference >= 0 )
        {
            if ( timeDifference < hour )
            { // we woke up around the right time
            
                dfuLog( "Updating NOW!" );
                
                //that.updateDoforurls();
                //that.setUpdateTimeOut( true );
                libx.scripts.doforurls.updateDoforurls();
                libx.scripts.doforurls.setUpdateTimeOut( true );
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
                
                dfuLog( "Update: timeout is set for : " + timeToResetUpdate );
                //    makeUpdateTimeString( timeToResetUpdate ));
                
                setTimeoutPref( Date.parse(curdate) + timeToResetUpdate );
                setTimeout( reviveUpdate, timeToResetUpdate + sec*15 );
            }
        }
    }

    /** 
     * Converts the updateTime into a nice string that we can print out for 
     * debugging
     *
     * @param {Number} updateTime
     *
     * @returns {String} formatted time string
     */
    function makeUpdateTimeString ( updateTime )
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
    
    /**
     * sets the preference in about:config for next update
     *
     * @param {String} value value for next update time
     */
    function setNextUpdatePref( value )
    {
        //libxEnv.setUnicharPref( "libx.nextupdate" , value );
    }
    
    /**
     * gets the about:config value of next update
     */
    function getNextUpdatePref()
    {
        //var temp = libxEnv.getUnicharPref( "libx.nextupdate" );
        //return parseFloat( temp );
    }
    
    /** 
     * sets the about:config prefs value for the timeout
     *
     * @param {String} value value for timeout
     */
    function setTimeoutPref( value )
    {
        //libxEnv.setUnicharPref( "libx.timeout" , value );
    }
    
    /** 
     * gets the about:config prefs value for the timeout
     */
    function getTimeoutPref()
    {
        //var temp = libxEnv.getUnicharPref( "libx.timeout" );
        //return parseFloat( temp );
    }
    

    /**
     * Class that handles parsing feed code.  It deals with hotfixes (that
     * modify core code prior to execution, sandbox scripts (scripts that run
     * in a limited privilege environment, and cues (scripts that run on
     * certain pages)
     *
     * @name libx.scripts.DoForUrl
     * @class
     */
    var doForUrlClass = libx.core.Class.create (
    {
        /**
         * Sets up hotfixList
         */
        initialize : function ()
        {
            this.hotfixList = new Array();
            this.onRootUpdate = function () { };
        },

        /** 
         * Retrieves the information of the roots for the prefs menu
         * TODO: determine where this function should reside
         */
        //getRootInfo : function()
        //{
        //    var rootInfo = new Array();
        //    var feeds = libx.edition.localizationfeeds;
        //    if ( feeds != null )
        //    {
        //        for ( var i = 0; i < feeds.length; i++ )
        //        {
        //            var url = feeds[i].url;
        //            rootInfo.push(
        //            {
        //                url : url,
        //                desc: feeds[i].description,
        //                lastMod: libx.cache.fileCache.getLastModifiedDate( url )
        //            } );
        //        }
        //    }
        //    if ( rootInfo.length == 0 )
        //    { 
        //        rootInfo.push(
        //        {
        //            url: defaultRoot,
        //            desc: "Default Root",
        //            lastMod: libxEnv.fileCache.getLastModifiedDate( defaultRoot )
        //        });
        //    }
        //    return rootInfo;
        //},
        
        /** 
         * initializes the doforurls by reading them from file and adding them
         * to the cueList.
         */
        initDoforurls : function () 
        {
            this.resources = new resourceClass();
            processDoforurls( false );
            libx.cache.fileCache.saveFileList();
            //that.setUpdateTimeOut( false );
            //this.setUpdateTimeOut( false );
        },
        
        /** 
         * updates all the doforurls with the most current version found online
         * XXX: moved to file cache
         */
        //updateDoforurls : function () 
        //{   
        //    dfuLog( "Updating Cues" );
        //    var curdate = Date();
        //    updating = true;
        //    //setNextUpdatePref( Date.parse(curdate) + 24*hour);
        //    processDoforurls( true );
        //    dfuLog( "Done Updating Cues" );
        //},

        /** 
         * Sets the timeout for the update and if needed the nextUpdate
         * preference in about:config
         *
         * @param {Boolean} setNew  used to set a new update time immediately
         *
         * XXX : moved to file cache
         */
        //setUpdateTimeOut : function ( setNew )
        //{
        //    var nextUpdate = getNextUpdatePref();
        //    if ( !nextUpdate || setNew )
        //    {
        //        dfuLog( "Update: Next Update has not been set, setting it now " );
        //        var curdate = Date();
        //        var update = Math.floor( Math.random()*day );
        //        
        //        dfuLog( "Update: current date is " + curdate + 
        //            " setting update for " + new Date(
        //            Date.parse(curdate) + update) );            
        //        setNextUpdatePref( Date.parse(curdate) + update );
        //        var x = getNextUpdatePref();
        //            
        //        dfuLog( "Update: timeout is set for : " + 
        //            makeUpdateTimeString( update ));
        //        
        //        setTimeoutPref( Date.parse(curdate) + update );
        //        libxChromeWindow.setTimeout ( reviveUpdate, update );
        //    }
        //    else
        //    {
        //        var curdate = Date.parse(Date());
        //        
        //        dfuLog( "Update: current date " + new Date(curdate) );
        //        dfuLog( "Update: next update will be " + new Date( nextUpdate ));
        //        
        //        if ( curdate > nextUpdate )
        //        {   // set timeout missed its update somehow reseting
        //            var timeSinceUpdateTarget = curdate - nextUpdate;
        //            
        //            var timeToResetUpdate = Math.floor((
        //                6*hour/timeSinceUpdateTarget)*hour*Math.random());
        //            if ( timeToResetUpdate > 6*hour )
        //            {
        //                timeToResetUpdate = 4*hour + Math.floor( 
        //                    Math.random()*2*hour );
        //            }
        //            
        //            dfuLog( "Update: timeout is set for : " + 
        //                makeUpdateTimeString( timeToResetUpdate ));
        //            
        //            setTimeoutPref( curdate + timeToResetUpdate );
        //            
        //            libxChromeWindow.setTimeout( reviveUpdate, timeToResetUpdate );
        //        }
        //        else
        //        {   // timeout is in the future so we just set it for that date
        //            var timeLeft = nextUpdate - curdate;
        //            
        //            dfuLog( "Update: update is still good and will occur at " + 
        //                new Date(nextUpdate) );
        //            dfuLog( "Update: timeout is set for : " + 
        //                makeUpdateTimeString( timeLeft ));
        //                
        //            setTimeoutPref( curdate + timeLeft );
        //            
        //            libxChromeWindow.setTimeout( reviveUpdate, timeLeft );
        //        }
        //    }
        //},

        /**
         * Adds a hotfix code object (@see @libx.cache.FileCache for
         * the object structure) to the list of hotfixes
         *
         * @param {Object} hotfixObj object to add to list
         */
        addToHotfixList : function ( hotfixObj )
        {
            this.hotfixList.push( hotfixObj );
        },

        /** 
         * Sets a listener that is called if the root is updated
         *
         * @param {Function} func function to assign to onRootUpdate member
         */
        setRootUpdateListener : function ( func )
        {
            this.onRootUpdate = func;
        },
        
        /** 
         * DoForUrl function to create the doforurls and automatically add them to 
         * the dfuActions list
         *
         * @param {RegEx}          urlpattern  pattern used to filter url
         * @param {Function}       what        function to execute
         * @param {Array of RegEx} exclude     patterns used to prevent execution
         * @param {String}         description description of cue
         *
         * //TODO: update capitalization and callsites in feed code
         */
        DoForURL : function (urlpattern, what, exclude, description)
        {
            this.pattern = urlpattern;
            this.action = what;

            //This is a string version of action (and can be used in an eval call)
            this.actionText = "(" + what + ")";

            this.exclude = exclude;
            this.description = 
                description ? description : "No description available";
            this.aidx = dfuActions.push(this);
        },
        
        /** 
         * TODO: need to fix to work with file cache
         * runs through all the doforurls once a new page is loaded (FF version)
         * For IE, see the file iepagecomplete.js
         *
         * @param {Event} ev event object used to get information including the window
         *                   object associated with the event, and url location
         */ 
        onPageComplete_ff : function(ev)
        //{
        //    if (!ev || !ev.originalTarget || !ev.originalTarget.location) return;
        //    
        //    var win = ev.explicitOriginalTarget.defaultView;
        //    if (!win || ev.originalTarget.location == 'about:blank')
        //            return;     
        //    var doc = win.document;
        //    
        //    if ( win.frameElement != null && win.frameElement.style.visibility == "hidden" ) 
        //        return;
        //            
        //    var sandbox = libxEnv.sandbox.createSandbox( win, ev.originalTarget.location.href );

        //    for ( var l = 0; l < sandboxScriptList.length; l++ )
        //    {
        //        try {
        //            libxEnv.sandbox.evaluateInSandbox( 
        //                sandboxScriptList[l].text, sandbox );
        //        }
        //        catch(f)
        //        {
        //            dfuLog(" sandboxScript " +sandboxScriptList[l].url + " " + f );
        //        }
        //    }

        //    //Try some tests of the document request cache here:
        //    //Add first thing to cache
        //    //libxEnv.xisbn.getISBNMetadataAsText("9780060731327",
        //    //        { 
        //    //            ifFound : function (text) {
        //    //                alert("ifFound text for 9780060731328 : " + text);
        //    //            },

        //    //            notFound : function (toRemove) {
        //    //                alert("notFound text for 9780060731327");
        //    //                libxEnv.xisbn.xisbncache.removeFromCache(toRemove);
        //    //            }
        //    //        });
        //    //libxEnv.crossref.getDOIMetadataAsText("10.1103/PhysRevf.66.063511",
        //    //        { ifFound : function (text) {
        //    //              alert("ifFound text for 10.1103/PhysRevD.66.063511 : " + text);
        //    //          },
        //    //          notFound : function (toRemove) {
        //    //              alert("notFound text for 10.1103/PhysRevf.66.063511");
        //    //              libxEnv.crossref.doicache.removeFromCache(toRemove);
        //    //          }
        //    //        });

        //    //Add first thing to cache
        //    //libxEnv.pubmed.getPubmedMetadataAsText(16646082,
        //    //        { ifFound : function (text) {
        //    //        alert("ifFound text for 16646082 : " + text);
        //    //        }
        //    //        });

        //    ////Add second thing to cache
        //    //libxEnv.pubmed.getPubmedMetadataAsText(99999999,
        //    //        { 
        //    //            ifFound : function (text) {
        //    //                alert("ifFound text for 19137428 : " + text);
        //    //            },

        //    //            notFound : function (toRemove) {
        //    //                alert("notFound text for 99999999");
        //    //                libx.cache.memorycache.removeFromCache(toRemove);
        //    //            }
        //    //        });

        //    ////Try readding first thing to cache
        //    //libxEnv.pubmed.getPubmedMetadataAsText(16646082,
        //    //        { ifFound : function (text) {
        //    //        alert("ifFound text for 16646082 (again) : " + text);
        //    //        }
        //    //        });

        //    ////Add last thing to cache
        //    //libxEnv.pubmed.getPubmedMetadataAsText(19137380,
        //    //        { ifFound : function (text) {
        //    //        alert("ifFound text 19137380 : " + text);
        //    //        }
        //    //        });

        //    ////Try adding to a full cache
        //    //libxEnv.pubmed.getPubmedMetadataAsText(19137368,
        //    //        { ifFound : function (text) {
        //    //        alert("ifFound text 19137368 : " + text);
        //    //        }
        //    //        });

        //    //See if we try to retrieve same result from cache
        //    //libxEnv.pubmed.getPubmedMetadataAsText(16646082,
        //    //        { ifFound : function (text) {
        //    //        alert("ifFound text : " + text);
        //    //        }
        //    //        });
        //            
        //outer:
        //    for (var i = 0; i < dfuActions.length; i++) {
        //        var dfu = dfuActions[i];
        //        var match;
        //        if (match = ev.originalTarget.location.href.match(dfu.pattern)) {
        //            var exclude = dfu.exclude;
        //            if (exclude) {
        //                for (var j = 0; j < exclude.length; j++)
        //                    if (ev.originalTarget.location.href.match(exclude[j]))
        //                        continue outer;
        //            }

        //            try {
        ///* NB: dfu.action is already defined in chrome space.  We'd like to do:
        // * sandbox.action = function () {
        // *   dfu.action(this.document, match);
        // * }
        // * and then evaluate 'this.action()'.  However, evaluating
        // * a chrome function within the sandbox switches the global object to 
        // * the chrome global object, hiding all properties added by the
        // * (untrusted) sandbox code (such as jQuery's $ included earlier.)
        // *
        // * Therefore, we must convert the function back to a string and
        // * evaluate that string in the box, as shown below.
        // */
        //                sandbox.match = match;
        //                var func = "(" + dfu.action + 
        //                    ")(this.document, this.match);";              
        //                libxEnv.sandbox.evaluateInSandbox( func , sandbox);
        //            } catch (e) { 
        //                dfuLog(" action: " + dfu.description + " caused error " +
        //                    e.message);
        //            }
        //        }
        //    }
        //},

        //Accessor functions
        //This allows IE to access properties and functions that are "private"
        //in this class.  See the iepagecomplete.js file.

        /**
         * Returns the dfuLog object
         */
        getdfuLog : function ()
        {
            return dfuLog;
        },

        /**
         * Returns the dfuActions list
         */
        getdfuActions : function ()
        {
            return dfuActions;
        },

        /**
         * Returns the sandbox script list
         */
        getsandboxScriptList : function ()
        {
            return sandboxScriptList;
        },

        /**
         * returns the hotfixList
         */
        gethotfixList : function ()
        {
            return this.hotfixList;
        },

        /**
         * returns the current root location
         */
        getcurroot : function ()
        {
            return curroot;
        },
        
        /**
         * returns the default root location
         */
        getdefaultRoot : function()
        {
            return defaultRoot;
        }
    });

    return doForUrlClass;
    
})();

// creates a new doforurlClass object to attach to libxEnv
//libxEnv.doforurls = new libx.scripts.DoForUrl();
libx.scripts = { };
libx.scripts.doforurls = new libx.scripts.DoForUrl();

// vim: ts=4

