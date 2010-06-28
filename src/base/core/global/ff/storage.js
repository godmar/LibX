
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
    
    function executeStatement(statement, success, error, complete) {
        var callbackObj = {
            handleCompletion: libx.core.EmptyFunction,
            handleError: libx.core.EmptyFunction,
            handleResult: libx.core.EmptyFunction
        };
        if(complete)    callbackObj.handleCompletion = complete;
        if(error)       callbackObj.handleError = error;
        if(success)     callbackObj.handleResult = success;
        
        statement.executeAsync(callbackObj);  
    }
    
    return {
        Store: libx.core.Class.create({
            
            initialize: function(storeName) {
                this.storeName = storeName;
                if(!dbConn.tableExists(storeName))
                    dbConn.createTable(storeName, 'key TEXT  PRIMARY KEY  NOT NULL  UNIQUE, value TEXT');
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
             * @param {Function}    paramObj.complete   function to execute upon
             *                                          call completion
             *                                          
             * @param {Function}    paramObj.error      function to execute upon
             *                                          errors
             */
            setItem: function(paramObj) {
                var statement = dbConn.createStatement("INSERT OR REPLACE INTO " + this.storeName + " (key, value) VALUES(:key, :value)");
                statement.params.key = paramObj.key;
                statement.params.value = paramObj.value;
                
                executeStatement(statement, paramObj.success, paramObj.error, paramObj.complete); 
                
            },
            
            /**
             * Retrieves an object from storage with the given key.
             *
             * @param {Object}      paramObj            contains properties used for retrieval
             * 
             * @param {String}      paramObj.key        key to look up (required)
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
                var statement = dbConn.createStatement("SELECT value FROM " + this.storeName + " WHERE key = :key");
                statement.params.key = paramObj.key;
                var resultFound = false;
                
                var success = function(aResultSet) {
                    resultFound = true;
                    if(paramObj.success) {
                        var row = aResultSet.getNextRow();
                        paramObj.success(row.getResultByName("value"));
                    }
                };
                var complete = function(aReason) {
                    if(paramObj.notfound && !resultFound &&
                            aReason == Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED)
                        paramObj.notfound();
                    if(paramObj.complete)
                        paramObj.complete();
                }
                
                executeStatement(statement, success, paramObj.error, complete);
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
                if(!pattern)
                    pattern = /.*/;
                
                var statement = dbConn.createStatement("SELECT key FROM " + this.storeName);
                
                // multiple partial result sets are returned; wait until
                // complete callback to signal success so all results can be
                // received simultaneously
                var success = function(aResultSet) {
                    for (var row = aResultSet.getNextRow(); row; row = aResultSet.getNextRow()) {  
                        var itemName = row.getResultByName("key");
                        if(pattern.test(itemName))
                            matches.push(itemName);
                    }
                };
                
                var complete = function(aReason) {
                    // query neither encountered an error nor was aborted
                    if(aReason == Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED &&
                            paramObj.success)
                        paramObj.success(matches);
                    if(paramObj.complete)
                        paramObj.complete();
                };
                
                executeStatement(statement, success, paramObj.error, complete);
                
            },
            
            /**
             * Clears the local storage.
             *
             * @param {Object}      paramObj            contains properties used
             *                                          for retrieval
             * 
             * @param {Function}    paramObj.complete   function to execute upon
             *                                          call completion
             *                                          
             * @param {Function}    paramObj.error      function to execute upon
             *                                          errors
             */
            clear: function(paramObj) {
                var statement = dbConn.createStatement("DELETE FROM " + this.storeName);
                
                if(!paramObj)
                    paramObj = {};
                
                executeStatement(statement, paramObj.success, paramObj.error, paramObj.complete);
            }
        })
    };
    
}) ();
