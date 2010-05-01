
/**
 * Support for I/O
 * Writing and reading files in LibX's internal file storage,
 * which in Firefox is located in a subdirectory 'libx' in the 
 * Profile subdirectory.  LibX uses this storage for its 
 * object cache and other things. 
 *
 * @namespace
 */
libx.io = (function () {

return /** @lends libx.io */ {
    /**
     * Returns whether a file referenced by chrome path exists or not
     *
     * @param {String} path chrome url location of file
     */
    fileExists : function ( path ) {
        var file = localStorage[path];
        return typeof(file) != 'undefined';
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
        
        if (!libx.io.fileExists(path)) {
            if(!create)
                return false;
            localStorage[path] = '';
        }
        
        if(append)
            str = localStorage[path] + str;
        
        localStorage[path] = str;
        return true;
            
    },

    
    /**
     *    Gets the text of a file.
     *    @param {String} path of the file to retrieve contents of
     */
    getFileText : function (path) {
        if(!libx.io.fileExists(path))
            return false;
        return localStorage[path];
    },
    
    /**
     *    Retrieves a local XML file
     */
    getFileXML : function ( path ) {
        console.log('io.js: libx.io.getFileXML() not yet implemented.');
        return null;
    },
    
    /**
     *    Deletes the file
     *    @param {String} path of file to delete
     */
    removeFile : function ( path ) {
        if(!libx.io.fileExists(path))
            return false;
        return delete localStorage[path];
    },
    
    /**
     *	Takes a regular expression, and returns all files whose name matches that
     *	regular expression
     *	@param {RegularExpression} regular expression to match against file names
     *	@return {String[]} array of matching path names
     */
    find : function (  regex ) {
    	throw new Error('io.js: libx.io.find() not yet implemented.');
    }
};
} )();
