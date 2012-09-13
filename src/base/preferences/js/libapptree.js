/* Libapp Menu Tree Controls */
(function () {

var displaymode = false;

if (self.data && self.data.libappdisplaymode)
    displaymode = true;

    /*
     * Stand-Alone mode == displaymode, If true remove checkboxes from
     * our display tree
    if (displaymode)
    {
        $checkTree.find(".checked").hide()
                                   .end()
                                   .find(".uncheckable")
                                   .removeClass("uncheckable")
                                   .addClass("bullet-point");
        $("#libapps-tmpl")
                      .addClass("ui-tabs ui-widget ui-widget-content ui-corner-all")
                      .css("background","transparent");

    } 
     */
    
    /* When saving preferences because user checks/unchecks
     * if this entry is a root package, reloadPackages() will reset the package schedulers
     *
    if ($.inArray($li.data('id'), libx.libapp.getPackages()) >= 0)
        libx.libapp.reloadPackages();
    else
        libx.libapp.clearOverridden();      IS THIS NECESSARY?
    */

/**
 * New version begins here.
 */

var entry2StringBundle = { };

// last entry created for a given 'id'
var entryid2entry = { };

/* 
 * Create a package walk to create a JSON model for all subscribed packages, 
 * which will then function as an angular view.
 *
 * This will replicate entries for leaf modules.
 */
var EntryWalker = libx.core.Class.create(libx.libapp.PackageVisitor, {
    initialize: function (rootPackages) {
        this.rootPackages = rootPackages;
    },
    walk: function (whenDoneCallback) {
        console.log("walking to get model");
        this.queue = new libx.utils.collections.ActivityQueue();
        var self = this;
        var model = { isroot: true, children: [] };
        this.isDone = {
            onready: function () {
                function sortChildren(pkg) {
                    pkg.children.sort(function (e1, e2) {
                        if (e1.type == "package" && e2.type == "libapp")
                            return -1;
                        if (e2.type == "package" && e1.type == "libapp")
                            return 1;
                        return e1.title == e2.title ? 0 : e1.title < e2.title ? -1 : 1;
                    });

                    pkg.children.filter(function (e) { return e.type == "package"; }).map(function (pkg) {
                        sortChildren(pkg);
                    });
                }

                sortChildren(model);
                whenDoneCallback(model);
            }
        };
        this.queue.scheduleLast(this.isDone);
        for (var i = 0; i < this.rootPackages.length; i++) {
            new libx.libapp.PackageWalker(this.rootPackages[i].url).walk(this, model);
        }
        this.isDone.markReady();
    },
    getLocale : function (url) {
        libx.locale.getBundle({
            feed: url,
            success: function (bundle) {
                entry2StringBundle[url] = bundle;
            },
            error: function () {
                libx.log.write("error: could not load string bundle for " + url);
            }
        });
    },
    onpackage: function(pkg,prep,parent) {
        libx.prefs.getCategoryForUrl(pkg.id,
                        [{ name: "_enabled", type: "boolean", value: "true" }]);

        parent.children.push(pkg);
        pkg.parent = parent;
        pkg.children = [];
        entryid2entry[pkg.id] = pkg;
        this.getLocale(pkg.id);
        this.parent(pkg,prep,pkg);
        prep.blocker.markReady();
    },
    onlibapp: function(libapp,prep,parent) {
        libx.prefs.getCategoryForUrl(libapp.id,
                        [{ name: "_enabled", type: "boolean", value: "true" }]);

        parent.children.push(libapp);
        libapp.parent = parent;
        libapp.children = [];
        this.getLocale(libapp.id);
        entryid2entry[libapp.id] = libapp;
        this.parent(libapp,prep,libapp);
        prep.blocker.markReady();                    
    },
    onmodule: function (module,prep,parent) {
        libx.prefs.getCategoryForUrl(module.id,
           [{ name: "_enabled", type: "boolean", value: "true" }]);

        module.parent = parent;
        parent.children.push(module);
        entryid2entry[module.id] = module;
        this.getLocale(module.id);
        prep.blocker.markReady();
    },
    beforeentry: function (entryUrl) {
        var prep = {
            blocker: new libx.utils.collections.EmptyActivity(),
            packageUrl: entryUrl
        }; 
        this.queue.scheduleFirst(prep.blocker);
        return prep;
    },
    error: function (err,prep,parent) {
        parent.children.push({
            type: "error",
            parent: parent,
            id: prep.packageUrl,
            title: err
        });
        prep.blocker.markReady();
    }
});

TreeController = function ($scope, $compile) {
    $scope.displaymode = displaymode;
    $scope.formatDate = function (dtStr) {
        dtStr = new Date(dtStr);
        var dt = dtStr.toDateString().split(" ");
        dt = dt[0]+", "+dt[2]+" "+dt[1]+" "+dt[3];
        dtStr = dtStr.toTimeString().split(" ");
        dtStr = dt+" "+dtStr[0]+" "+dtStr[2];
           
        return dtStr;
    }

    $scope.locale = function (lkey, name) {
        var _idstr_format = /libx\.prefs\.(http.*)\.(\S+)/;
        var m = lkey.match(_idstr_format);
        if (m != null) {
            var url = m[1];
            var key = m[2];
            if (entry2StringBundle[url] && entry2StringBundle[url].hasProperty(key))
                return entry2StringBundle[url].getProperty(key);

            // fallback - look in locales of children (when libapp
            // pref's locale is specified in module.)
            var e = entryid2entry[url];
            for (var i = 0; e.children && i < e.children.length; i++) {
                var modid = e.children[i].id;
                if (entry2StringBundle[modid] && entry2StringBundle[modid].hasProperty(key))
                    return entry2StringBundle[modid].getProperty(key);
            }
        }

        return $scope.$parent.locale(lkey);
    }

    $scope.formatIfRegexp = function (p) {
        if (p && p.regex) {
            return new RegExp(p.regex,p.flag).toString();
        } else {
            return p;
        }
    }

    /* replace URLs with hyperlinks. */
    $scope.hyperlink = function (text) {
        var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return text.replace(exp,"<a href='$1' target='_blank'>$1</a>"); 
    }

    $scope.isEmptyObject = function (obj) {
        for (key in obj) {
            if (obj.hasOwnProperty(key))
                return false;
        }
        return true;
    }

    $scope.resolveparam = function (libapp, paramname) {
        var value = { value: "__magic__unknown__", type: "__magic__unknown__" };
        libapp.entries.forEach(function (e) {
            if (e.args != null && paramname in e.args)
                value = e.args[paramname];
        });
        return value;
    }

    $scope.unexpectedargs = function (entry) {
        var args = { };
        if (entry.parent.entries == null)
            return args;

        entry.parent.entries.forEach(function (e) {
            if (e.url == entry.id) {
                for (var argname in e.args) {
                    if (entry.params != null && !(argname in entry.params)) {
                        args[argname] = e.args[argname];
                    }
                }
            }
        });
        return args;
    }

    /* Check tree functionality -
     * turn off/on descendants for intermediate nodes.
     * turn off/on anchestors if all descendants show same state.
     */
    $scope.flipentry = function (entry) {
        var newvalue = libx.prefs[entry.id]._enabled._value = !libx.prefs[entry.id]._enabled._value;

        function checkDescendants(children, newvalue) {
            if (children === undefined)
                return;

            for (var i = 0; i < children.length; i++) {
                libx.prefs[children[i].id]._enabled._value = newvalue;
                checkDescendants(children[i].children, newvalue);
            }
        }
        checkDescendants(entry.children, newvalue);

        function checkSiblings(entry, newvalue) {
            for (var i = 0; i < entry.children.length; i++) {
                if (libx.prefs[entry.children[i].id]._enabled._value != newvalue)
                    return;
            }
            libx.prefs[entry.id]._enabled._value = newvalue;
            checkSiblings(entry.parent, newvalue);
        }
        checkSiblings(entry.parent, newvalue);
    }

    function loadPackages() {
        var rootPackages = libx.libapp.getPackages().map(function (pkg) {
            return { url: pkg };
        });

        var constructEntryModel = new EntryWalker(rootPackages);
        constructEntryModel.walk(function (model) {
            console.dir(model);
            $scope.$apply(function () {
                $scope.model = model;
            });

            setTimeout(function () {
                /* Calling this immediately does not work since $apply is not synchronous */
                $("#libapps-tmpl").find(".tooltip-noicon").tooltip({
                    delay: 0,
                    icon: false,
                    extraClass: "ui-state-default ui-corner-all ui-widget"
                });
            }, 2000);
        });
    }
    loadPackages();

    function reloadPackages() {
        /* NB: reloadPackages starts package schedulers, but doesn't 
         * wait for them to finish. */
        libx.libapp.reloadPackages();
        loadPackages();
    }

    /* Users may not unsubscribe from packages listed in config.xml, but they
     * can disable them. */
    $scope.userMayUnsubscribe = function (entry) {
        var isInConfig = libx.edition.localizationfeeds.package.map(function (pkg) {
            return pkg.url;
        }).indexOf(entry.id) != -1;

        return entry.parent.isroot && !isInConfig;
    }

    $scope.unsubscribe = function (id) {
       if (libx.libapp.removeUserPackage(id))
           reloadPackages();
    }

    // XXX convert to angular
    $("#libapps-subscribe-form").submit(function () {
        var feed = $(this).children("input").val();
        if (feed && libx.libapp.addUserPackage(feed)) {
            reloadPackages();
        }
        return false;
    });

    /* run jQuery tooltip */
    $("#libapps-tmpl").find(".tooltip").tooltip({
        delay: 0,
        icon: true,
        extraClass: "ui-state-default ui-widget ui-corner-all"
    });
    
    if (displaymode) {
        $("#libapps-subscribe-form").hide();                      
    } else {
        $("#libapps-banner").hide();
    }
}

}) ();
