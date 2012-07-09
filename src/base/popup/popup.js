
var popup = (function() {

function makeConfigUrlFromEdition(editionRevision) {
    var baseUrl = "http://libx.org/editions/";
    // new style
    var newStyle = editionRevision.match(/([0-9a-fA-F]{8})\.?(\d+)?/);
    if (newStyle) {
        var editionId = newStyle[0];
        baseUrl += editionId.substr(0, 2) + "/" + editionId.substr(2, 2) + "/";
    }
    return baseUrl + editionRevision + "/config.xml";
}

function extractRevision () {
  var reg = /\d+/
  var ver = libx.edition.version;
  if (reg.test(ver)) {
     ver = ver.split(".");
     return ver[ver.length -1];
  }else { 
    return ver;
  }  
}

function trackSearchActivity( type, catalogName ) {
    libx.analytics && libx.analytics.track({
            activity: "search",
            catalog: catalogName,
            searchtype: type
    });
}
    
$(function() {
    /* Expandable class that toggles its right sibling. */
    $('.expandable').live('click', function () {
        $(this).next().toggle();
    });
    
    // we require the default string bundle to be available, so wait for it
    libx.events.registerEventListener("DefaultLocaleLoaded", {
        onDefaultLocaleLoaded: function () {
            popup.initialize();

            // If run in client-side mode, use a hash tag to activate an
            // edition/revision.  
            var hash = window.location.hash;

            if (/#edition(rec)?=\S+/.test(hash)) {
                if (/#editionrec?=\S+/.test(hash)) {
                    libx.analytics && libx.analytics.track({
                        activity: "recommendation",
                        edition: {id: hash.match(/#editionrec=(\S+)/)[1], desc: "unknown"}
                    });
                }

                var configUrl = makeConfigUrlFromEdition(hash.match(/=(\S+)/)[1]);
                libx.utils.browserprefs.setStringPref('libx.edition.configurl', configUrl);
                libx.utils.browserprefs.setIntPref('libx.popup.selectedcatalog', 0);
                
                // force immediate config.xml update if running in client-side environment
                // ensure up-to-date config.xml
                var configScheduler = new libx.cache.ConfigScheduler(configUrl);
                configScheduler.updatesFinished = function (updated) {
                    libx.loadConfig(this.rootUrl);
                }
                configScheduler.scheduleUpdates(true);
            } else {
                var showSearchBox = "#showsearchbox" == hash;

                // show view depending on whether user already has edition loaded
                if (!showSearchBox && libx.utils.browserprefs.getStringPref('libx.edition.configurl', null)) {
                    if (libx.edition) {
                        popup.loadPopup();
                    } else {
                        libx.initialize.reload();
                    }
                } else {
                    popup.showChangeEditionView({showRecommendation: false});
                }
            }
            
            // load page actions
            for (var i in popup.pageActions)
                popup.pageActions[i]();

            // notify parent window that the popup has finished loading
            var evt = new libx.events.Event('PopupLoaded');
            evt.notify();
        }
    }, function (eventName) {
        var evt = null;
        if (libx.locale.defaultStringBundle)
            evt = new libx.events.Event(eventName);
        return evt;
    }, null, "popup_locale_loaded");

    // save search fields when popup is closed
    $(window).unload(function () { 
        libx.events.removeListener("DefaultLocaleLoaded", null, "popup_locale_loaded");
        popup.saveFields();
        popup = null;
    });


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

function getSearchParamsFromInputField() {
    var searchParams = [];
    $('#full-search-fields input').each(function(i) {
        searchParams.push({
            searchType: fullSelectedOptions[i],
            searchTerms: $(this).val()
        });
    });
    return searchParams;
}

function getSavedSearchPref() {
    if (libx.prefs.browser && libx.prefs.browser.savesearches)
        return libx.prefs.browser.savesearches._value;
    return false;
}

return {
    
    // flag to indicate whether this is the first popup load since the user has
    // opened the popup; becomes false if the user changes edition inside popup
    firstLoad: true,

    recommendations : function() {
        $.getJSON(libx.services.autoedition.url + '?callback=?', function(data) {
            outputHTML = "<br /><br /><a href=\"http://libx.org/edition-recommendation-system/\">" + libx.locale.defaultStringBundle.getProperty('ip_recommendations', data["ip"]) + ":</a><br /><br /><div class=\"results\" style=\"display: block\">";
            data["editions"].sort(function(a, b) {
                return b["timestamp"] - a["timestamp"];
            });
            for (index = 0; index < data["editions"].length; index = index + 1) {
                var currentEdition = data["editions"][index];
                outputHTML = outputHTML + "<div class=\"unselected\"><b><span class=\"editionDesc\">" + currentEdition["description"] + "</span></b>";
                outputHTML = outputHTML + " (id: <span class=\"editionId\">" + currentEdition["id"] + "</span>)";
                outputHTML = outputHTML + libx.locale.defaultStringBundle.getProperty('maintained_by') + "<i><span class=\"editionMaintainers\">";
                outputHTML = outputHTML + currentEdition["maintainers"].join(", ");
                outputHTML = outputHTML + "</span></i>";
                var mod_date = new Date(currentEdition["timestamp"] * 1000);
                outputHTML = outputHTML + " modified on " + mod_date.toDateString();
                outputHTML = outputHTML + "</div>";
            }
            outputHTML = outputHTML + "</div>";
            $('#edition-search-ip').html(outputHTML);
            $('#edition-search-ip .results div').mouseenter(function() {
                $(this).removeClass('unselected');
                $(this).addClass('selected');
            });
            $('#edition-search-ip .results div').mouseleave(function() {
                $(this).removeClass('selected');
                $(this).addClass('unselected');
            });
            $('#edition-search-ip .results div').click(function() {
                var editionId = $('span.editionId', this).html();
                var editionDesc = $('span.editionDesc', this).html();
                var editionMaintainers = $('span.editionMaintainers', this).html();
                libx.analytics && libx.analytics.track({
                        activity: "recommendation",
                        edition: { id: editionId, desc: editionDesc }
                });
                popup.loadEdition({'id': editionId, 'shortDesc': editionDesc, 'maintainers': editionMaintainers});
            });
        });
    },


    loadEdition: function(selectedEdition) {
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
        libx.cache.defaultMemoryCache.get({
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
                    if(!isNaN(elem.text) || elem.text == "live") {
                        map.push(elem);
                    }
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
                    libx.initialize.reload();
                });
            }
        });
    },
 
    
    initialize: function () {
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
                popup.loadEdition(selectedEdition);
            }
        });
        
        /* Opens the search URL in a browser tab. */
        function doSearch(searchParams) {
            var catalog = libx.utils.browserprefs.getIntPref('libx.popup.selectedcatalog', 0);
            trackSearchActivity("searches", libx.edition.catalogs[catalog].name );
            libx.ui.openSearchWindow(libx.edition.catalogs[catalog].search(searchParams));
            window.close();
        }
        
        // attach clear search fields event
        $('#search-view form input[type="reset"]').click(function () {
            fullSelectedOptions = [];
            $('#full-search-fields').empty();
            popup.addField();
        });
        
        // attach full search event
        $('#search-view form').submit(function() {
            doSearch(getSearchParamsFromInputField());
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
        
        // bind preferences page to click
        $("#tab-pane").find('a[href="#preferences"]').click(function () {
            libx.ui.openSearchWindow(libx.utils.getExtensionURL("preferences/pref.xhtml"));
            window.close();
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
                if (popup) {
                    popup.firstLoad = false;
                    popup.loadPopup();
                }
            }
        }, undefined, 'popup_reload');
        
        // hide proxy & preferences tab in client-side view
        $('a[href="#proxy-view"]').toggle(libx.cs === undefined);
        $('a[href="#preferences"]').toggle(libx.cs === undefined);

        var devchecked = libx.utils.browserprefs.getBoolPref('libx.popup.developer', false);
        $('a[href="#dev-view"]').toggle(devchecked);
        $('#developer-enabled-checkbox').attr('checked', (devchecked ? 'checked' : ''));
        $('#developer-enabled-checkbox').click(function () {
            var checked = $(this).attr('checked');
            libx.utils.browserprefs.setBoolPref('libx.popup.developer', checked);
            $('a[href="#dev-view"]').toggle('fast');
        });

        $('.factoryReset').click(function () {
            // clear the memory cache
            libx.cache.defaultMemoryCache.flush()

            // clear all storage
            libx.storage.metacacheStore.clear();
            libx.storage.cacheStore.clear();
            libx.storage.prefsStore.clear();
            
            // clear config url and package list
            libx.utils.browserprefs.setStringPref("libx.edition.configurl", "");
            libx.utils.browserprefs.setStringPref("libx.libapp.userpackages", "[]");

            // reset any temporarily subscribed packages
            libx.libapp.clearTempPackages();

            // reset the LibX button icon
            libx.ui.setIcon();

            libx.initialize.reload();
            popup.showChangeEditionView();
        });

        $('.clearCache').click(function () {
            // clear the memory cache
            libx.cache.defaultMemoryCache.flush()

            // clear the object cache
            libx.storage.metacacheStore.clear();
            libx.storage.cacheStore.clear();

            libx.initialize.reload();
        });
        
        var debugLevels = [0, 1, 2, 3, 9].map(function (val) {
            return {text: val, value: val};
        });
        $('#libapp-debuglevel').text(libx.utils.browserprefs.getIntPref('libx.libapp.debuglevel', 0));
        libx.ui.jquery.dropdown($, {
            dropdown_items: debugLevels,
            field: $('#libapp-debuglevel'),
            select: function (level) {
                libx.utils.browserprefs.setIntPref('libx.libapp.debuglevel', level);
            }
        });
        $('#error-change-edition').click(function() {
            $('#error-view').hide();
            popup.showChangeEditionView();
        });
        $('#dev-prefs').click(function () {
            libx.ui.openSearchWindow(libx.utils.getExtensionURL('dev/prefs.html'));
        });
        $('#dev-cache').click(function () {
            libx.ui.openSearchWindow(libx.utils.getExtensionURL('dev/cache.html'));
        });
        // show the page once it's ready
        $('body').show();
    },
    
    saveFields: function () {
    
        // don't save fields if user disabled preference
        if (!getSavedSearchPref())
            return;
    
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
    },
    
    showChangeEditionView: function(args) {
        if (args === undefined)
            args = { showRecommendation: true };
        if (!('showRecommendation' in args))
            args.showRecommendation = true;

        popup.showFullView();
    
        // allow user to go back to previous screen if an edition is loaded
        if (libx.edition)
            $('#change-edition-cancel').show();
        else
            $('#change-edition-cancel').hide();
            
        $('#tabs').hide();
        if (args.showRecommendation) {
            popup.recommendations();
        }
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
        popup.addField = function () {
        
            // select the next search option when another field is added
            var nextOption = optionsMap[0];
            if (fullSelectedOptions.length) {
                var selected = fullSelectedOptions[fullSelectedOptions.length-1];
                for (var i = 1; i < optionsMap.length; i++) {
                    nextOption = optionsMap[i];
                    if (optionsMap[i-1].value == selected)
                        break;
                }
            }
            fullSelectedOptions.push(nextOption.value);
            
            var field = $('<tr><td></td>'
                        + '<td><input class="search-field" type="text"/></td>'
                        + '<td><div class="search-add enabled"></div></td>'
                        + '<td><div class="search-close disabled"></div></td>'
                        + '</tr>');
            
            field.find('input.search-field').keypress(function (e) {
                if (e.keyCode == 13 && (e.ctrlKey || e.shiftKey)) {
                    $('#preview-button').trigger('click');
                    return false;
                }
            });

            field
                .appendTo($("#full-search-fields"))
                .hide()
                .fadeIn()
                .find(".search-add").click(function () {
                    
                    if ($(this).hasClass("disabled"))
                        return;
                        
                    $(this)
                        .removeClass("enabled")
                        .addClass("disabled");
                    
                    popup.addField();
                    $(".search-close")
                        .removeClass("disabled");
                    
                }).end().find(".search-close").click(function () {
                
                    // don't allow removal of the last remaining field
                    if (fullSelectedOptions.length == 1)
                        return;
                
                    var fieldIndex = field.parent().children().index(field);
                    fullSelectedOptions.splice(fieldIndex, 1);
                    
                    if (field.find(".search-add").hasClass("enabled")) {
                        field.prev().find(".search-add")
                            .removeClass("disabled")
                            .addClass("enabled");
                    }
                    
                    field.remove();
                    
                    // hide close button if only one field remains
                    if (fullSelectedOptions.length == 1)
                        $(".search-close")
                            .addClass("disabled");
                    
                });

            // create search options drop-down for this field
            var link = $('<a href="#">' + nextOption.text + '</a>');
            $('td:first', field).append(link);
            libx.ui.jquery.dropdown($, {
                dropdown_items: optionsMap,
                field: link,
                select: function(key, val) {
                    var idx = $("#full-search-fields a").index(link);
                    fullSelectedOptions[idx] = key;
                }
            });
            
            focus($('input', field));
            
        };
        
        popup.addField();
        
        // load saved searches if preference is enabled
        if (getSavedSearchPref()) {
            var savedFields = libx.utils.browserprefs.getStringPref("libx.popup.searchfields", null);
            if (savedFields) {
                try {
                    savedFields = libx.utils.json.parse(savedFields);
                    for (var i = 1; i < savedFields.length; i++)
                        $("#full-search-fields .search-add").last().click();
                    $("#full-search-fields input").each(function (i) {
                        $(this).val(savedFields[i].value);
                        // if search option is in newly selected catalog, keep this search option selected.
                        // otherwise, just use the first search option that the catalog supports
                        if ($.inArray(savedFields[i].option, optionsArray) != -1) {
                            $(this).parent().prev().find("a").text(libx.edition.searchoptions[savedFields[i].option]);
                            fullSelectedOptions[i] = savedFields[i].option;
                        }
                    });
                } catch (e) {
                    libx.log.write("Error: Invalid saved fields in popup: " + e 
                        + " savedFields was: " + libx.utils.json.stringify(savedFields));
                }
            }
        }

        function displayPreviewer() {
            var catalog = libx.edition.catalogs[index];
            var previewer = libx.catalog.preview.getPreviewer(catalog);
            
            $("#preview-button")
                .toggle(previewer != null)
                .unbind()
                .click(function () {
                    var $lastInput = $('#full-search-fields input:last');
                    $lastInput.addClass("searchLoading");
                    previewer.doPreview(getSearchParamsFromInputField(), function (data) {
                        $lastInput.removeClass("searchLoading");
                        // alert("got: " + libx.utils.json.stringify(data));
                        var $p = $('#preview-results-div');
                        $p.empty();
                        $p.append("<p>Found " + data.recordCount + " results in " + data.queryTime + "ms.</p>");    // XXX i18n

                        $.each(data.documents, function (idx, el) {
                            previewer.formatResult(el, $)
                                .appendTo($p)
                                .find("a")
                                    .each(function () {
                                        // ensure links open according to user prefs
                                        var href = $(this).attr("href");
                                        $(this).click(function () {
                                            libx.ui.openSearchWindow(href);
                                        });
                                        $(this).attr("href", "javascript:void(0);");
                                    });
                        });
                        var _catalog = libx.utils.browserprefs.getIntPref('libx.popup.selectedcatalog', 0);
                        trackSearchActivity("previews", libx.edition.catalogs[_catalog].name );
                    });
               });
        }

        libx.events.addListener("PreviewerRegistered",{
            onPreviewerRegistered: function() {
                displayPreviewer();
            }
        });
        displayPreviewer();
    },
    
    /* Load the edition into the popup. */
    loadPopup: function() {
        
        try {
            // reset previously loaded page actions
            $('a[href$="#pageactions-view"]', $('#tab-pane')).hide();
            $('#pageactions-view').empty();
           
            var tmpPkgs = libx.libapp.getTempPackages();
            if(tmpPkgs.length == 0)
            {
                $('#tmp-packages-div').hide();
            }else {
                tmpPkgs.forEach(function(pkg, index, ar){
                    libx.cache.defaultMemoryCache.get({
                        type:"GET",
                        url: pkg.tempUrl,
                        dataType: "xml",
                        bypassCache: true,
                        success: function (xmlDoc){
                            var ns = { atom:       "http://www.w3.org/2005/Atom",
                                       libx2:      "http://libx.org/xml/libx2"
                            };
                            var feedTitle = libx.utils.xpath.findSingleXML(xmlDoc, "./atom:title/text()",
                                xmlDoc.documentElement,ns);
                            feedTitle = feedTitle != null ? feedTitle.nodeValue : "Unable to find feed title";
                            var el = $("<div>" + "Temp feed title: " + feedTitle + " </div>")
                                      .append($(" <a/>").attr("href", "#")
                                               .attr("title","Unsubscribe feed from temporary subscribed packages list") 
                                               .click(function () {
                                                    $(this).parent().fadeOut('fast').remove();
                                                    libx.libapp.removeTempPackage(pkg.tempUrl);
                                                   libx.libapp.reloadPackages();
                                               })
                                               .text("(Unsubscribe)")).after("</br>");
                            el.append($("</br>Permanent: <a target='_blank' style='font-size:0.9em;' href='" + pkg.permUrl+ "'>" + pkg.permUrl + "</a></br>" +
                                        "Temporary: <a target='_blank' style='font-size:0.9em;' href='" + pkg.tempUrl+ "'>" + pkg.tempUrl + "</a></br></br>")
                                     );
                            
                            $("#tmp-packages-content-div").append(el);
                        },
                        error: function (err) {
                           feedTitle = "Error fetching feed !";
                        }
                    });
                });
                $('#tmp-packages-div').show();
            }


            $('#preview-results-div').empty();
            $("#preview-button").is(":visible") && $("#preview-button").toggle(false);
            
            // load the edition information
            $('#edition-name-header').text(libx.edition.name.edition);
            $('#about-name').text(libx.edition.name.long);
            $('#about-libx-version').text(libx.locale.defaultStringBundle.getProperty('about_libxversion', libx.version));
            $('#about-edition-revision').text(libx.locale.defaultStringBundle.getProperty('about_editionrevision', extractRevision()));
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

            // See http://www.alanwood.net/unicode/geometric_shapes.html for options
            var arrow = '&#9654; ';
            var link = $('<a style="text-decoration: none" href="#">' + arrow + libx.edition.catalogs[catalog].name + '</a>');
            $('#full-catalogs').empty();
            $('#full-catalogs').append(link);
            function catalogChosen(num, name) {
                popup.saveFields();
                popup.loadCatalog(num);
                $('#full-catalogs > a').html(arrow + name);
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
            libx.edition.options.logo && libx.utils.getEditionResource({
                url: libx.edition.options.logo,
                success: function (dataUri) {
                    image.attr('src', dataUri);
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
                    libx.ui.openSearchWindow(elem.href);
                    window.close();
                });
                $('#links').append(link);
            });

            var configUrl = libx.utils.browserprefs.getStringPref('libx.edition.configurl', null);
            $('#dev-configxml-href').attr('href', configUrl).text(configUrl);
           
            popup.showPreferredView();
        } catch (e) {
            libx.log.write("Error displaying popup: " + e + ", line " + e.lineNumber);
            popup.showErrorView();
        }

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
