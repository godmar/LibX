
//TODO: change storage from browserprefs to a libx.storage.Store

var popup = (function() {
    
$(function() {
    
    popup.initialize();

    // show view depending on whether user already has edition loaded
    if(libx.utils.browserprefs.getStringPref('libx.edition.configurl', null))
        popup.loadPopup();
    else
        popup.showChangeEditionView();
    
    // load page actions
    for(var i in popup.pageActions)
        popup.pageActions[i]();

    // notify parent window that the popup has finished loading
    var evt = new libx.events.Event('PopupLoaded');
    evt.notify();
    
    // save search fields when popup is closed
    $(window).unload(function () { 
        popup.saveFields();
    })
    
});
    
// the menu element for the simple view
var accordionMenu = null;

// option selected for the simple view
var simpleSelectedOption = null;

// option(s) selected for the full view
var fullSelectedOptions = null;

// delay focus to fix layout bugs in linux
function focus(node) {
    setTimeout(function() {
        node.focus();
    }, 100);
}

return {
    
    // flag to indicate whether this is the first popup load since the user has
    // opened the popup; becomes false if the user changes edition inside popup
    firstLoad: true,
    
    initialize: function() {
        
        // replace all HTML placeholders with language-specific strings
        $('.set-locale').each(function() {
            if(this.tagName == 'INPUT')
                $(this).val(libx.locale.defaultStringBundle.getProperty($.trim($(this).val())));
            else
                $(this).text(libx.locale.defaultStringBundle.getProperty($.trim($(this).text())));
        });
        
        // show translation credits
        if(libx.locale.defaultStringBundle.getProperty('translator'))
            $('#about-translator').show();
        
        accordionMenu = libx.ui.jquery.accordionmenu($, {
            menu: $('#simple-menu')
        });
        
        // attach autocomplete to search input
        libx.ui.jquery.autocomplete($, {
            field: $('#edition-search-input'),
            make_url: function (part) {
                return "http://libx.org/editions/search?q=" 
                    + encodeURIComponent(part) + "&callback=?";
            },
            formatter: function (je) {
                return "<b>" 
                    + je.shortDesc + "</b> (id: " + je.id + ") maintained by <i>" 
                    + je.maintainers + "</i>";
            },
            select: function(selectedEdition) {
                $('#edition-search-details').show();

                // show edition name and maintainers
                $('#edition-search-name').text(selectedEdition.shortDesc);
                $('#edition-search-maintainers').empty();
                $(selectedEdition.maintainers.split(",")).each(
                    function(i, elem) {
                        $('#edition-search-maintainers').append("<li>" + elem + "</li>");
                    }
                );

                // highlight text after user makes selection
                $('#edition-search-input').select();

                var revisions = $('#edition-search-select');
                revisions.empty();

                // reset load button if user already loaded an edition
                $('#edition-search-load').unbind('click');

                // get the revisions for this edition and populate search box 
                $.ajax({
                    type: "GET",
                    url: "http://libx.org/editions/config/" + selectedEdition.id,
                    dataType: "json",
                    success: function(json) {
                        
                        var map = [];
                        for(var rev in json.revisions) {
                            var elem = {
                                text: rev,
                                value: json.revisions[rev].config
                            };
                            map.push(elem);
                        }
                        map.sort(function(a, b) {
                            a = a.text;
                            b = b.text;
                            if(!isNaN(a) && !isNaN(b)) {
                                a = parseInt(a);
                                b = parseInt(b);
                            }
                            if(a < b) return -1;
                            if(b < a) return 1;
                            return 0;
                        });
                        var selectedRevision = map[map.length-1].value;
                        var link = $('<a href="#">' + map[map.length-1].text + '</a>');
                        $('#edition-search-select').append(link);
                        
                        libx.ui.jquery.dropdown($, {
                            dropdown_items: map,
                            field: link,
                            select: function(url) {
                                selectedRevision = url;
                            }
                        });
                        
                        $('#edition-search-load').click(function() {
                            libx.utils.browserprefs.setStringPref('libx.edition.configurl', selectedRevision);
                            // reset catalog index when changing editions
                            libx.utils.browserprefs.setIntPref('libx.popup.selectedcatalog', 0);
                            libx.log.write('Loading config from ' + selectedRevision);
                            libx.loadConfig(selectedRevision);
                        });
                    }
                });
            }
        });
        
        /* Opens the search URL in a browser tab. */
        function doSearch(searchParams) {
            var catalog = libx.utils.browserprefs.getIntPref('libx.popup.selectedcatalog', 0);
            libx.ui.tabs.create(libx.edition.catalogs[catalog].search(searchParams));
        }
        
        // attach full search event
        $('#search-view form').submit(function() {
            var searchParams = [];
            $('#full-search-fields input').each(function(i) {
                searchParams.push({
                    searchType: fullSelectedOptions[i],
                    searchTerms: $(this).val()
                });
            });
            doSearch(searchParams);
        });
        
        // attach simple search event
        $('#simple-search-form').submit(function() {
            var searchParams = [{
                searchType: simpleSelectedOption,
                searchTerms: $('#simple-search-form input').val()
            }];
            doSearch(searchParams);
        });
        
        // attach event to switch between full/simple views
        $('.switch-display').click(function() {
            var advanced = !libx.utils.browserprefs.getBoolPref('libx.popup.showfullview', true);
            libx.utils.browserprefs.setBoolPref('libx.popup.showfullview', advanced);
            popup.showPreferredView();
        });
        
        // associate tabs with their content
        $('#tab-pane a').click(function() {
            $('#error-view').hide();
            $('#change-edition-view').hide();
            $('#tabs').show();
            $('#content-pane > div').hide();
            $('#tab-pane a').removeClass('selected');
            if($(this).attr('href') == '#search-view')
                focus($('#full-search-fields input')[0]);
            $(this).addClass('selected');
            $($(this).attr('href')).show();
        });
        
        // show change edition page when link is clicked
        $('#change-edition').click(function() {
            popup.showChangeEditionView();
        });
        
        // cancel edition change page
        $('#change-edition-cancel').click(function() {
            popup.showTab('search-view');
        });
        
        // automatically reload the page if edition changes
        libx.events.addListener("EditionConfigurationLoaded", {
            onEditionConfigurationLoaded: function() {
                popup.firstLoad = false;
                popup.loadPopup();
            }
        }, undefined, 'popup_reload');
        
        $('#clearCache').click(function() {
            var cache = new libx.storage.Store('cache');
            var metacache = new libx.storage.Store('metacache');
            metacache.clear();
            cache.clear();
            delete libx.edition;
            // load config if user has one set
            var configUrl = libx.utils.browserprefs.getStringPref('libx.edition.configurl', null);
            if(configUrl)
                libx.loadConfig(configUrl);
        });
    },
    
    saveFields: function () {
        var searchFields = [];
        $("#full-search-fields input").each(function (i) {
            searchFields.push({
                option: fullSelectedOptions[i],
                value: $(this).val()
            });
        });
        libx.utils.browserprefs.setStringPref("libx.popup.searchfields", libx.utils.json.stringify(searchFields));
    },
    
    showFullView: function() {
        $('#simple-view').hide();
        $('#full-view').show();
    },
    
    showSimpleView: function() {
        $('#full-view').hide();
        $('#simple-view').show();
    },
    
    showPreferredView: function() {
        if(libx.utils.browserprefs.getBoolPref('libx.popup.showfullview', true)) {
            popup.showFullView();
            popup.showTab('search-view');
        } else {
            popup.showSimpleView();
            focus($('#simple-search-form input'));
        }
    },
    
    showErrorView: function() {
        popup.showFullView();
        $('#edition-name-header').text('');
        var configUrl = libx.utils.browserprefs.getStringPref('libx.edition.configurl', null);
        $('#error-url').text(configUrl);
        $('#change-edition-view').hide();
        $('#tabs').hide();
        $('#error-view').show();
        $('#error-change-edition').click(function() {
            $('#error-view').hide();
            popup.showChangeEditionView();
        });
    },
    
    showChangeEditionView: function() {
        popup.showFullView();
    
        // allow user to go back to previous screen if an edition is loaded
        if(libx.edition)
            $('#change-edition-cancel').show();
        else
            $('#change-edition-cancel').hide();
            
        $('#tabs').hide();
        $('#change-edition-view').show();
        focus($('#edition-search-input'));
        $('#edition-search-input').val('');
        $('#edition-search-details').hide();        
    },
    
    /* Display a tab. */ 
    showTab: function(viewId) {
        $('a[href$="#' + viewId + '"]', $('#tab-pane')).trigger('click');
    },
    
    /* Load catalog at specified index, along with corresponding search options. */
    loadCatalog: function(index) {

        // save user's catalog selection
        libx.utils.browserprefs.setIntPref('libx.popup.selectedcatalog', index);
        
        // create mapping of search options
        var optionsArray = libx.edition.catalogs[index].options.split(';');
        var optionsMap = $.map(optionsArray, function(i) {
            return {
                text: libx.edition.searchoptions[i],
                value: i
            };
        });
        
        simpleSelectedOption = optionsMap[0].value;
        
        // populate simple view with search options
        accordionMenu.setMenuItems($('#simple-menu-options'), optionsMap[0].text, optionsMap,
            function(value, text) {
                simpleSelectedOption = value;
            }
        );
        
        // reset all fields in the full view
        $('#full-search-fields').empty();
        fullSelectedOptions = [];
        
        // add a search field to the full view
        function addField() {
        
            fullSelectedOptions.push(optionsMap[0].value);
            
            var field = $('<tr><td></td>'
                        + '<td><input class="search-field" type="text"/></td>'
                        + '<td>'
                        +     '<a class="search-field-add" href="#">' + libx.locale.defaultStringBundle.getProperty('search_more') + '</a>'
                        +     '<span class="search-and">' + libx.locale.defaultStringBundle.getProperty('search_and') + '</span>'
                        + '</td>'
                        + '<td><a class="search-field-remove" href="#">[-]</a></td></tr>');
            
            // add another field when use clicks "more..." link
            field
                .appendTo($("#full-search-fields"))
                .find("a.search-field-add").click(function () {
                    
                    // show "AND" once "more..." is clicked
                    $(this).hide();
                    $(this).next().show();
                    
                    addField();
                    
                }).end().find("a.search-field-remove").click(function () {
                
                    // don't allow removal of the last remaining field
                    if (fullSelectedOptions.length == 1)
                        return;
                
                    var fieldIndex = field.parent().children().index(field);
                    fullSelectedOptions.splice(fieldIndex, 1);
                    
                    // if removing the field that shows the "more..." link, show the "more..." link next to a different field
                    if (field.find(".search-field-add").is(":visible")) {
                        field.prev()
                            .find(".search-field-add").show()
                            .end().find(".search-and").hide();
                    }
                    
                    field.remove();
                    
                });

            // create search options drop-down for this field
            var link = $('<a href="#">' + optionsMap[0].text + '</a>');
            $('td:first', field).append(link);
            libx.ui.jquery.dropdown($, {
                dropdown_items: optionsMap,
                field: link,
                select: function(key, val) {
                    fullSelectedOptions[fullSelectedOptions.length-1] = key;
                }
            });
            
            focus($('input', field));
            
        };
        var savedFields = libx.utils.browserprefs.getStringPref("libx.popup.searchfields", null);
        addField();
        if (savedFields) {
            savedFields = libx.utils.json.parse(savedFields);
            for (var i = 1; i < savedFields.length; i++)
                $("#full-search-fields a.search-field-add").last().click();
            $("#full-search-fields input").each(function (i) {
                $(this).val(savedFields[i].value);
                // if search option is in newly selected catalog, keep this search option selected.
                // otherwise, just use the first search option that the catalog supports
                if ($.inArray(savedFields[i].option, optionsArray) != -1) {
                    $(this).parent().prev().find("a").text(libx.edition.searchoptions[savedFields[i].option]);
                    fullSelectedOptions[i] = savedFields[i].option;
                }
            });
        }
        
    },
    
    /* Load the edition into the popup. */
    loadPopup: function() {

        // show error if edition is not set
        if(!libx.edition) {
            popup.showErrorView();
            return;
        }
        
        // reset previously loaded page actions
        $('a[href$="#pageactions-view"]', $('#tab-pane')).hide();
        $('#pageactions-view').empty();
        
        // load the edition information
        $('#edition-name-header').text(libx.edition.name.edition);
        $('#about-name').text(libx.edition.name.long);
        $('#about-desc').text(libx.edition.name.description);
        $('#about-adaptedby').text(libx.edition.name.adaptedby);

        // load user's catalog preference (if it has been set)
        var catalog = libx.utils.browserprefs.getIntPref('libx.popup.selectedcatalog', 0);
        popup.loadCatalog(catalog);
        
        // load catalog selection menus
        var catalogs = [];
        for(var i = 0; i < libx.edition.catalogs.length; i++) {
            catalogs.push({
                text: libx.edition.catalogs[i].name,
                value: i
            });
        }
        var link = $('<a href="#">' + libx.edition.catalogs[catalog].name + '</a>');
        $('#full-catalogs').empty();
        $('#full-catalogs').append(link);
        function catalogChosen(num, name) {
            popup.saveFields();
            popup.loadCatalog(num);
            $('#full-catalogs > a').text(name);
            $('#simple-menu-catalogs > a').text(name);
        }
        libx.ui.jquery.dropdown($, {
            dropdown_items: catalogs,
            field: link,
            select: catalogChosen
        });
        accordionMenu.setMenuItems($('#simple-menu-catalogs'),
                libx.edition.catalogs[catalog].name, catalogs, catalogChosen);

        // load edition image
        var image = $('.edition-image');
        libx.utils.getEditionResource({
            url: libx.edition.options.logo,
            success: function (data) {
                image.attr('src', data);
            }
        });
        image.load(function() {
            // reset image width/height if changing edition image
            image.width('');
            image.height('');
            // reduce image if necessary, preserving aspect ratio
            var img_width = image.attr('width');
            var img_height = image.attr('height');
            if(img_width > 75) {
                image.css('width', '75px');
                image.css('height', (75 * img_height / img_width) + 'px');
            } else {
                image.css('width', img_width + 'px');
                image.css('height', img_height + 'px');
            }
        });
        
        // load edition links
        $('#links').empty();
        $.each(libx.edition.links, function(i, elem) {
            var link = $('<li><a href="#">' + elem.label + '</a></li>');
            link.click(function() {
                libx.ui.tabs.create(elem.href);
            });
            $('#links').append(link);
        });
        
        popup.showPreferredView();

    },
    
    /* Create an action in the Page Actions tab. */
    addPageAction: function(node) {
        $('a[href$="#pageactions-view"]', $('#tab-pane')).show();
        $('<div class="page-action"></div>').appendTo($('#pageactions-view')).append(node);
    },
    
    /* Namespace to attach external page action functions.
     * These functions are automatically executed when the popup is displayed. */
    pageActions: {}
    
};

}) ();
