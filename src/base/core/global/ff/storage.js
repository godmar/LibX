
// BRN: remove sync parts?
libx.storage = (function () {
    
    // LibX database connection
    var dbConn;
    
    // connect to the database
    (function() {
        var file = Components.classes["@mozilla.org/file/directory_service;1"]  
                                      .getService(Components.interfaces.nsIProperties)  
                                      .get("ProfD", Components.interfaces.nsIFile);  
        file.append("libx.sqlite");
        var storageService = Components.classes["@mozilla.org/storage/service;1"]  
            .getService(Components.interfaces.mozIStorageService);
        
        // will also create the file if it does not exist
        dbConn = storageService.openDatabase(file);
    } ());
    
    var SUCCESS = Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED;
    
    return {
        Store: libx.core.Class.create({
            
            async: true,
            
            initialize: function(storeName) {
                this.storeName = storeName;
                if(!dbConn.tableExists(storeName))
                    dbConn.createTable(storeName, 'key TEXT  PRIMARY KEY  NOT NULL  UNIQUE, value TEXT');
            },
        
            executeStatement: function(statement, success, error, complete) {
                var callbackObj = {
                    handleCompletion: libx.core.EmptyFunction,
                    handleError: libx.core.EmptyFunction,
                    handleResult: libx.core.EmptyFunction
                };
                if(complete)    callbackObj.handleCompletion = complete;
                if(error)       callbackObj.handleError = error;
                if(success)     callbackObj.handleResult = success;
                
                statement.executeAsync(callbackObj);
            },
        
            /**
             * Retrieves an object from storage with the given key.
             *
             * @param {Object}      paramObj            contains properties
             *                                          used for retrieval
             * 
             * @param {String}      paramObj.key        (REQUIRED) key to store
             * 
             * @param {String}      paramObj.value      (REQUIRED) value to store
             * 
             * @param {Function}    paramObj.success    function to execute upon
             *                                          success
             * @param {Function}    paramObj.error      function to execute upon
             *                                          errors
             */
            setItem: function(paramObj) {
                var statement = dbConn.createStatement("INSERT OR REPLACE INTO " + this.storeName + " (key, value) VALUES(:key, :value)");
                statement.params.key = paramObj.key;
                statement.params.value = paramObj.value;
                
                if(this.async)
                    this.executeStatement(statement, null, null, function (stat) {
                        if (stat == SUCCESS)
                            paramObj.success && paramObj.success();
                        else
                            paramObj.error && paramObj.error();
                    }); 
                else {
                    statement.execute();
                    paramObj.success && paramObj.success();
                }
            },
            
            /**
             * Retrieves an object from storage with the given key.
             *
             * @param {Object}      paramObj            contains properties used for retrieval
             * 
             * @param {String}      paramObj.key        key to look up (required)
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
                var statement = dbConn.createStatement("SELECT value FROM " + this.storeName + " WHERE key = :key");
                statement.params.key = paramObj.key;
                var resultFound = false;
                
                if (this.async) {
                    var success = function(aResultSet) {
                        resultFound = true;
                        if (paramObj.success) {
                            var row = aResultSet.getNextRow();
                            paramObj.success(row.getResultByName("value"));
                        }
                    };
                    var complete = function(aReason) {
                        if (paramObj.notfound && !resultFound && aReason == SUCCESS)
                            paramObj.notfound();
                    }
                    
                    this.executeStatement(statement, success, paramObj.error, complete);
                } else {
                    if (statement.executeStep()) {
                        paramObj.success && paramObj.success(statement.row.value);
                    } else if (paramObj.notfound)
                        paramObj.notfound();
                }
            },
            
            /**
             * Removes an object from storage with the given key.
             *
             * @param {Object}      paramObj contains properties used for retrieval
             * 
             * @param {String}      paramObj.key        (REQUIRED) key to look up
             * 
             * @param {Function}    paramObj.error      function to execute upon
             *                                          errors
             *                                          
             * @param {Function}    paramObj.success    function to execute upon
             *                                          success
             */
            removeItem: function(paramObj) {
                var statement = dbConn.createStatement("DELETE FROM " + this.storeName + " WHERE key = :key");
                statement.params.key = paramObj.key;
                
                if(this.async) {
                    this.executeStatement(statement, null, null, function (stat) {
                        if (stat == SUCCESS)
                            paramObj.success && paramObj.success();
                        else
                            paramObj.error && paramObj.error();
                    });
                } else {
                    statement.execute();
                    paramObj.success && paramObj.success();
                }
            },
            
            /**
             * Retrieves all items matching a given pattern.
             *
             * @param {Object}      paramObj            contains properties used
             *                                          for retrieval
             * 
             * @param {String}      paramObj.pattern    pattern to search; if not
             *                                          provided, all items will be
             *                                          returned
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
                if(!pattern)
                    pattern = /.*/;
                
                var statement = dbConn.createStatement("SELECT key FROM " + this.storeName);
                
                if (this.async) {
                    // multiple partial result sets are returned; wait until
                    // complete callback to signal success so all results can be
                    // received simultaneously
                    var success = function(aResultSet) {
                        for (var row = aResultSet.getNextRow(); row; row = aResultSet.getNextRow()) {  
                            var itemName = row.getResultByName("key");
                            if (pattern.test(itemName))
                                matches.push(itemName);
                        }
                    };
                    
                    var complete = function (aReason) {
                        // query neither encountered an error nor was aborted
                        if (aReason == SUCCESS && paramObj.success)
                            paramObj.success(matches);
                    };
                    
                    this.executeStatement(statement, success, paramObj.error, complete);
                } else {
                    while (statement.executeStep()) {
                        if (pattern.test(statement.row.key))
                            matches.push(statement.row.key);
                    }  
                    paramObj.success && paramObj.success(matches);
                }
                
            },
            
            /**
             * Clears the local storage.
             *
             * @param {Object}      paramObj            contains properties used
             *                                          for retrieval
             *
             * @param {Function}    paramObj.success    success callback
             * 
             * @param {Function}    paramObj.error      function to execute upon
             *                                          errors
             */
            clear: function(paramObj) {
                var statement = dbConn.createStatement("DELETE FROM " + this.storeName);
                
                if (this.async) {
                    if (!paramObj)
                        paramObj = {};
                    this.executeStatement(statement, null, null, function (stat) {
                        if (stat == SUCCESS)
                            paramObj.success && paramObj.success();
                        else
                            paramObj.error && paramObj.error();
                    });
                } else {
                    statement.execute();
                    paramObj.success && paramObj.success();
                }
            }
        })
    };
    
}) ();

libx.storage.metacacheStore = new libx.storage.Store('metacache');
libx.storage.cacheStore = new libx.storage.Store('cache');
libx.storage.prefsStore = new libx.storage.Store('prefs');

