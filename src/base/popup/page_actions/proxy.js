
popup.pageActions.proxy = function () {

if(!libx.edition || !libx.edition.proxy.primary)
    return;
    
libx.ui.tabs.getSelected( function(tab) {
    
    libx.edition.proxy.primary.checkURL({
        url: tab.url,
        onsuccess: function() {
            var proxy_name = libx.edition.proxy.primary.name;
            var proxy_type = libx.edition.proxy.primary.type;
            var proxy_message = "<p>" + libx.locale.defaultStringBundle.getProperty("proxy_message1", proxy_name, proxy_type) + "</p>";
            var proxy_link = libx.locale.defaultStringBundle.getProperty("proxy_message2");
            var div = $('<div>' + proxy_message + '</div>');
            $('<div><a href="#">' + proxy_link + '</a></div>').appendTo(div).click(function() {
                libx.ui.tabs.update(tab.id, {url: libx.edition.proxy.primary.rewriteURL(tab.url)}, function() {
                    // closes the popup; used only in Google Chrome
                    window.close();
                });
            });
            popup.addPageAction(div);
        },
        onfailure: libx.core.EmptyFunction
    });
    
});

};
