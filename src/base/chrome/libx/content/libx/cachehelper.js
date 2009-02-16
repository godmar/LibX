//A helper class that can calculate expiration time and determine the time till
//next update
libx.utils.cachehelper = (function () {

 var lmFactor;

 var hour = 60 * 60 * 1000;
 var day = 24 * hour;

/**
 * @fileoverview
 *
 * Helper class for object cache
 */

/**
 * A helper class for calculating object cache expiration dates
 *
 * @namespace
 */
 var cacheUtilClass = libx.core.Class.create({
     /** @lends libx.utils.cachehelper.prototype */

    /**
     * Sets up the cachehelper
     *
     * @param {Number} factor used in heuristic calculation of expiration date
     *                        defaults to 0.5
     */
    initialize : function (factor, dayLength)
    {
        if (factor != null)
            lmFactor = factor
        else
            lmFactor = 0.5;

        if (dayLength != null) {
            day = dayLength;
            hour = Math.floor(day / 24);
        }
    },

    /**
     * @param {Object} xhr xml http request object
     * @param {Date}   wantedDate (OPTIONAL) specify an expiration date
     *
     * @returns {Integer} expiration date in millisecond format
     */
    getExpireDate : function (xhr, wantedDate) {

        //If a date was specified
        if (wantedDate != null)
        {
            return Date.parse(wantedDate);
        }

        //Check to see whether we have cache related headers
        var cacheControl = xhr.getResponseHeader("Cache-Control");
        var expire = xhr.getResponseHeader("Expires");
        var lastMod = xhr.getResponseHeader("Last-Modified");

        var currentDateInt = Date.parse(Date());

        if (lastMod)
            var lastModInt = (new Date(lastMod)).valueOf();

        if (cacheControl != null) 
        {
            //We have a Cache-Control header

            var cachedParts = cacheControl.split(",");

            var foundMaxAge = false;

            for (var i = 0; i < cachedParts.length; ++i)
            {
                var maxAgeSearch = cachedParts[i].search(/max-age/);
                var noStoreSearch = cachedParts[i].search(/no-store/);
                var noCacheSearch = cachedParts[i].search(/no-cache/);

                if (maxAgeSearch != -1)
                {
                    foundMaxAge = true;

                    //Get max-age value
                    var maxAgeParts = cachedParts[i].split("=");
                    var maxAge = maxAgeParts[1];
                }

                if (noStoreSearch != -1 || noCacheSearch != -1)
                    return currentDateInt;
            }


            if (foundMaxAge)
            {
                if (lastMod != null)
                {
                    return lastModInt + (maxAge * 1000);
                }

                //XXX: If we don't have Last-Modified, then how do we determine
                //age?
                return currentDateInt + day;
            }
        }

        if (expire != null)
        {
            var expireDateInt = (new Date(expire)).valueOf();
            return expireDateInt;
        }

        if (lastMod != null)
        {
            var timeSinceLastMod = currentDateInt - lastModInt;
            var delta = Math.floor(timeSinceLastMod * lmFactor);
            var heuristicExp = currentDateInt + delta;

            return heuristicExp;
        }

        //If we have nothing to go on, then just add 24 hours to the current
        //date and use that for expiration
        return currentDateInt + day;
    },

    /**
     * Calculates the next update time
     */
    getNextUpdateDelta : function () {

        var currentDateInt = Date.parse(Date());

        //Read the update time from preferences
        var storedUpdate = libx.utils.browserprefs.getIntPref("libx.objectcache.nextupdate");

        if (storedUpdate == null) {
            var nextDay = currentDateInt + day
            //Write it to preferences
            libx.utils.browserprefs.setIntPref("libx.objectcache.nextupdate", nextDay);
            return day;
        }

        if (currentDateInt < storedUpdate)
            return storedUpdate - currentDateInt;

        //If we missed the update time
        var timeSinceUpdate = currentDateInt - storedUpdate;

        //Try resetting to within 6 hours.  Note that if it's been a while since the last
        //scheduled update, the next scheduled update will take place shortly (much less
        //than 6 hours).
        var timeToUpdate = Math.floor(( 6 * hour / timeSinceUpdate) * hour * Math.random());

        //If we didn't miss the last scheduled update by much, then reschedule
        //it between 4 and 6 hours from now
        if (timeToUpdate > 6 * hour) {
            timeToUpdate = 4 * hour + Math.floor( Math.random() * 2 * hour );
        }

        var newUpdateTime = currentDateInt + timeToUpdate;

        //Store new update in preferences
        libx.utils.browserprefs.setIntPref("libx.objectcache.nextupdate", newUpdateTime);

        return timeToUpdate;
    },

    /**
     * Writes the time of next update to disk
     *
     * @param {Integer} timeToNextUpdate amount of time till next update
     */
    writeNextUpdateToPref : function (timeToNextUpdate) {

        var currentDateInt = Date.parse(Date());

        //Write this value to disk
        var timeOfNextUpdate = currentDateInt + timeToNextUpdate;

        libx.utils.browserprefs.setIntPref("libx.objectcache.nextupdate", timeOfNextUpdate);
    }
 });

 return cacheUtilClass;

 })();

libx.utils.cacheUtil = new libx.utils.cachehelper();
