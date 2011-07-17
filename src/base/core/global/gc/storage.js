
libx.storage = (function () {

// LibX database connection
var dbConn = openDatabase('libx', '1.0', 'LibX storage', 10 * 1024 * 1024);

return {

    Store: libx.core.Class.create({
        
        initialize: function (storeName) {
            this.storeName = storeName;
            dbConn.transaction(function (t) {
                t.executeSql('CREATE TABLE IF NOT EXISTS ' + storeName + ' (key TEXT  PRIMARY KEY NOT NULL  UNIQUE, value TEXT)',
                    [], libx.core.EmptyFunction, function (t, err) {
                        libx.log.write('Error creating table ' + storeName + ': ' + err.message);
                    });
            });
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

            var storeName = this.storeName;
            var error = function (t, err) {
                if (paramObj.error)
                    paramObj.error(err.message);
                else
                    libx.log.write('Error in libx.storage.setItem(): ' + err.message);
            };

            dbConn.transaction(function (t) {
                t.executeSql("INSERT OR REPLACE INTO " + storeName + " (key, value) VALUES(?, ?)",
                    [paramObj.key, paramObj.value], paramObj.success, error);
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

            var storeName = this.storeName;
            var error = function (t, err) {
                if (paramObj.error)
                    paramObj.error(err.message);
                else
                    libx.log.write('Error in libx.storage.getItem(): ' + err.message);
            };

            var success = function (t, results) {
                if (paramObj.success) {
                    switch (results.rows.length) {
                        case 0: paramObj.notfound && paramObj.notfound(); break;
                        case 1: paramObj.success && paramObj.success(results.rows.item(0).value); break;
                        default: libx.log.write('Error in libx.storage: multiple values returned for statement');
                    }
                }
            };

            dbConn.readTransaction(function (t) {
                t.executeSql("SELECT value FROM " + storeName + " WHERE key = ?",
                    [paramObj.key], success, error);
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
        // BRN: redo this to be efficient with SQL
        find: function(paramObj) {

            var storeName = this.storeName;
            var error = function (t, err) {
                if (paramObj.error)
                    paramObj.error(err.message);
                else
                    libx.log.write('Error in libx.storage.find(): ' + err.message);
            };

            var success = function (t, results) {
                if (paramObj.success) {

                    var pattern = paramObj.pattern;
                    if(!pattern)
                        pattern = /.*/;
                    var matches = [];

                    for (var i = 0; i < results.rows.length; i++) {
                        var key = results.rows.item(i).key;
                        if (pattern.test(key))
                            matches.push(key);
                    }
                    paramObj.success(matches);

                }
            };

            dbConn.readTransaction(function (t) {
                t.executeSql("SELECT key FROM " + storeName, [], success, error);
            });

        },
        
        /**
         * Removes an object from storage with the given key.
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
         * @param {Function}    paramObj.success    function to execute upon
         *                                          success
         */
        removeItem: function(paramObj) {

            var storeName = this.storeName;
            var error = function (t, err) {
                if (paramObj.error)
                    paramObj.error(err.message);
                else
                    libx.log.write('Error in libx.storage.removeItem(): ' + err.message);
            };

            dbConn.transaction(function (t) {
                t.executeSql("DELETE FROM " + storeName + " WHERE key = ?",
                    [paramObj.key], paramObj.success, error);
            });

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

            var storeName = this.storeName;
            var error = function (t, err) {
                if (paramObj.error)
                    paramObj.error(err.message);
                else
                    libx.log.write('Error in libx.storage.clear(): ' + err);
            };

            dbConn.transaction(function (t) {
                t.executeSql("DELETE FROM " + storeName,
                    [], paramObj && paramObj.success, error);
            });

        }
    })
    
};

}) ();

libx.storage.metacacheStore = new libx.storage.Store('metacache');
libx.storage.cacheStore = new libx.storage.Store('cache');
libx.storage.prefsStore = new libx.storage.Store('prefs');

