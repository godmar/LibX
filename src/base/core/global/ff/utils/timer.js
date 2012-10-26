/**
 * Firefox-specific implementations of libx.utils.timer.setInterval/setTimeout
 * TBD: implement additional arguments.
 */

(function () {
// store reference to interval timers to prevent GC
var timers = [];

function setTimer(callback, timeout, nsITimer_TYPE) {
	var timer = Components.classes['@mozilla.org/timer;1']
    	.createInstance(Components.interfaces.nsITimer);
    timer.initWithCallback({notify: function (timer) {		
                    if (typeof callback == "string")
                        libx.log.write("Error: use a function, not a string, in setTimeout/setInterval");
                    else
                        callback ();
                }}, timeout, nsITimer_TYPE);
    return timer;
}

/**
 *	Initiates a timeout that will trigger the callback function periodically
 *	after the specified timeout
 *
 *	Intended to be compatible with window.setInterval
 *
 *	@param {Function|String} Callback function or statement
 *	@param {Integer} Timeout ( in milliseconds )
 */
libx.utils.timer.setInterval = function ( callback, timeout ) {
    var timer = setTimer(callback, timeout, Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);
    // Need to keep a reference to this timer to prevent it from being GC'd
    timers.push ( timer );
}

/**
 *	Initiates a timeout that will trigger the callback function exactly once
 *	after the specified timeout
 *
 *	Intended to be compatible with window.setTimeout
 *
 *	@param {Function|String} Callback function or statement
 *	@param {Integer} Timeout ( in milliseconds )
 */
libx.utils.timer.setTimeout = function ( callback, timeout ) {
    var timerpos = timers.length;
    var hasFired = false;
    var timer = setTimer(function () {
        if (timers[timerpos] === timer)
            delete timers[timerpos];

        hasFired = true;
        callback();
    }, timeout, Components.interfaces.nsITimer.TYPE_ONE_SHOT);

    if (!hasFired)
        timers.push ( timer );
}

}) ();
