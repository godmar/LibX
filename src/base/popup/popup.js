$(function() {
    
    // the menu element for the simple view
    var accordionMenu = libx.ui.jquery.accordionmenu($, {
        menu: $('#simple-menu')
    });
    
    // option selected for the simple view
    var simpleSelectedOption = null;
    
    // option(s) selected for the full view
    var fullSelectedOptions = null;
    
    // mapping of tabs to content panels
    var tabMap = {};
    
    /* Associate tab with content. */
    function setTabToView(tabId, viewId) {
        tabMap[tabId] = viewId;
        $('#' + tabId).click(function() {
            showTab(tabId);
        });
    }
    
    /* Display a tab. */ 
    function showTab(tabId) {
        $('.tab-content').hide();
        $('.tab-item').removeClass('selected');
        if(tabId == 'change-edition-tab') {
            setTimeout(function() { $('#edition-search-input').focus(); }, 0);
            $('#edition-search-input').val('');
            $('#edition-search-details').hide();
        } else {
            if(tabId == 'search-tab')
                setTimeout(function() { $('#full-search-fields input:first').focus(); }, 0);
            $('#' + tabId).addClass('selected');
        }
        $('#' + tabMap[tabId]).show();
    }
    
    /* Load catalog at specified index, along with corresponding search options. */
    function loadCatalog(index) {

        // save user's catalog selection
        libx.utils.browserprefs.setIntPref('libx.edition.selectedcatalog', index);
        
        // create mapping of search options
        var options = libx.edition.catalogs[index].options.split(';');
        var searchOptions = {};
        $(options).each(function(i, elem) {
            var name = libx.edition.searchoptions[elem];
            searchOptions[elem] = name;
        });
        
        // populate simple view with search options
        accordionMenu.setMenuItems($('#simple-menu-options'), searchOptions[options[0]], searchOptions,
            function(key, value) {
                simpleSelectedOption = key;
            }
        );
        simpleSelectedOption = options[0];
        
        // reset all fields in the full view
        $('#full-search-fields').empty();
        fullSelectedOptions = [];
        var numFields = 0;
        
        // add a search field to the full view
        function addField() {
            var index = numFields++;
            fullSelectedOptions[index] = options[0];
            
            var field = $('<tr><td style="padding-right: 10px;" nowrap="nowrap"></td>' +
                               '<td style="width: 100%"><input type="text" style="width: 100%" /></td>' +
                               '<td style="padding-left: 10px"><a href="#">more...</a></td></tr>');
            
            // add another field when use clicks "more..." link
            $('a', field.appendTo($('#full-search-fields'))).click(function() {
                $(this).replaceWith('<span>AND</span>');
                addField();
            });

            // create search options dropdown for this field
            var link = $('<a href="#">' + searchOptions[options[0]] + '</a>');
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
        
    }
    
    /* Loads the popup view.  Resets fields if they were previously loaded. */
    function loadPopup() {

        // show error if edition is not set
        if(!libx.edition) {
            $('#edition-name-header').text('');
            var configUrl = libx.utils.browserprefs.getStringPref('libx.edition.configurl', null);
            $('#error-url').text(configUrl);
            $('#tab-pane').hide();
            $('.tab-content').hide();
            $('#error-view').show();
            $('#error-change-edition').click(function() {
                showTab('change-edition-tab');
            });
            return false;
        }
        
        $('.switch-display').show();
        
        // load the edition name
        $('#edition-name-header').text(libx.edition.name.edition);

        // automatically select saved catalog if it exists
        // select first catalog otherwise
        var catalog = libx.utils.browserprefs.getIntPref('libx.edition.selectedcatalog', 0);
        
        // populate catalogs from config file
        var catalogs = $.map(libx.edition.catalogs, function(elem) { return elem.name; });
        var link = $('<a href="#">' + catalogs[catalog] + '</a>');
        $('#full-catalogs').empty();
        $('#full-catalogs').append(link);
        
        function catalogChosen(key, value) {
            loadCatalog(key);
            $('#full-catalogs > a').text(value);
            $('#simple-menu-catalogs > a').text(value);
        }
        
        libx.ui.jquery.dropdown($, {
            dropdown_items: catalogs,
            field: link,
            select: catalogChosen
        });
        
        accordionMenu.setMenuItems($('#simple-menu-catalogs'),
            catalogs[catalog], catalogs, catalogChosen);

        // load the image remotely.  temporary implementation until caching is
        // implemented in localstorage.
        var imgUrl = libx.utils.browserprefs.getStringPref('libx.edition.configurl', null)
            .replace('/config.xml', '') + libx.edition.options.logo.replace('chrome://libx/skin', '');
        
        var image = $('#edition-image-large');
        image[0].src = imgUrl;
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
                libx.ui.openSearchWindow(elem.href);
            });
            $('#links').append(link);
        });

        $('#about-name').text(libx.edition.name.long);
        $('#about-desc').text(libx.edition.name.description);
        $('#about-adaptedby').text(libx.edition.name.adaptedby);
        
        loadCatalog(catalog);

        showTab('search-tab');
        
        return true;

    }
    
    /* Show either the full or basic view based on user preferences. */
    function showFullOrSimple() {
        if(libx.utils.browserprefs.getBoolPref('libx.edition.displayadvanced', true)) {
            $('#full-view').show();
            $('#simple-view').hide();
            showTab('search-tab');
        } else {
            $('#simple-view').show();
            $('#full-view').hide();
            $('#simple-search-form input').focus();
        }
    };

    /* Display the popup and also switch to full or simple the first time it
     * is loaded. */
    function showInitialView() {
        $('#tab-pane').show();
        if(loadPopup())
            showFullOrSimple();
    }
    
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

            var revisions = $('#edition-search-revisions');
            revisions.empty();

            // reset load button if user already loaded an edition
            $('#edition-search-load').unbind('click');

            // get the revisions for this edition and populate search box 
            $.ajax({
                type: "GET",
                url: "http://libx.org/editions/config/" + selectedEdition.id,
                dataType: "json",
                success: function(json) {

                    // populate revision dropbox
                    for(var rev in json.revisions)
                        revisions.append($('<option>' + rev + '</option>'));

                    // select latest revision by default
                    revisions.children().last().attr('selected', true);
                    
                    $('#edition-search-load').click(function() {
                        var configUrl = json.revisions[revisions.val()].config;
                        libx.utils.browserprefs.setStringPref('libx.edition.configurl', configUrl);
                        // reset catalog index when changing editions
                        libx.utils.browserprefs.setIntPref('libx.edition.selectedcatalog', 0);
                        libx.log.write('Loading config from ' + configUrl);
                        try {
                            libx.loadConfig(configUrl);
                        } catch(e) {
                            loadPopup();
                        }
                    });
                }
            });
        }
    });
    
    // attach events to popup controls
    $('#cancel').click(function() { loadPopup(); } );
    
    // attach full search event
    $('#full-search-form').submit(function() {
        var searchParams = [];
        $('#full-search-fields tr:visible').each(function(i, elem) {
            searchParams[i] = { searchType: fullSelectedOptions[i], searchTerms: $('input', elem).val() };
        });
        libx.ui.openSearchWindow(libx.edition.catalogs
                [libx.utils.browserprefs.getIntPref('libx.edition.selectedcatalog', 0)].search(searchParams));
    });
    
    // attach simple search event
    $('#simple-search-form').submit(function() {
        libx.ui.openSearchWindow(libx.edition.catalogs
            [libx.utils.browserprefs.getIntPref('libx.edition.selectedcatalog', 0)]
            .search( [{ searchType: simpleSelectedOption, searchTerms: $('#simple-search-form input').val() }]));
    });
    
    // attach event to switch between full/simple views
    $('.switch-display').click(function() {
        var advanced = !libx.utils.browserprefs.getBoolPref('libx.edition.displayadvanced', true);
        libx.utils.browserprefs.setBoolPref('libx.edition.displayadvanced', advanced);
        showFullOrSimple();
    });
    
    // associate tabs with their content
    setTabToView('search-tab', 'search-view');
    setTabToView('links-tab', 'links-view');
    setTabToView('about-tab', 'about-view');
    setTabToView('change-edition-tab', 'change-edition-view');
    
    // show view depending on whether user already has edition loaded
    if(libx.utils.browserprefs.getStringPref('libx.edition.configurl', null)) {
        showInitialView();
    } else {
        $('#tab-pane').hide();
        showTab('change-edition-tab');
    }
    
    // automatically reload the page if edition changes
    libx.events.addListener("EditionConfigurationLoaded",
        {
            onEditionConfigurationLoaded: showInitialView
        }, undefined, 'popup'
    );
    
});