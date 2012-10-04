(function () {
    function updateContextMenu(pref, checked) {
        pref._setValue(checked);

        /* update context menu */
        var idstr = pref._idstr;
        for (var i = 0; i < libx.ui.contextMenu.items.length; i++) {
            var cmItem = libx.ui.contextMenu.items[i];
            if ("libx.prefs.contextmenu." + cmItem.item.prefkey == idstr) {
                libx.ui.contextMenu.update(cmItem.id, { visible: checked });
                break;
            }
        }
    }

    function savePref($el) {
        var id = $el.children(":checkbox").attr("name");
        var pref = libx.preferences.getByID(id);
        var checked = $el.children(".checkbox").hasClass("checked");
        if (!pref)
            return;
        if (pref._value != checked) {
            pref._setValue(checked);
            updateContextMenu(pref, checked);
            libx.preferences.save();
        }
    }
    
    function getContextEntry(entry) {
        var $li = $('<li>'
                  + '  <input type="checkbox"></input>'
                  + '  <label>' + libx.utils.xml.encodeEntities(entry._name) + '</label>'
                  + '  <ul></ul>'
                  + '</li>');
        for (var j = 0; j < entry._children.length; j++) {
            var option = entry._children[j];
            var name = option._name;
            if (name in libx.edition.searchoptions)
                name = libx.locale.defaultStringBundle.getProperty("enabled_option_contextmenu", libx.edition.searchoptions[name]);
            else
                name = libx.locale.defaultStringBundle.getProperty(name + "_contextmenu");
            
            $( '<li>'
            + '  <input type="checkbox" name="' + option._id + '" class="preference-checkbox" '
            + (option._value ? 'checked="checked"' : '') + '/>'
            + '  <label>' + name + '</label>'
            + '</li>').appendTo($li.children("ul"));
                      
        }
        return $li;
    }
    
    function createTree() {
        var $tree = $('<ul class="checktree"></ul>');

        function addEntryType(type) {
            var typeCollection = libx.edition[type];
            if (!typeCollection.length)
                return;
        
            /* add primary first */
            $tree.append(getContextEntry(libx.prefs.contextmenu[typeCollection.primary.name]));

            for (var i = 0; i < typeCollection.length; i++) {
                var aType = libx.edition[type][i];
                var $entry = getContextEntry(libx.prefs.contextmenu[aType.name]);
                if (aType != typeCollection.primary)
                    $tree.append($entry);
            }
        }

        addEntryType("catalogs");
        addEntryType("openurl");

        /* if Google Scholar not in edition catalogs, add it for Magic Search */
        var googleInCatalogs = false;
        for (var i = 0; i < libx.edition.catalogs.length; i++) {
            if (libx.edition.catalogs[i].name == "Google Scholar") {
                googleInCatalogs = true;
                break;
            }
        }
        if (!googleInCatalogs)
            $tree.append(getContextEntry(libx.prefs.contextmenu["Google Scholar"]));

        addEntryType("proxy");

        $("#context-prefs").empty();
        $("#context-prefs").append($tree);
        $tree.checkTree({
            onCheck: savePref,
            onUnCheck: savePref,
            onHalfCheck: savePref
        });
    }

    $(document).ready(function () {
        createTree();
        $("#context-prefs-reset").click(function () {
            /* reset all context menu options to their default values */
            ["catalogs", "openurl", "proxy"].forEach(function (type) {
                libx.edition[type].forEach(function (catalog) {
                    var enabledOptions = {};
                    var enabledOptionsArr = catalog.contextmenuoptions ? catalog.contextmenuoptions.split(';') : [];
                    enabledOptionsArr.forEach(function (option) {
                        enabledOptions[option] = true;
                    });
                    if (libx.edition.options.magicsearchincontextmenu)
                        enabledOptions["magicsearch"] = true;
                    if (catalog.includeincontextmenu)
                        enabledOptions["enabled"] = true;
                    if (catalog.xisbn && catalog.xisbn.includeincontextmenu)
                        enabledOptions["xisbn"] = true;
                    libx.prefs.contextmenu[catalog.name]._children.forEach(function (pref) {
                        updateContextMenu(pref, pref._name in enabledOptions);
                    });
                });
            });
            libx.preferences.save();
            createTree();
        });
    });
}) ();
