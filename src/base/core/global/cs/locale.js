libx.locale.bd.initialize = function () {
    libx.log.write('initializing locale...');
};

var strlocale;
try {
  if( window.navigator.language )//standard (for chrome, FF, opera, safari)
  {
     strlocale = window.navigator.language;
  }else {// IE
     strlocale = window.navigator.userLanguage;
  }
  strlocale = strlocale.split("-");
  strlocale = strlocale[0].toLowerCase() + "_" + strlocale[1].toUpperCase();

}catch ( e )
{
  strlocale = 'en_US';//default
  libx.log.write( "Error processing locale info: " + e);
}

libx.locale.bd.currentLocale = strlocale;

