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
 
 //*****************************************
 // File Manager Class
 // This class manages the downloading and storing of the doforurl files
 //******************************************

libx.cache = { };
libx.cache.FileCache = ( function () {

    //These variables will be captured through closure by the class functions

    // List of files maintaned for debuging purposes
    var fileList = new Object();
    var jsFileEnding = ".js";
    var optionFileEnding = "options.js";
    var pathPattern = "0123456789AB/0123456789AB/0123456789AB";
    var firstSlashPos = pathPattern.indexOf("/");
    var secondSlashPos = pathPattern.lastIndexOf("/");
    var segmentLength = (pathPattern.length - 2)/3;

    /**
     * Logging function for this class
     *
     * @param {String} message to log
     */
    function storageLog ( msg )
    {
        libxEnv.writeLog(msg, 'fileStorage');
    };
	
    /**
     * Returns the hashed part of the .js file that is associated with the
     * given url and ending in the given file ending
     *
     * @param {String} url path to the file
     * @param {String} extension of the file (e.g., js)
     */
	function getHashedPath ( url, ext )
	{
		var path;
		if ( fileList[url] === undefined )
		{
			path = calculateHashedPath( url );
			fileList[url] = path;
		}
		else
		{
			path = fileList[url];
		}
		if (!ext)
			path += jsFileEnding;
		else
			path += ext;
		return path;
	};
    
    /**
     * Returns the hashed path of the options file associated with the given
     * url
     *
     * @param {String} url path to the file
     */
    function getHashedOptionPath ( url )
    {
        var temp = getHashedPath( url, optionFileEnding );
		return temp;
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
    };

    /**
     * reads the file from the hdd and returns the content
     *
     * @param {Object} finfo object with the following properties
     * @param {String} finfo.url path to file
     * @param {String} finfo.ext extension of file
     */
    function readFile ( finfo ) 
    {
		var path = getHashedPath( finfo.url, finfo.ext );
        return libxEnv.getFileText( path );
    };
    
    /** 
     * reads the option file from the hdd and returns the content
     *
     * @param {String} url path to file
     */
    function readOptionsFile ( url )
    {
        return libxEnv.getFileText( getHashedOptionPath( url ) );
    };
    
    /** 
     * writes text to the file
     *
     * @param {Object} finfo object with the following properties
     * @param {String} finfo.url path to file
     * @param {String} finfo.ext extension of file
     *
     * @param {String} text text to write to file
     */
    function writeFile ( finfo, text ) 
    {
        var path = getHashedPath( finfo.url, finfo.ext );
        var dirPath = path.substring(0, secondSlashPos);
        libxEnv.writeToFile( path, text, true, dirPath );
    };
    
    /** 
     * writes text to the options file
     *
     * @param {String} url path to file
     * @param {String} text text to write to file
     */
    function writeOptionsFile ( url, text ) 
    {
        var path = getHashedOptionPath(url);
        var dirPath = path.substring(0, secondSlashPos);
        libxEnv.writeToFile( path, text, true, dirPath );
    };

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
    };
    
	/**
     * Sets the last update date in the about:config so it can be displayed 
     * in the prefs menu later
     *
     * @param {String} string containing date
     */
    function setLastUpdateDate ( dateString )
    {
        libxEnv.setUnicharPref( "libx.lastupdate", dateString );
    };

    /**
     * Returns last modified date
     *
     * @param {String}   url path to file
     * @returns {String} date that file was last modified
     */
    function privGetLastModifiedFileDate ( url )
    {
        var lastMod = "";
        eval(readOptionsFile(url));
        return lastMod;
    };

    
    /**
     * Downloads the file at url, if force is true it will always pull the 
     * file no matter when it was last modified, if force is false or omitted 
     * then we send a last-modified header to make sure we only get the file
     * if it has been updated. If the file has not been updated then we 
     * simply return the version we still have on the hdd
     *
     * @param {Object}  finfo object that contains the following information
     * @param {String}  finfo.url         path to file
     * @param {String}  finfo.contentType MIME content type of file
     * @param {String}  finfo.type        root, cue, hotfix, or sandboxscript
     * @param {Boolean} finfo.updating    updating file
     */
    function downloadFile ( finfo ) 
    {
        var xhrParams = 
        {
            dataType : "text",
            type     : "POST",
            url      : finfo.url,
            success  : function (result, stat, xhr) 
            {
                // We did download the file
                setLastModifiedDate( finfo.url, xhr.getResponseHeader( 
                            "Last-Modified" ) );
                var text = result;
                if ( finfo.contentType !== undefined 
                     && xhr.responseBody !== undefined )
                {
                    text = xhr.responseBody;
                }
                writeFile( finfo, text );
                if ( finfo.type == "root" )
                    setLastUpdateDate( new Date() );
                getFileCallback( finfo, text );
            },

            error  : function (result, stat, xhr) 
            {
                // We didn't download the file because ....
                if ( stat == "304" )
                {
                    // .... it hasn't been updated since we last downloaded it
                    storageLog( "File with url: " + finfo.url  
                            + "\n has not been updated on server, status: 304" );
                    if ( finfo.type == "root" )
                    {
                        setLastUpdateDate( new Date() );
                    }
                }
                else
                {
                    // ..... we couldn't get it print error and continue
                    storageLog( "Could not read or retrieve file with url: " + 
                            finfo.url + " status=" + docRequest.status);
                }
                // we printed the messages stating why we didn't get the file 
                // from online now we decide if we should get it from file or 
                // if we already tried that
                if ( finfo.updating == true )
                {
                    if ( finfo.type == "root" )
                    {
                        finfo.updating = false;
                    }
                    text = readFile( finfo );
                    if ( !text || text == "" )
                    {
                        storageLog( "!!!File with url " + finfo.url + 
                                " could not be read from file either." );
                        return;
                    }
                    getFileCallback( finfo, text );
                }
                else
                {
                    storageLog( "Could not open or download file with url: " + 
                            finfo.url );
                }
            },

            bypassCache: true
        };
        
        if ( !finfo.forceDL ) 
        {
            //Add some additional properties to xhrParams
            xhrParams.contentType = finfo.contentType + "; charset=x-user-defined";

            xhrParams.header = { };
            xhrParams.header["If-Modified-Since"] = privGetLastModifiedDate( finfo.url );
        }

        libx.ajax.docrequest.getRequest(xhrParams);
    };

    /**
     *  Asynchronous part of the get File method that is called after a file 
     *  is retrieved from online.
     *
     *  @param {Object}   finfo object that contains the following information
     *  @param {String}   finfo.text set by second parameter
     *  @param {Function} finfo.callback function to invoke
     *  @param {String}   text contents of file (used to set text member of finfo)
     */
    function getFileCallback ( finfo, text )
    {
        finfo.text = text;
        if ( finfo.callback !== undefined )
            finfo.callback();
        return;
    };

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
         * Retrieves file from either hdd or from the network resource
         * (depending on state of finfo.updating). Sets text member of
         * finfo and then invokes the callback function if defined
         *
         * @param {Object} finfo see the class documentation for information
         *                       concerning this object
         */
        getFile : function ( finfo )
        {
            if ( finfo.updating )
            {
                storageLog( "Updating file " + finfo.url );
                var text = downloadFile( finfo );
            }
            else
            {
                storageLog( "Loading stored file " + finfo.url );
                var text = readFile( finfo );
                if ( text == null || text == "" || text == false ) 
                {
                    storageLog( "Stored file " + finfo.url + 
                        "could not be read, downloading it" );
                    finfo.forceDL = true;
                    downloadFile( finfo );
                    return;
                }
                finfo.text = text;
                if ( finfo.callback !== undefined )
                {
                    finfo.callback();
                }
            }
        },
        
        /**
         *  Method to lookup the file path of a finfo object. Returns the hashed 
         *  path + containing dir if given
         *
         *  @param {Object} finfo see class documentation for information about
         *                        the finfo object
         */
        getFilePath : function ( finfo )
        {
            return getHashedPath( finfo.url, finfo.ext );;
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
            libxEnv.writeToFile( "index.txt", the_list );
        }
    });

return fileCacheClass;
})();

libxEnv.fileCache = new libx.cache.FileCache();
