/////////////////////////////////////////////////
/////////////////////////////////////////////////
//
// Basic JavaScript File and Directory IO module
// By: MonkeeSage, v0.1
//
/////////////////////////////////////////////////
/////////////////////////////////////////////////

libx.io = (function () {

/*
 * Code originally taken from 
 *     http://kb.mozillazine.org/Io.js
 *
 * Borrowed code for openChrome from GreaseMonkey
 *    http://www.greasespot.net/
 */

if (typeof(JSIO) != 'boolean') {

    var JSIO = true;

    /////////////////////////////////////////////////
    // Basic file IO object based on Mozilla source 
    // code post at forums.mozillazine.org
    /////////////////////////////////////////////////

    // Example use:
    // var fileIn = FileIO.open('/test.txt');
    // if (fileIn.exists()) {
    //     var fileOut = FileIO.open('/copy of test.txt');
    //     var str = FileIO.read(fileIn);
    //     var rv = FileIO.write(fileOut, str);
    //     alert('File write: ' + rv);
    //     rv = FileIO.write(fileOut, str, 'a');
    //     alert('File append: ' + rv);
    //     rv = FileIO.unlink(fileOut);
    //     alert('File unlink: ' + rv);
    // }

    var FileIO = {

        localfileCID  : '@mozilla.org/file/local;1',
        localfileIID  : Components.interfaces.nsILocalFile,

        finstreamCID  : '@mozilla.org/network/file-input-stream;1',
        finstreamIID  : Components.interfaces.nsIFileInputStream,

        foutstreamCID : '@mozilla.org/network/file-output-stream;1',
        foutstreamIID : Components.interfaces.nsIFileOutputStream,

        sinstreamCID  : '@mozilla.org/scriptableinputstream;1',
        sinstreamIID  : Components.interfaces.nsIScriptableInputStream,

        suniconvCID   : '@mozilla.org/intl/scriptableunicodeconverter',
        suniconvIID   : Components.interfaces.nsIScriptableUnicodeConverter,

        open   : function(path) {
            try {
                var file = Components.classes[this.localfileCID]
                                .createInstance(this.localfileIID);
                file.initWithPath(path);
                return file;
            }
            catch(e) {
                return false;
            }
        },
        // code borrowed from GreaseMonkeys utils.js and slightly modified
        openChrome : function (path) {
            try {
                var reg = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                          .getService(Components.interfaces.nsIChromeRegistry);
    
                var ioSvc = Components.classes["@mozilla.org/network/io-service;1"]
                                    .getService(Components.interfaces.nsIIOService);
            
                var proto = Components.classes["@mozilla.org/network/protocol;1?name=file"]
                                    .getService(Components.interfaces.nsIFileProtocolHandler);
            
                var chromeURL = ioSvc.newURI(path, null, null);
                var fileURL = reg.convertChromeURL(chromeURL);
                var file = proto.getFileFromURLSpec(fileURL.spec);
                return file;
            }
            catch ( e ) {
                return false;
            }
        },

        read   : function(file, charset) {
            try {
                var data     = new String();
                var fiStream = Components.classes[this.finstreamCID]
                                    .createInstance(this.finstreamIID);
                var siStream = Components.classes[this.sinstreamCID]
                                    .createInstance(this.sinstreamIID);
                fiStream.init(file, 1, 0, false);
                siStream.init(fiStream);
                data += siStream.read(-1);
                siStream.close();
                fiStream.close();
                if (charset) {
                    data = this.toUnicode(charset, data);
                }
                return data;
            } 
            catch(e) {
                return false;
            }
        },

        write  : function(file, data, mode, charset) {
            try {
                var foStream = Components.classes[this.foutstreamCID]
                                    .createInstance(this.foutstreamIID);
                if (charset) {
                    data = this.fromUnicode(charset, data);
                }
                var flags = 0x02 | 0x08 | 0x20; // wronly | create | truncate
                if (mode == 'a') {
                    flags = 0x02 | 0x10; // wronly | append
                }
                foStream.init(file, flags, 0664, 0);
                foStream.write(data, data.length);
                // foStream.flush();
                foStream.close();
                return true;
            }
            catch(e) {
                return false;
            }
        },

        create : function(file) {
            try {
                file.create(0x00, 0664);
                return true;
            }
            catch(e) {
                return false;
            }
        },

        unlink : function(file) {
            try {
                file.remove(false);
                return true;
            }
            catch(e) {
                return false;
            }
        },

        path   : function(file) {
            try {
                return 'file:///' + file.path.replace(/\\/g, '\/')
                            .replace(/^\s*\/?/, '').replace(/\ /g, '%20');
            }
            catch(e) {
                return false;
            }
        },

        toUnicode   : function(charset, data) {
            try{
                var uniConv = Components.classes[this.suniconvCID]
                                    .createInstance(this.suniconvIID);
                uniConv.charset = charset;
                data = uniConv.ConvertToUnicode(data);
            } 
            catch(e) {
                // foobar!
            }
            return data;
        },

        fromUnicode : function(charset, data) {
            try {
                var uniConv = Components.classes[this.suniconvCID]
                                    .createInstance(this.suniconvIID);
                uniConv.charset = charset;
                data = uniConv.ConvertFromUnicode(data);
                // data += uniConv.Finish();
            }
            catch(e) {
                // foobar!
            }
            return data;
        }

    }


    /////////////////////////////////////////////////
    // Basic Directory IO object based on JSLib 
    // source code found at jslib.mozdev.org
    /////////////////////////////////////////////////

    // Example use:
    // var dir = DirIO.open('/test');
    // if (dir.exists()) {
    //     alert(DirIO.path(dir));
    //     var arr = DirIO.read(dir, true), i;
    //     if (arr) {
    //         for (i = 0; i < arr.length; ++i) {
    //             alert(arr[i].path);
    //         }
    //     }
    // }
    // else {
    //     var rv = DirIO.create(dir);
    //     alert('Directory create: ' + rv);
    // }

    // ---------------------------------------------
    // ----------------- Nota Bene -----------------
    // ---------------------------------------------
    // Some possible types for get are:
    //     'ProfD'                = profile
    //     'DefProfRt'            = user (e.g., /root/.mozilla)
    //     'UChrm'                = %profile%/chrome
    //     'DefRt'                = installation
    //     'PrfDef'                = %installation%/defaults/pref
    //     'ProfDefNoLoc'        = %installation%/defaults/profile
    //     'APlugns'            = %installation%/plugins
    //     'AChrom'                = %installation%/chrome
    //     'ComsD'                = %installation%/components
    //     'CurProcD'            = installation (usually)
    //     'Home'                = OS root (e.g., /root)
    //     'TmpD'                = OS tmp (e.g., /tmp)

    var DirIO = {

        dirservCID : '@mozilla.org/file/directory_service;1',
    
        propsIID   : Components.interfaces.nsIProperties,
    
        fileIID    : Components.interfaces.nsIFile,

        get    : function(type) {
            try {
                var dir = Components.classes[this.dirservCID]
                                .createInstance(this.propsIID)
                                .get(type, this.fileIID);
                return dir;
            }
            catch(e) {
                return false;
            }
        },

        open   : function(path) {
            return FileIO.open(path);
        },

        create : function(dir) {
            try {
                dir.create(0x01, 0755);
                return true;
            }
            catch(e) {
                return false;
            }
        },

        read   : function(dir, recursive) {
            var list = new Array();
            try {
                if (dir.isDirectory()) {
                    if (recursive == null) {
                        recursive = false;
                    }
                    var files = dir.directoryEntries;
                    list = this._read(files, recursive);
                }
            }
            catch(e) {
                // foobar!
            }
            return list;
        },

        _read  : function(dirEntry, recursive) {
            var list = new Array();
            try {
                while (dirEntry.hasMoreElements()) {
                    list.push(dirEntry.getNext()
                                    .QueryInterface(FileIO.localfileIID));
                }
                if (recursive) {
                    var list2 = new Array();
                    for (var i = 0; i < list.length; ++i) {
                        if (list[i].isDirectory()) {
                            files = list[i].directoryEntries;
                            list2 = list2.concat ( this._read(files, recursive) );
                        }
                    }
                    for (i = 0; i < list2.length; ++i) {
                        list.push(list2[i]);
                    }
                }
            }
            catch(e) {
               // foobar!
            }
            return list;
        },

        unlink : function(dir, recursive) {
            try {
                if (recursive == null) {
                    recursive = false;
                }
                dir.remove(recursive);
                return true;
            }
            catch(e) {
                return false;
            }
        },

        path   : function (dir) {
            return FileIO.path(dir);
        },

        split  : function(str, join) {
            var arr = str.split(/\/|\\/), i;
            str = new String();
            for (i = 0; i < arr.length; ++i) {
                str += arr[i] + ((i != arr.length - 1) ? 
                                        join : '');
            }
            return str;
        }
    
    }

    
    /**
     *  Helper function for libx.io
     *    Returns file for given path
     *    Creates folders alogn path if they dont exist if the second param is true
     *    @param {String} path of the file to retrieve
     *    @param {boolean} whether or not to create the directory/file
     */
    function getFile ( path, create ) {
        var file;
        if ( path.indexOf ( 'chrome' ) == 0 ) {
            file = FileIO.openChrome( path );
        } else {
            file = DirIO.get ( 'ProfD' );
            file.append ( 'libx' );
            
            if ( !file.exists() ) {
                DirIO.create(file);
            }
            
            // Adds support for passing in full file pathname of profile directory
            if ( path.indexOf ( FileIO.path ( file ) ) == 0 ) {
                path = path.substr ( FileIO.path ( file ).length );
            }

            var patharray = path.split( "/" );
            for (var i = 0; i < (patharray.length - 1); i++ )
            {
                file.append( patharray[i] );
                if ( !file.exists() && create ) {
                    DirIO.create(file);
                }
            }
            file.append( patharray[patharray.length-1] );
            if ( !file.exists() && create ) {
                FileIO.create(file);
            }
        }
        return file;
    }
    
    /**
     *    Helper function for libx.io
     *    Returns the full file path for given path
     *    Chrome paths are left unchanged
     *    Any other paths should be file names only
     *    and will be put in %profile%/libx
     *    @param {String} the filepath to find full path of
     */
    function getFilePath ( path ) {
        var file;
        try {
            if ( path.indexOf ( 'chrome' ) >= 0 ) {
                return path;
            }
            else {
               file = DirIO.get ( 'ProfD' );
                file.append ( 'libx' );
                
                if ( !file.exists() ) {
                    file = DirIO.create(file);
                }
                
                file.append ( path );
                return FileIO.path ( file );
            }
        }
        catch ( e ) {
            return null;
        }
    }
}


return /** @lends libx.io */ {
    /**
     * Returns whether a file referenced by chrome path exists or not
     *
     * @param {String} path chrome url location of file
     */
    fileExists : function ( path ) {
        return getFile ( path, false ).exists();
    },
    
    /**
     *    Assumes /libx directory off of profile if an absolute chrome path is
     *  not specified
     *    @param {String} path of the file to write to
     *    @param {String} text to write to file
     *    @param {boolean} if true, will create the file if it doesnt exist
     *    @param {boolean} if true, will append to rather than overwrite file
     */
    writeToFile : function ( path, str, create, append ) {
        var file;
        var appendStr;
        if ( create == true )
            file = getFile( path, true );
        else
            file = getFile ( path );

        if (append)
            appendStr = 'a';

        return FileIO.write ( file, str, appendStr );
            
    },

    
    /**
     *    Gets the text of a file.
     *    @param {String} path of the file to retrieve contents of
     */
    getFileText : function (path) {
        var file = getFile(path);
        //Note that FileIO.read closes the file, so we're not leaking a handle
        return FileIO.read(file);
    },
    
    /**
     *    Retrieves a local XML file
     */
    getFileXML : function ( path ) {
        var fullPath = getFilePath ( path );
        var responseXML = null;
        libx.cache.globalMemoryCache.get ({
            url : fullPath,
            dataType : "xml",
            type     : "GET",
            bypassCache : true,
            async : false,
            success : function (xml) {
                responseXML = xml;
            }
        });
        return responseXML;
    },
    
    /**
     *    Deletes the file
     *    @param {String} path of file to delete
     */
    removeFile : function ( path ) {
        var file = getFile ( path );
        FileIO.unlink ( file );
    },
    
    /**
     *	Takes a regular expression, and returns all files whos name matches that
     *	regular expression
     *	@param {RegularExpression} regular expression to match against file names
     *	@return {String[]} array of matching path names
     */
    find : function (  regex ) {
    	var entries = [];
	    var profd = DirIO.get  ( 'ProfD' );
		profd.append ( 'libx' );
		DirIO.open ( profd );
		var list = DirIO.read ( profd, true );
		for ( var i = 0; i < list.length; i++ ) {
		    var path = ( FileIO.path ( list[i] ) );
		    if ( path.match ( regex ) ) { entries.push ( path ); }
		}
		return entries;
    }
};
} )();
