/**
 * Implement LibX storage using localStorage.
 * See http://dev.w3.org/html5/webstorage/
 */
libx.storage = {
    Store: libx.core.Class.create({
        
        initialize: function(prefix) {
            this.prefix = prefix + '.';
        },
        
        setItem: function(paramObj) {
            localStorage.setItem(this.prefix + paramObj.key, paramObj.value);
            paramObj.success && paramObj.success();
        },
        
        getItem: function(paramObj) {
            var value = localStorage.getItem(this.prefix + paramObj.key);
            if (value == null)
                paramObj.notfound && paramObj.notfound();
            else
                paramObj.success && paramObj.success(value);
        },
        
        find: function(paramObj) {
            var matches = [];
            var pattern = paramObj.pattern;
            if (!pattern)
                pattern = /.*/;
            for (var i in localStorage) {
                if (i.indexOf(this.prefix) == 0) {
                    var itemName = i.substr(this.prefix.length);
                    if (pattern.test(itemName))
                        matches.push(itemName);
                }
            }
            paramObj.success && paramObj.success(matches);
        },
        
        removeItem: function(paramObj) {
            var value = null;
            localStorage.removeItem(this.prefix + paramObj.key);
            paramObj.success && paramObj.success();
        },

        clear: function(paramObj) {
            for (var i in localStorage)
                if (i.indexOf(this.prefix) == 0)
                    localStorage.removeItem(i);
            paramObj && paramObj.success && paramObj.success();
        }
    })
    
};

libx.storage.metacacheStore = new libx.storage.Store('metacache');
libx.storage.cacheStore = new libx.storage.Store('cache');
libx.storage.prefsStore = new libx.storage.Store('prefs');
