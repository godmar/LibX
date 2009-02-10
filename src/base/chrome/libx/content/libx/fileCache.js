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
 * Contributor(s): Arif Khokar (aikhokar@cs.vt.edu)
 *
 * ***** END LICENSE BLOCK ***** */
 
 //*****************************************
 // File Manager Class
 // This class manages the downloading and storing of the doforurl files
 //******************************************

libx.cache.FileCache = ( function () {

    //These variables will be captured through closure by the class functions

    // List of files maintaned for debuging purposes
    var fileList = new Object();
    var oldFileList = new Object();
    var jsFileEnding = ".js";
    var optionFileEnding = "options.js";
    var nextUpdateFile = "update.txt";
    var fileListFile = "filelist.txt";
    var pathPattern = "0123456789AB/0123456789AB/0123456789AB";
    var firstSlashPos = pathPattern.indexOf("/");
    var secondSlashPos = pathPattern.lastIndexOf("/");
    var segmentLength = (pathPattern.length - 2)/3;

    //Time variables
    var sec = 1000;
    var minute = 60*sec;
    var hour = 60*minute;
    var day = 24*hour;

    /**
     * Logging function for this class
     *
     * @param {String} message to log
     */
    function storageLog ( msg )
    {
        libx.log.write(msg, 'fileStorage');
    };
	

    /** 
     * reads the option file from the hdd and returns the content
     *
     * @param {String} url path to file
     */
    function readOptionsFile ( url )
    {
        var path = getHashedOptionPath( url );
        return libx.io.getFileText( getHashedOptionPath( url ) );
    };


    /**
     * Returns last modified date
     *
     * @param {String}   url path to file
     * @returns {String} date that file was last modified
     */
    function privGetLastModifiedDate ( url )
    {
        var lastMod = "";
        var optFile = readOptionsFile(url);
        eval(optFile);
        return lastMod;
    };

    
    /**
     * calculates the sha1 path associated with the url (without file ending)
     *
     * @param {String} url path to the file
     */
    function calculateHashedPath ( url ) 
    {
        var unprocessedPath = libx.bd.hash.hashString( url );
        var path = unprocessedPath.substring( 0 , firstSlashPos );
        path += "/" + unprocessedPath.substring( firstSlashPos, 
            secondSlashPos-1);
        path += "/" + unprocessedPath.substring( secondSlashPos-1, 
            pathPattern.length-2 );
        return path;
    }

    /** 
     * writes text to the file
     *
     * @param {String} url network location of file
     * @param {String} text text to write to file
     */
    function writeFile ( url , text ) 
    {
       var path = calculateHashedPath ( url );
       path += jsFileEnding;
       libx.io.writeToFile( path, text, true );
    }

    /** 
     * writes text to the options file
     *
     * @param {String} url path to file
     * @param {String} text text to write to file
     */
    function writeOptionsFile ( url, text ) 
    {
        var path = getOptionFileLocation(url);
        libx.io.writeToFile( path, text, true);
    }

    /**
     * writes the last modified date in lastMod to the options file 
     * assoicated with url
     *
     * @param {String} url path to file
     * @param {String} date to write to file
     */
    function setLastModifiedDate ( url, lastMod )
    {
        lastMod = "lastMod = '" + lastMod + "';";
        writeOptionsFile( url, lastMod );
    }

    /**
     * Duplicated by getOptionFileLocation, DISCARD THIS FUNCTION
     *
     * called by writeOptionsFile which is called by setLastModifiedDate
     *
     * Returns the hashed path of the options file associated with the given
     * url
     *
     * @param {String} url path to the file
     */
    function getHashedOptionPath ( url )
    {
        var path = calculateHashedPath(url);

        //Append the extension to it
        path += optionFileEnding;

		return path;
    };

    /**
     * Retrieves the file extension from the url
     *
     * @param {String} url location of file on server
     *
     * @returns {String} file extension (including preceding dot)
     */
    function getFileExtension ( url )
    {
        var pathParts = url.split(".");
        var ext = "." + pathParts[pathParts.length - 1];
        return ext;
    }

    /**
     * Calculates the file's location on disk from the url
     *
     * @param {String} url location of file on server
     *
     * @returns {String} corresponding location of file on disk
     */
    function getFileLocation ( url )
    {
        var path = calculateHashedPath( url );
        var ext = getFileExtension ( url );

        return path + ext;
    }

    /**
     * Calculates option file's location on disk from the url
     *
     * @param {String} url location of file on server
     *
     * @returns {String} corresponding location of option file on disk
     */
    function getOptionFileLocation ( url )
    {
        var path = calculateHashedPath( url );

        return path + optionFileEnding;
    }

    /**
     * Based on the extension, returns the appropriate MIME type string
     *
     * @param {String} ext file extension
     *
     * @returns {String} MIME string
     */
    function getMIMEType ( ext )
    {
        switch (ext)
        {
            case ".gif":
                  return "image/gif; ";
            default:
                  return null;
        }
    }

    /**
     * Parses and returns the value read from the update.txt file
     */
    function getUpdateFromFile ()
    {
        var updateText = libx.io.getFileText(nextUpdateFile);
        eval(updateText);

        return updateTime;
    }

    /**
     * Writes new update information to update.txt file
     *
     * @param {Integer} newTime time for new update
     */
    function writeUpdateToFile (newTime)
    {
        var updateLine = "updateTime = " + newTime + ";";
        libx.io.writeToFile(nextUpdateFile, updateLine, true);
    }

    

    /**
     *  Manages the retrieval of a file either from hdd or from online
     *
     *  finfo object has following properties:
     *  updating    bool if true we update (optional - defaults to: false)
     *  url         string webaddress of the file we wish to retrieve (required)
     *  forceDL     bool forces the download even if there isn't a new version 
     *              (optional - defaults to: false / sometimes set by method)
     *  callback    function is called after text is retrieved (optional)
     *  type        string the type of file we are retrieving (required)
     *  text        text of the file (text is set by the method)
     *  ext	        file extension as string to save it in the correct format (
     *              default: .js )
     *  dir	        the directory (chrome url ) to save the file in (defaults
     *              to /libx in the profile folder)
     */
    var fileCacheClass = libx.core.Class.create ( 
    {
        /**
         * Checks to see whether the file "filelist.txt" exists.  If it does,
         * then it evaluates it and stores the resulting object in a variable.
         * Otherwise it creates the file.
         *
         * Also, a timeout is set to execute the update function based on the
         * stored update time.
         */
        initialize : function()
        {
            //Check whether file list (from previos session) exists
            var diskListExists = libx.io.fileExists(fileListFile);

            //Check whether next update was written to file from previous session
            var updateFileExists = libx.io.fileExists(nextUpdateFile);

            if (diskListExists)
            {
                //Read the file and load it into memory
                var listText = libx.io.getFileText("filelist.txt");
                eval(listText);

                //Store the information in the old file list.  Files not
                //accessed on this run will removed on next update
                oldFileList = files;

                //invoke the timeout function here
                //TODO: Use update time preference to determine the setTimeout
                //time needed to invoke this function
            }
            else
            {
                libx.io.writeToFile(fileListFile, "var files = { };\n", true);
            }

            if (updateFileExists)
            {
                //Use information from update file to set next timeout
                var updateDate = getUpdateFromFile();

                var currDate = Date.parse(Date());

                //We've past the update time, so set another update
                if (currDate > updateDate)
                {
                    var timeSinceUpdateTarget = currDate - updateDate;

                    var timeToResetUpdate = Math.floor((
                        6*hour/timeSinceUpdateTarget)*hour*Math.random());
                    if ( timeToResetUpdate > 6*hour )
                    {
                        timeToResetUpdate = 4*hour + Math.floor( 
                            Math.random()*2*hour );
                    }

                    var newUpdate = currDate + timeToResetUpdate;

                    //Write the new update information to file
                    writeUpdateToFile(newUpdate);

                    //Set the timeout
                    libxChromeWindow.setTimeout(this.updateTimeout, timeToResetUpdate);
                }
                else
                {
                    var timeLeft = updateDate - currDate;
                    var newUpdateDate = currDate + timeLeft;

                    //Write the update to file
                    writeUpdateToFile(newUpdateDate);

                    //Set the timeout
                    libxChromeWindow.setTimeout(this.updateTimeout, timeLeft);
                }
            }
            else
            {
                //Set the timeout here (sometime within the next 24 hours)
                var currDate = Date.parse(Date());
                var update = Math.floor( Math.random()*day );
                var updateDate = currDate + update;

                //Write the update to file
                writeUpdateToFile(updateDate);

                //Set the timeout
                setTimeout(this.updateTimeout, update);
            }
        },

        /**
         * Retrieves information from resource (either from network or local disk)
         *
         * @param {Object} fileParam contains information for request
         * @param {String} (REQUIRED) url location of file on network
         * @param {Boolean} bypassCache if set to true, always get file from network
         */
        get :  function ( fileParam )
        {
            //fileParam object members
            //url : location of resource
            //success : callback to execute if file successfully retrieved (either locally or remotely)
            //          the success function can be called when the result is 200 or the file was
            //          retrieved locally
            //error   : callback to execute if file not found
            //complete : callback to execute regardless of whether file found or not (executes after success or error)
            //bypassCache : if set to true, will always try to retrieve resource from network (defaults to false)
            //dataType    : text or xml
            //contentType : type of data wanted from server (used for images)
            //
            //Want to pass the following parameters to the callback functions
            //
            //{String} chrome url of resource requested
            //{Integer} http status?

            if (fileParam.url === undefined)
                throw "In fileCache.get, must specify url";

            //Set the server MIME type for binary files
            var ext = getFileExtension(fileParam.url);
            var mimeType = getMIMEType(ext);

            if (mimeType !== null) 
            {
                mimeType += "charset=x-user-defined";
            }

            //get corresponding file location on disk
            var fileLocation = getFileLocation(fileParam.url);
            var optionFileLocation = getOptionFileLocation(fileParam.url);

            //Check if file exists on local file system
            var fileExists = libx.io.fileExists(fileLocation);

            //We don't actually update files here.  That's done in the update function
            if (fileExists && !fileParam.bypassCache) //File is on disk
            {
                //alert("file " + fileLocation + " is on disk");
                //Invoke the success and complete callbacks here
                if (typeof fileParam.success == "function")
                    fileParam.success(fileLocation);

                if (typeof fileParam.complete == "function")
                    fileParam.complete(fileLocation);
            }
            else //retrieve file from network
            {
                var dataType = fileParam.dataType === undefined ? "text" : fileParam.dataType;
                storageLog("retrieving " + fileLocation + " from network");
                //Create the object to issue an xml http request
                var xmlParams = 
                {
                    url         : fileParam.url,

                    success     : function (result, stat, xhr) 
                    {

                        //Add the url and path to the list of files maintained by the cache
                        fileList[fileParam.url] = fileLocation;

                        //Write the file to the local file system
                        writeFile (this.url, result);

                        var fileLine = "files[\"" + fileParam.url + "\"] = \"" + fileLocation + "\";\n";

                        //Add this to index file
                        libx.io.writeToFile("filelist.txt", fileLine, false, true);

                        //Set the last modified date here and write it to the options file
                        setLastModifiedDate(fileParam.url, xhr.getResponseHeader("Last-Modified"));

                        //Invoke the fileParam success function if defined
                        if (typeof fileParam.success == "function")
                            fileParam.success(fileLocation);
                    },

                    error       : function (result, stat, xhr) 
                    {
                        storageLog("Could not read or retrieve file with url: " +
                                fileParam.url + " HTTP status " + stat);

                        //Invoke the fileParam error function if defined
                        if (typeof fileParam.error == "function")
                            fileParam.error(stat, fileParam.url);
                    },

                    dataType    : dataType,

                    bypassCache : true
                };

                //Send the request
                libx.cache.globalMemoryCache.get(xmlParams);
            }
        },

        /**
         * Handles updating files in the cache.  Called from this.initialize
         * and here through setTimeout
         */
        updateTimeout: function()
        {
            //Overwrite the list on disk since we no longer need it
            //This allows us to only maintain updates for files that are
            //actually requested in this session, but will allow for updates
            //of files requested in the previous session(s)
            libx.io.writeToFile(fileListFile, '');

            //Check if any files have been requested this session
            var cacheEmpty = true;

            for (var url in fileList)
            {
                cacheEmpty = false;
                break;
            }

            var files = fileList;

            //If no files have been requested in this session, we go off of
            //files accessed during the previous session (though that could
            //be empty if this is the very first session)
            if (cacheEmpty)
                var files = oldFileList;

            additionalHeaders = { };
            for (var url in files) 
            {
                var reqParam =
                {
                    url : url,
                    bypassCache: true,
                    dataType : "text",

                    success : function (result, stat, xhr) 
                    {
                        libx.log.write("In success function for " + this.url);

                        //Write the updated file to the local file system
                        writeFile(this.url, result);
                    }, 

                    error : function (result, stat, xhr) 
                    {
                        //We expect a HTTP 304 (file not changed on server)
                        if (stat != 304)
                        {
                            libx.log.write("Got HTTP " + stat + " when checking for " + this.url);
                        }
                    },

                };
                
                //Get the If-Modified-Since information
                additionalHeaders["If-Modified-Since"] = privGetLastModifiedDate(url);
                reqParam.header = additionalHeaders;

                //Set the server MIME type for binary files
                var ext = getFileExtension(url);
                var mimeType = getMIMEType(ext);

                if (mimeType !== null) 
                {
                    mimeType += "charset=x-user-defined";
                    reqParam.serverMIMEType = mimeType;
                }
                else
                    delete reqParam.serverMIMEType;

                libx.cache.globalMemoryCache.get(reqParam);
            }

            //Set the next timeout (sometime within the next 24 hours)
            var currDate = Date.parse(Date());
            var update = Math.floor( Math.random()*day );
            var updateDate = currDate + update;

            //Write the update to file
            writeUpdateToFile(updateDate);

            //Set the timeout
            libxChromeWindow.setTimeout(this.updateTimeout, update);
        },
        
        /**
         * Saves the urls and corresponding hashings to a file called index.txt
         * This is intended to make it easier to find a file in the hashed 
         * directory structure. (The file is not actually needed by the extension 
         * its only for People)
         *
         */
        saveFileList : function() {
            var the_list = "";
            for ( var i in fileList )
            {
              the_list += i + " : " + fileList[i] + "\n";
            }
            libx.io.writeToFile( "index.txt", the_list );
        }
    });

return fileCacheClass;
})();

//libxEnv.fileCache = new libx.cache.FileCache();
libx.cache.fileCache = new libx.cache.FileCache();


