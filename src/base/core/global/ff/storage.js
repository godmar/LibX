
/**
 * Namespace for storage utilities.
 * @namespace
 */
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
        Store: libx.core.Class.create(
            /** @lends libx.storage.Store.prototype */ {
            
            /**
             * Whether the operations are asynchronous.
             * @deprecated this is currently only supported in Firefox and only
             *             used in the cache template; it should likely be
             *             removed.
             * @default true
             */
            async: true,
            
            /**
             * @param {String} storeName  the ID of this store
             * @constructs
             */
            initialize: function(storeName) {
                this.storeName = storeName;
                if(!dbConn.tableExists(storeName))
                    dbConn.createTable(storeName, 'key TEXT  PRIMARY KEY  NOT NULL  UNIQUE, value TEXT');
            },
        
            // firefox only helper method
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
             * Sets an object in storage.
             *
             * @param  {Object}   paramObj  contains properties used for retrieval
             * @config {String}   key       key to store
             * @config {String}   value     value to store
             * @config {Function} success   (optional) function to execute upon success
             * @config {Function} error     (optional) function to execute upon errors
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
             * @param  {Object} paramObj      contains properties used for retrieval
             * @config {String} key           key to store
             * @config {Function(result)} success  (optional) function to execute upon
             *         success.  accepts one argument, which is the fetched
             *         result string.
             * @config {Function()} error     (optional) function to execute upon errors
             * @config {Function()} notfound  (optional) function to execute if the given
             *                                key is not in storage
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
             * @param  {Object} paramObj     contains properties used for retrieval
             * @config {String} key          key to store
             * @config {Function()} success  (optional) function to execute upon success
             * @config {Function()} error    (optional) function to execute upon errors
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
             * Retrieves all keys in this store matching a given pattern.
             *
             * @param {Object}    paramObj  contains properties used
             *                              for retrieval
             * @config {String}   pattern   pattern to search. by default, all
             *                              keys will be returned.
             * @config {Function()} error   (optional) function to execute upon
             *                              errors
             * @config {Function(result)} success  function to execute when
             *                              results are returned; takes a single
             *                              parameter which is an array of
             *                              strings of each matched item key.
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
             * @param  {Object}   paramObj    (optional) contains properties used
             *                                for retrieval
             * @config {Function()} success   (optional) executed after store is cleared
             * @config {Function()} error     (optional) function to execute upon
             *                                errors
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
                    paramObj && paramObj.success && paramObj.success();
                }
            }
        })
    };
    
}) ();

libx.storage.metacacheStore = new libx.storage.Store('metacache');
libx.storage.cacheStore = new libx.storage.Store('cache');
libx.storage.prefsStore = new libx.storage.Store('prefs');

