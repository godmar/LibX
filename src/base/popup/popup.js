
var popup = (function() {
    
// the menu element for the simple view
var accordionMenu = null;

// option selected for the simple view
var simpleSelectedOption = null;

// option(s) selected for the full view
var fullSelectedOptions = null;

return {
    
    // first time popup is being shown
    firstLoad: true,
    
    setLocale: function() {
        $('.set-locale').each(function() {
            if(this.tagName == 'INPUT')
                $(this).val(libx.locale.getProperty($.trim($(this).val())));
            else
                $(this).text(libx.locale.getProperty($.trim($(this).text())));
        });
    },
    
    showEditionChange: function() {
        if(libx.utils.browserprefs.getStringPref('libx.edition.configurl', null))
            $('#change-edition-cancel').show();
        else
            $('#change-edition-cancel').hide();
        $('#tabs').hide();
        $('#change-edition-view').show();
        setTimeout(function() {
            $('#edition-search-input').focus();
        }, 0);
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
        libx.utils.browserprefs.setIntPref('libx.edition.selectedcatalog', index);
        
        // create mapping of search options
        var searchOptions = $.map(libx.edition.catalogs[index].options.split(';'), function(i) {
            return { text: libx.edition.searchoptions[i], value: i };
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
            
            var field = $('<tr><td nowrap="nowrap"></td>' +
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
            
            setTimeout(function() { $('input', field).focus(); }, 0);
            
        };
        addField();
        
    },
    
    /* Loads the popup view.  Resets fields if they were previously loaded. */
    loadPopup: function() {

        // show error if edition is not set
        if(!libx.edition) {
            libx.utils.browserprefs.setBoolPref('libx.edition.displayadvanced', true);
            popup.showFullOrSimple();
            $('#edition-name-header').text('');
            var configUrl = libx.utils.browserprefs.getStringPref('libx.edition.configurl', null);
            $('#error-url').text(configUrl);
            $('#change-edition-view').hide();
            $('#tabs').hide();
            $('#error-view').show();
            $('#error-change-edition').click(function() {
                $('#error-view').hide();
                popup.showEditionChange();
            });
            return false;
        }
        
        $('.switch-display').css('display', 'block');
        
        // load the edition name
        $('#edition-name-header').text(libx.edition.name.edition);

        // automatically select saved catalog if it exists
        // select first catalog otherwise
        var catalog = libx.utils.browserprefs.getIntPref('libx.edition.selectedcatalog', 0);
        
        // populate catalogs from config file
        var catalogs = [];
        for(var i = 0; i < libx.edition.catalogs.length; i++) {
            catalogs.push({ text: libx.edition.catalogs[i].name, value: i });
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

        /* Parse remote URL. Temporary implementation until config.xml is
         * updated to not use chrome:// URLs. */
        var imgUrl = libx.utils.browserprefs.getStringPref('libx.edition.configurl', null)
            .replace('/config.xml', '') + libx.edition.options.logo.replace('chrome://libx/skin', '');
        
        var image = $('.edition-image');
        
        libx.cache.defaultObjectCache.get({
            type: 'GET',
            url: imgUrl,
            serverMIMEType: 'text/plain; charset=x-user-defined',
            fetchDataUri: true,
            success: function(data) {
                image[0].src = data;
            }
        });
        
        image.load(function() {
     
            // reset width and height if they were specified
            image.width('');
            image.height('');
            
            // reduce image if necessary, preserving aspect ratio
            var img_width = image[0].width;
            var img_height = image[0].height;
            if(img_width > 75) {
                image.width(75);
                image.height(75 * img_height / img_width);
            }
        });
        
        $('#links').empty();
        $.each(libx.edition.links, function(i, elem) {
            var link = $('<li><a href="#">' + elem.label + '</a></li>');
            link.click(function() {
                libx.ui.tabs.create(elem.href);
            });
            $('#links').append(link);
        });

        $('#about-name').text(libx.edition.name.long);
        $('#about-desc').text(libx.edition.name.description);
        $('#about-adaptedby').text(libx.edition.name.adaptedby);
        
        popup.loadCatalog(catalog);

        popup.showTab('search-view');
        
        return true;

    },
    
    /* Show either the full or basic view based on user preferences. */
    showFullOrSimple: function() {
        if(libx.utils.browserprefs.getBoolPref('libx.edition.displayadvanced', true)) {
            $('#full-view').show();
            $('#simple-view').hide();
            popup.showTab('search-view');
        } else {
            $('#simple-view').show();
            $('#full-view').hide();
            $('#simple-search-form input').focus();
        }
    },

    /* Display the popup and also switch to full or simple the first time it
     * is loaded. */
    showInitialView: function() {
        $('a[href$="#pageactions-view"]', $('#tab-pane')).hide();
        $('#pageactions-view').empty();
        if(popup.loadPopup()) {
            popup.showFullOrSimple();
            popup.loadPageActions();
        }
    },
    
    loadPageActions: function() {
        for(var i in popup.pageActions)
            popup.pageActions[i]();
    },
    
    addPageAction: function(node) {
        $('a[href$="#pageactions-view"]', $('#tab-pane')).show();
        $('<div class="page-action"></div>').appendTo($('#pageactions-view')).append(node);
    },
    
    attachHandlers: function() {
        
        accordionMenu = libx.ui.jquery.accordionmenu($, {
            menu: $('#simple-menu')
        });
        
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
                            libx.utils.browserprefs.setIntPref('libx.edition.selectedcatalog', 0);
                            libx.log.write('Loading config from ' + selectedRevision);
                            try {
                                libx.loadConfig(selectedRevision);
                            } catch(e) {
                                popup.loadPopup();
                            }
                        });
                    }
                });
            }
        });
        
        /*
         * Opens the search URL in a browser tab.
         */
        function doSearch(searchParams) {
            var catalog = libx.utils.browserprefs.getIntPref('libx.edition.selectedcatalog', 0);
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
            var advanced = !libx.utils.browserprefs.getBoolPref('libx.edition.displayadvanced', true);
            libx.utils.browserprefs.setBoolPref('libx.edition.displayadvanced', advanced);
            popup.showFullOrSimple();
        });
        
        // associate tabs with their content
        $('#tab-pane a').click(function() {
            $('#error-view').hide();
            $('#change-edition-view').hide();
            $('#tabs').show();
            $('#content-pane > div').hide();
            $('#tab-pane a').removeClass('selected');
            if($(this).attr('href') == '#search-view')
                setTimeout(function() {
                    $('#full-search-fields input')[0].focus();
                }, 0);
            $(this).addClass('selected');
            $($(this).attr('href')).show();
        });
        
        // show change edition page when link is clicked
        $('#change-edition').click(function() {
            popup.showEditionChange();
        });
        
        // cancel edition change page
        $('#change-edition-cancel').click(function() {
            popup.loadPopup();
        });
        
        // automatically reload the page if edition changes
        libx.events.addListener("EditionConfigurationLoaded", {
            onEditionConfigurationLoaded: function() {
                popup.firstLoad = false;
                popup.showInitialView();
            }
        }, undefined, 'popup_reload');
        
    },
    
    pageActions: {}
    
};

}) ();

$(function() {
    popup.setLocale();
    popup.attachHandlers();

    // show view depending on whether user already has edition loaded
    if(libx.utils.browserprefs.getStringPref('libx.edition.configurl', null))
        popup.showInitialView();
    else {
        popup.showEditionChange();
        popup.loadPageActions();
    }
    
    // notify Firefox that the page has loaded
    var popupLoaded = new libx.events.Event("PopupLoadingDone");
    popupLoaded.notify();
});
