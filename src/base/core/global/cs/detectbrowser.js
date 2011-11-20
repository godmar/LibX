
 libx.cs.browser = {};


 var rwebkit = /(webkit)[ \/]([\w.]+)/,
    ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/,
    rmsie = /(msie) ([\w.]+)/,
    rchrome = /(chrome)[ \/]([\w.]+)/,
    rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/,

    ua = window.navigator.userAgent.toLowerCase();

 var match = rchrome.exec( ua ) ||
            rwebkit.exec( ua ) ||
            ropera.exec( ua ) ||
            rmsie.exec( ua ) ||
            ua.indexOf("compatible") < 0 && rmozilla.exec( ua ) ||
            [];
 if(match[1])
 {
    libx.cs.browser[match[1]] = true;
    libx.cs.browser.version = match[2] || "0";
 }
    
 
 if( libx.cs.browser.webkit ) {
    libx.cs.browser.safari = true;
 }

