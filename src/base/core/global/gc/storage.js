
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
            var error = false;
            try {
                localStorage.setItem(this.prefix + paramObj.key, paramObj.value);
            } catch(e) {
                error = true;
                if(paramObj.error)
                    paramObj.error(e);
                else
                    libx.log.write("Error in libx.storage.setItem(): " + e);
            }
            if (!error && paramObj.success)
                paramObj.success();
            if(paramObj.complete)
                paramObj.complete();
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
            var error = false;
            var value = null;
            try {
                value = localStorage.getItem(this.prefix + paramObj.key);
            } catch(e) {
                error = true;
                if(paramObj.error)
                    paramObj.error(e);
                else
                    libx.log.write("Error in libx.storage.getItem(): " + e);
            }
            if (!error) {
                if (value == null) {
                    if (paramObj.notfound)
                        paramObj.notfound();
                } else if (paramObj.success)
                    paramObj.success(value);
            }
            if(paramObj.complete)
                paramObj.complete();
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
            var matches = [];
            var pattern = paramObj.pattern;
            var error = false;
            if(!pattern)
                pattern = /.*/;
            try {
                for(var i in localStorage) {
                    if(i.indexOf(this.prefix) == 0) {
                        var itemName = i.substr(this.prefix.length);
                        if(pattern.test(itemName))
                            matches.push(itemName);
                    }
                }
            } catch(e) {
                error = true;
                if(paramObj.error)
                    paramObj.error(e);
                else
                    libx.log.write("Error in libx.storage.find(): " + e);
            }
            if (!error && paramObj.success)
                paramObj.success(matches);
            if(paramObj.complete)
                paramObj.complete();
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
            var error = false;
            try {
                for(var i in localStorage)
                    if(i.indexOf(this.prefix) == 0)
                        localStorage.removeItem(i);
            } catch(e) {
                error = true;
                if(paramObj && paramObj.error)
                    paramObj.error(e);
                else
                    libx.log.write("Error in libx.storage.clear(): " + e);
            }
            if(!error && paramObj && paramObj.success)
                paramObj.success();
            if(paramObj && paramObj.complete)
                paramObj.complete();
        }
    })
    
};
