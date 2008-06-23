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

libxEnv.fileCacheClass = function()
{
    var that = this;
    var fileList = new Object();
    var jsFileEnding = ".js";
    var optionFileEnding = "options.js";
    var pathPattern = "0123456789AB/0123456789AB/0123456789AB";
    var firstSlashPos = pathPattern.indexOf("/");
    var secondSlashPos = pathPattern.lastIndexOf("/");
    var segmentLength = (pathPattern.length - 2)/3;

    // Logging function for errors within this class
    function storage_log( msg )
    {
        libxEnv.writeLog(msg, 'fileStorage');
    }
    
    // Returns the hashed path of the .js file that is associated with the 
    // given url
    function getCuePath( url ) 
    {
        var path;
        if ( fileList[url] === undefined )
        {
            path = calculateHashedPath( url );
            path += jsFileEnding;
            fileList[url] = path;
        }
        else
        {
            path = fileList[url]; 
        }
        return path;
    }
    
    // Returns the hashed path of the options file associated with the given 
    // url
    function getCueOptionPath( url ) 
    {
        var path = getCuePath( url );
        return ( path.substring(0,path.length-jsFileEnding.length) + 
            optionFileEnding);
    }

    // calculates the sha1 path associated with the url (without file ending)
    function calculateHashedPath( url ) 
    {
        var unprocessedPath = libxEnv.hash.hashString( url );
        var path = unprocessedPath.substring( 0 , firstSlashPos );
        path += "/" + unprocessedPath.substring( firstSlashPos, 
            secondSlashPos-1);
        path += "/" + unprocessedPath.substring( secondSlashPos-1, 
            pathPattern.length-2 );
        return path;
    }

    // reads the cue file from the hdd and returns the content
    function readCueFile( url ) 
    {
        return libxEnv.getFileText( getCuePath( url ) );
    }
    
    // reads the cue option file from the hdd and returns the content
    function readOptionsFile( url ) 
    {
        return libxEnv.getFileText( getCueOptionPath( url ) );
    }
    
    // writes text to the cue file
    function writeCueFile( url, text ) 
    {
        var path = getCuePath( url );
        var dirPath = path.substring(0,path.length-segmentLength +
             jsFileEnding.length);
        libxEnv.writeToFile( path, text, true, dirPath );
    }
    
    // writes text to the cue options file
    function writeOptionsFile( url, text ) 
    {
        var path = getCueOptionPath(url);
        var dirPath = path.substring(0,path.length-segmentLength + 
            optionFileEnding.length);
        libxEnv.writeToFile( path, text, true, dirPath );
    }
    
    // gets and returns the last modified date found in the cue options file 
    // associated with url
    this.getLastModifiedDate = function ( url )
    {
        var lastMod = "";
        eval(readOptionsFile(url));
        return lastMod;
    }

    // writes the last modified date in lastMod to the cue options file 
    // assoicated with url
    function  setLastModifiedDate( url, lastMod )
    {
        lastMod = "lastMod = '" + lastMod + "';";
        writeOptionsFile( url, lastMod );
    }
    
    function setLastUpdateDate( dateString )
    {
        libxEnv.setUnicharPref( "libx.lastupdate", dateString );
    }

    
    // Downloads the cueFile at url, if force is true it will always pull the 
    // file no matter when it was last modified, if force is false or omitted 
    // then we send a last-modified
    // header to make sure we only get the file if it has been updated. If the 
    // file has not
    // been updated then we simply return the version we still have on the hdd
    function downloadCue( cue, callback ) 
    {
        if ( cue.forceDL )
            libxEnv.getCueDocument( cue, null, callback );
        else
            libxEnv.getCueDocument( cue, 
                that.getLastModifiedDate( cue.url ), callback );
    }
    
    this.downloadCueCallback = function( docRequest, cue, callback )
    {
        if ( docRequest.status == "200" )
        {
            setLastModifiedDate( cue.url, docRequest.getResponseHeader( 
                "Last-Modified" ) );
            var text = docRequest.responseText;
            writeCueFile( cue.url, text );
            if ( cue.type == "root" )
                setLastUpdateDate( new Date() );
            callback( cue, text );
        }
        else
        {
            if ( docRequest.status == "304" )
            {
                storage_log( "File with url: " + cue.url  
                    + "\n has not been updated on server, status: 304" );
                if ( cue.type == "root" )
                {
                    setLastUpdateDate( new Date() );
                }
                callback( cue, null );
                return;
            }
            storage_log( "Could not read or retrieve file with url: " + cue.url 
                + " status=" + docRequest.status);
            callback( cue, null );
            return;
        }
    }
    
    // updates the cue associated with url by downloading it from the url. 
    // If force is true then we will always download the file no matter if it 
    // has been updated or not. If force is false or omitted then we only 
    // redownload the file if it has been modified since the last time we got 
    // it. If the file is not found or not downloaded we simply us the copy we 
    // still have on hdd and return it instead
    this.updateCue = function ( cue ) {
        storage_log( "Updating cue " + cue.url );
        var text = downloadCue( cue, updateCueCallBack );
    }
    
    function updateCueCallBack( cue, text )
    {
        if ( text != null )
        {
            cue.text = text;
            if ( cue.type == "root" )
                cue.updating = true;
            if ( cue.callback !== undefined )
                cue.callback();
            return;
        }
        else
        {
            text = readCueFile( cue.url );
            if ( !text || text == "" )
			{
				storage_log( "!!!File with url " + cue.url + "could not be read from file either.");
                return;
			}
            // since we haven't updated if cue is root we disable updating of it contents
			cue.text = text;
            if ( cue.type == "root" )
                cue.updating = false;
            if ( cue.callback !== undefined )
                cue.callback();
			}        
    }
    
    // returns the text of the cue file. We first try to read the cue from hdd 
    // if it is not found, we download it from the url associated with it.
    this.getCue = function ( cue ) 
	{
        var text = readCueFile( cue.url );
        if ( text == null || text == "" || text == false ) 
        {
            storage_log( "Stored file could not be read, downloading it" );
            cue.forceDL = true;
            text = downloadCue( cue, getCueCallback );
            return;
        }
        cue.text = text;
        if ( cue.callback !== undefined )
        {
            cue.callback();
        }
    }
    
    // callback for the getCue function
    function getCueCallback( cue, text )
    {
        if ( text == null )
        {
            storage_log( "Could not open or download file with url: " + 
                cue.url );
        }
        else
        {
            cue.text = text;
            if ( cue.callback !== undefined )
            {
                cue.callback();
            }
        }
    }
    
    // saves the urls and hashings into a file called index.txt to make it easier to 
    // figure out which hashed file is which feed/cue
    this.saveFileList = function() {
        var the_list = "";
        for ( i in fileList )
        {
          the_list += i + " : " + fileList[i] + "\n";
        }
        libxEnv.writeToFile( "index.txt", the_list );
    }
    return this;
}

libxEnv.fileCache = new libxEnv.fileCacheClass();
