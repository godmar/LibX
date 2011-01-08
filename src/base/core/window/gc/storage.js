/*
 * Uses the localStorage from the background page.
 */

libx.storage = {
    Store: libx.core.Class.create({
        
        initialize: function(prefix) {
            this.prefix = prefix + '.';
        },
        
        /**
         * Retrieves an object from storage with the given key.
         *
         * @param {Object}      paramObj contains properties used for retrieval
         * 
         * @param {String}      paramObj.key        (REQUIRED) key to store
         * 
         * @param {String}      paramObj.value      (REQUIRED) value to store
         * 
         * @param {Function}    paramObj.success    function to execute upon
         *                                          success
         * 
         * @param {Function}    paramObj.complete   function to execute upon
         *                                          call completion
         *                                          
         * @param {Function}    paramObj.error      function to execute upon
         *                                          errors
         */
        setItem: function(paramObj) {
        
            imported.localStorage.setItem(this.prefix + paramObj.key, paramObj.value, function() {
                if(paramObj.success)
                    paramObj.success();
                if(paramObj.complete)
                    paramObj.complete();
            });
            
        },
        
        /**
         * Retrieves an object from storage with the given key.
         *
         * @param {Object}      paramObj contains properties used for retrieval
         * 
         * @param {String}      paramObj.key        (REQUIRED) key to look up
         * 
         * @param {Function}    paramObj.complete   function to execute upon
         *                                          call completion
         *                                          
         * @param {Function}    paramObj.error      function to execute upon
         *                                          errors
         *                                          
         * @param {Function}    paramObj.success    function to execute when
         *                                          value is returned; takes a
         *                                          single parameter which will
         *                                          be the returned value
         *                                          
         * @param {Function}    paramObj.notfound   function to execute if the
         *                                          given key was not found in
         *                                          the store
         */
        getItem: function(paramObj) {
        
            imported.localStorage.getItem(this.prefix + paramObj.key, paramObj.value, function(result) {
                if(result == null) {
                    if(paramObj.notfound)
                        paramObj.notfound();
                } else if(paramObj.success)
                    paramObj.success(result);
                if(paramObj.complete)
                    paramObj.complete();
            });

        },
        
        /**
         * Retrieves all items matching a given pattern.
         *
         * @param {Object}      paramObj contains properties used for retrieval
         * 
         * @param {String}      paramObj.pattern    pattern to search; if not
         *                                          provided, all items will be
         *                                          returned
         * 
         * @param {Function}    paramObj.complete   function to execute upon
         *                                          call completion
         *                                          
         * @param {Function}    paramObj.error      function to execute upon
         *                                          errors
         *                                          
         * @param {Function}    paramObj.success    function to execute when
         *                                          value is returned; takes a
         *                                          single parameter which will
         *                                          be all matched items
         */
        find: function(paramObj) {
            throw new Error("libx.storage.find() not yet implemented for content scripts.");
        },
        
        /**
         * Clears the local storage.
         *
         * @param {Object}      paramObj contains properties used for retrieval
         * 
         * @param {Function}    paramObj.success    function to execute upon
         *                                          success
         * 
         * @param {Function}    paramObj.complete   function to execute upon
         *                                          call completion
         *                                          
         * @param {Function}    paramObj.error      function to execute upon
         *                                          errors
         */
        clear: function(paramObj) {
            throw new Error("libx.storage.clear() not yet implemented for content scripts.");
        }
    })
    
};
