libx.locale.bd.initialize = function () {
    libx.log.write('initializing locale...');
};

libx.locale.bd.currentLocale = 'en_US';

libx.locale.getBootstrapURL = function (path) {
    return libx.cs.baseurl + "src/base/bootstrapped/" + path;
};

