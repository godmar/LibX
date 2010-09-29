
var popup = (function() {
    
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
                $(this).val(libx.locale.getProperty($.trim($(this).val())));
            else
                $(this).text(libx.locale.getProperty($.trim($(this).text())));
        });
        
        // show translation credits
        if(libx.locale.getProperty('translator'))
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
            libx.libapp.loadedLibapps = [];
            // load config if user has one set
            var configUrl = libx.utils.browserprefs.getStringPref('libx.edition.configurl', null);
            if(configUrl)
                libx.loadConfig(configUrl);
        });
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
        var searchOptions = $.map(libx.edition.catalogs[index].options.split(';'), function(i) {
            return {
                text: libx.edition.searchoptions[i],
                value: i
            };
        });
        
        simpleSelectedOption = searchOptions[0].value;
        
        // populate simple view with search options
        accordionMenu.setMenuItems($('#simple-menu-options'), searchOptions[0].text, searchOptions,
            function(value, text) {
                simpleSelectedOption = value;
            }
        );
        
        // reset all fields in the full view
        $('#full-search-fields').empty();
        fullSelectedOptions = [];
        var numFields = 0;
        
        // add a search field to the full view
        function addField() {
            var index = numFields++;
            fullSelectedOptions[index] = searchOptions[0].value;
            
            var field = $('<tr><td></td>' +
                          '<td><input type="text"/></td>' +
                          '<td><a href="#">' + libx.locale.getProperty('search_more') + '</a></td></tr>');
            
            // add another field when use clicks "more..." link
            $('a', field.appendTo($('#full-search-fields'))).click(function() {
                $(this).replaceWith('<span>' + libx.locale.getProperty('search_and') + '</span>');
                addField();
            });

            // create search options drop-down for this field
            var link = $('<a href="#">' + searchOptions[0].text + '</a>');
            $('td:first', field).append(link);
            libx.ui.jquery.dropdown($, {
                dropdown_items: searchOptions,
                field: link,
                select: function(key, val) {
                    fullSelectedOptions[index] = key;
                }
            });
            
            focus($('input', field));
            
        };
        addField();
        
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
    
});