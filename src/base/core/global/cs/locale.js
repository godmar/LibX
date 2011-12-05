/**/
(function () {
   var strlocale;
   try {
     if( libx.cs.browser.safari || libx.cs.browser.opera || libx.cs.browser.chrome || libx.cs.browser.mozilla )//standard (for chrome, FF, opera, safari)
     {
        strlocale = window.navigator.language;
     }else if (libx.cs.browser.msie ){// IE
        strlocale = window.navigator.userLanguage;
     }else {
        libx.log.write("Error - Unknown Browser! Check for appropriate feature support for setting default locale string from windown.navigator object");
        xml = undefined;
     }

     strlocale = strlocale.split("-");
     strlocale = strlocale[0].toLowerCase() + "_" + strlocale[1].toUpperCase();

  }catch ( e )
  {
     strlocale = 'en_US';//default
     libx.log.write( "Error processing locale info: " + e);
  }
  
  libx.locale.bd.currentLocale = strlocale;
})();

libx.locale.bd.initialize = function () {
    libx.locale.getBundle( {
        url: libx.cs.baseurl + "src/base/locale/en_US/messages.json",
        defaultLocale: "en_US",
        success: function (bundle) {
            libx.locale.defaultStringBundle = bundle;
            var localeLoadedEvent = new libx.events.Event("DefaultLocaleLoaded");
            localeLoadedEvent.notify();
        }
    } );
};

