var http = require("http"),
    qs = require("querystring"),
    fs = require("fs"),
    path = require("path");

/**
 * A map of HTTP status codes to their messages.
 */
exports.HTTP_STATUS_CODES = http.STATUS_CODES;

/**
 * A map of HTTP status messages to their codes.
 */
exports.HTTP_STATUS_MESSAGES = {};
var message;
for (var statusCode in exports.HTTP_STATUS_CODES) {
    statusCode = parseInt(statusCode, 10);
    message = exports.HTTP_STATUS_CODES[statusCode];
    exports.HTTP_STATUS_MESSAGES[message] = statusCode;
}

/**
 * An array of HTTP status codes that indicate no entity body.
 */
exports.STATUS_WITH_NO_ENTITY_BODY = [100, 101, 204, 304];

/**
 * Converts the given +headerName+ to its canonical form.
 *
 * "accept" => "Accept"
 * "content-type" => "Content-Type"
 * "x-requested-with" => "X-Requested-With"
 */
exports.canonicalHeaderName = function canonicalHeaderName(name) {
    name = name.toLowerCase();
    return name.replace(/(^|-)([a-z])/g, function (s, dash, letter) {
        return dash + letter.toUpperCase();
    });
}

/**
 * Converts the given +headerName+ to a string of that name that is
 * capitalized, sans dashes.
 *
 * "accept" => "Accept"
 * "content-type" => "ContentType"
 * "x-requested-with" => "XRequestedWith"
 */
exports.capitalizedHeaderName = function capitalizedHeaderName(headerName) {
    return exports.canonicalHeaderName(headerName).replace(/-/g, "");
}

/**
 * Converts the given +headerName+ to a string property name that could be
 * found in the environment for that header.
 *
 * "Accept" => "httpAccept"
 * "Content-Type" => "httpContentType"
 * "X-Requested-With" => "httpXRequestedWith"
 */
exports.httpPropertyName = function httpPropertyName(headerName) {
    return "http" + exports.capitalizedHeaderName(headerName);
}

var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var shortDays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
var shortMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function zeropad(n) {
    return n > 9 ? String(n) : "0" + String(n);
}

function twelveHour(t) {
    var hour = t.getHours() % 12;
    return hour === 0 ? 12 : hour;
}

var strftimeCallbacks = {
    // Short day name (Sun-Sat)
    a: function (t) { return shortDays[t.getDay()]; },
    // Long day name (Sunday-Saturday)
    A: function (t) { return days[t.getDay()]; },
    // Short month name (Jan-Dec)
    b: function (t) { return shortMonths[t.getMonth()]; },
    // Long month name (January-December)
    B: function (t) { return months[t.getMonth()]; },
    // String representation (Thu Dec 23 2010 11:48:54 GMT-0800 (PST))
    c: function (t) { return t.toString(); },
    // Two-digit day of the month (01-31)
    d: function (t) { return zeropad(t.getDate()); },
    // Day of the month (1-31)
    D: function (t) { return String(t.getDate()); },
    // Two digit hour in 24-hour format (00-23)
    H: function (t) { return zeropad(t.getHours()); },
    // Hour in 24-hour format (0-23)
    i: function (t) { return String(t.getHours()); },
    // Two digit hour in 12-hour format (01-12)
    I: function (t) { return zeropad(twelveHour(t)); },
    // Hour in 12-hour format (1-12)
    l: function (t) { return String(twelveHour(t)); },
    // Two digit month (01-12)
    m: function (t) { return zeropad(t.getMonth() + 1); },
    // Two digit minutes (00-59)
    M: function (t) { return zeropad(t.getMinutes()); },
    // am or pm
    p: function (t) { return t.getHours() < 12 ? "am" : "pm"; },
    // AM or PM
    P: function (t) { return t.getHours() < 12 ? "AM" : "PM"; },
    // Two digit seconds (00-61)
    S: function (t) { return zeropad(t.getSeconds()); },
    // Zero-based day of the week (0-6)
    w: function (t) { return String(t.getDay()); },
    // Locale-specific date representation
    x: function (t) { return t.toLocaleDateString(); },
    // Locale-specific time representation
    X: function (t) { return t.toLocaleTimeString(); },
    // Year without century (00-99)
    y: function (t) { return zeropad(t.getFullYear() % 100); },
    // Year with century
    Y: function (t) { return String(t.getFullYear()); },
    // Timezone offset (+0000)
    Z: function (t) {
             if (t.getTimezoneOffset() > 0) {
                 return "-" + zeropad(t.getTimezoneOffset() / 60) + "00";
             } else {
                 return "+" + zeropad(Math.abs(t.getTimezoneOffset()) / 60) + "00";
             }
         },
    // A percent sign
    "%": function (t) { return "%"; }
};

/**
 * Returns a string of the +date+ in the given +format+.
 */
exports.strftime = function strftime(date, format) {
    var regexp;
    for (var symbol in strftimeCallbacks) {
        regexp = new RegExp("%" + symbol, "g");
        format = format.replace(regexp, strftimeCallbacks[symbol](date));
    }

    return format;
}
