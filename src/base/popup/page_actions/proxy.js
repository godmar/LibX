
// no auto-sensing of proxy
if (libx.cs === undefined) popup.pageActions.proxy = function () {

if(!libx.edition)
    return;
    
libx.ui.tabs.getSelected( function (tab) {
        
    function addProxy(proxy) {
        
        function reloadTab() {
            libx.ui.openSearchWindow(proxy.rewriteURL(tab.url), "sametab");
            window.close();
        }
        
        function cloneMsg(tmpl) {
            var msg = tmpl.clone();
            tmpl.after(msg);
            return msg;
        }
        
        cloneMsg($(".proxy-template"))
            .show()
            .find(".proxy-msg").text(libx.locale.defaultStringBundle.getProperty("proxy_message3", proxy.name, proxy.type))
            .end().find(".proxy-reload")
                .text(libx.locale.defaultStringBundle.getProperty("proxy_reload"))
                .click(reloadTab);
        
        // add proxy autosense notification if supported
        if (!proxy.canProxy())
            return;
        
        proxy.checkURL({
            url: tab.url,
            onsuccess: function () {
            
                var proxy_link_big = libx.locale.defaultStringBundle.getProperty("proxy_message1", proxy.name);
                var proxy_link_small = libx.locale.defaultStringBundle.getProperty("proxy_message2", proxy.name);
                
                cloneMsg($(".proxy-notify-big"))
                    .show()
                    .find("a")
                        .text(proxy_link_big)
                        .click(reloadTab);
                        
                cloneMsg($(".proxy-notify-small"))
                    .show()
                    .find("a")
                        .text(proxy_link_small)
                        .click(reloadTab);
            },
            onfailure: libx.core.EmptyFunction
        });
    }
    
    var numProxies = libx.edition.proxy.length;
    $('a[href="#proxy-view"]').toggle(numProxies != 0);
    
    for (var i = 0; i < numProxies; i++)
        addProxy(libx.edition.proxy[i]);
    
});

};
