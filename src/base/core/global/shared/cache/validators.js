
/**
 * Set of functions used to validate response data before storing in the cache.
 * This is necessary to detect the fake responses returned by captive portals
 * (such as web authentication login screens).
 *
 * @namespace
 */
//BRN: these should inherit from a generic validator class
libx.cache.validators = {

    /**
     * Validator for edition configuration file.
     *
     * @params {Object} params  parameter object
     * @see libx.cache.MemoryCache.get for parameter properties
     */
    config: function (params) {
        if (!/xml/.test(params.mimeType)) {
            params.error();
            libx.log.write("Validation error: invalid MIME type for config XML: " + params.mimeType);
            return;
        }
        if (libx.utils.xpath.findSingleXML(params.data, '//edition/name'))
            params.success();
        else {
            params.error();
            libx.log.write("Validation error: edition name not found in config XML");
        }
    },

    /**
     * Validator for bootstrapped resources.
     *
     * @params {Object} params  parameter object
     * @see libx.cache.MemoryCache.get for parameter properties
     */
    bootstrapped: function (params) {

        var bootstrapPath = libx.utils.getBootstrapURL('');

        // if we are fetching a third party resource (i.e., not in the LibX
        // bootstrapped directory), skip validation
        if (params.url.indexOf(bootstrapPath) != 0) {
            params.success();
            return;
        }

        // validators are called with the context that 'this' is an instance of
        // a MemoryCache
        this.get({
            url: libx.utils.getBootstrapURL('updates.json'),
            dataType: 'json',
            success: function (updates) {

                // get a relative path as used in updates.json
                var relPath = params.url.replace(bootstrapPath, '');

                // calculate SHA1 of text
                var sha1 = libx.utils.hash.hashString(params.text);

                if (updates.files && updates.files[relPath]
                        && updates.files[relPath].hash == sha1) {
                    params.success();
                } else {
                    params.error();
                    if (updates.files && updates.files[relPath]) {
                        libx.log.write("Validation error: SHA1 mismatch; updates.json expected: "
                                       + updates.files[relPath].hash + ", actual: " + sha1);
                    } else {
                        libx.log.write("Validation error: invalid updates.json");
                    }
                }

            },
            error: function (status) {
                params.error();
                libx.log.write('Error ' + status + ' when fetching updates.json');
            }
        });

    },

    /**
     * Validator for feeds.
     *
     * @params {Object} params  parameter object
     * @see libx.cache.MemoryCache.get for parameter properties
     */
    feed: function (params) {
        if (!/xml/.test(params.mimeType)) {
            params.error();
            libx.log.write("Validation error: invalid MIME type for atom feed: " + params.mimeType);
            return;
        }
        if (libx.utils.xpath.findSingleXML(params.data,
                '//libx:package|//libx:libapp|//libx:module', null, { libx: 'http://libx.org/xml/libx2' } ))
            params.success();
        else {
            params.error();
            libx.log.write("Validation error: no package, module, or libapp node found in feed");
        }
    },

    /**
     * Validator for preference XML files.
     *
     * @params {Object} params  parameter object
     * @see libx.cache.MemoryCache.get for parameter properties
     */
    preference: function (params) {
        if (!/xml/.test(params.mimeType)) {
            params.error();
            libx.log.write("Validation error: invalid MIME type for pref XML: " + params.mimeType);
            return;
        }
        if (libx.utils.xpath.findSingleXML(params.data, '//item|//preference|//category'))
            params.success();
        else {
            params.error();
            libx.log.write("Validation error: no item, preference, or category node found in XML");
        }
    },

    /**
     * Validator for images.
     *
     * @params {Object} params  parameter object
     * @see libx.cache.MemoryCache.get for parameter properties
     */
    image: function (params) {
        if (/image/.test(params.mimeType))
            params.success();
        else {
            params.error();
            libx.log.write("Validation error: invalid MIME type for image: " + params.mimeType);
        }
    }
};

