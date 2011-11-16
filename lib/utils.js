var http = require("http");

exports.emptyBody = emptyBody;
exports.normalizedHeaderName = normalizedHeaderName;
exports.canonicalHeaderName = canonicalHeaderName;
exports.capitalizedHeaderName = capitalizedHeaderName;
exports.httpPropertyName = httpPropertyName;
exports.reverseHttpPropertyName = reversePropertyName;
exports.strftime = strftime;
exports.byteSizeFormat = byteSizeFormat;
exports.escapeHtml = escapeHtml;
exports.escapeRe = escapeRe;
exports.isRe = isRe;
exports.isEmptyObject = isEmptyObject;
exports.compareLength = compareLength;
exports.sortByLength = sortByLength;
exports.badRequest = badRequest;
exports.unauthorized = unauthorized;
exports.notFound = notFound;
exports.empty = empty;

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
 * Returns `true` if the given `status` code indicates a response that MUST NOT
 * have any content in the body.
 */
function emptyBody(status) {
    return exports.STATUS_WITH_NO_ENTITY_BODY.indexOf(status) != -1;
}

/**
 * Converts the given header `name` to its normalized form.
 *
 * "Accept" => "accept"
 * "Content-Type" => "content-type"
 * "X-Forwarded-Ssl" => "x-forwarded-ssl"
 */
function normalizedHeaderName(name) {
    return name.toLowerCase();
}

/**
 * Converts the given header `name` to its canonical form.
 *
 * "accept" => "Accept"
 * "content-type" => "Content-Type"
 * "x-forwarded-ssl" => "X-Forwarded-Ssl"
 */
function canonicalHeaderName(name) {
    var norm = normalizedHeaderName(name);

    return norm.replace(/(^|-)([a-z])/g, function (s, a, b) {
        return a + b.toUpperCase();
    });
}

/**
 * Converts the given header `name` to a string of that name that is
 * capitalized, sans dashes.
 *
 * "accept" => "Accept"
 * "content-type" => "ContentType"
 * "x-forwarded-ssl" => "XForwardedSsl"
 */
function capitalizedHeaderName(name) {
    return canonicalHeaderName(name).replace(/-/g, "");
}

/**
 * Converts the given header `name` to a string property name that could be
 * found in the environment for that header.
 *
 * "Accept" => "httpAccept"
 * "Content-Type" => "httpContentType"
 * "x-forwarded-ssl" => "httpXForwardedSsl"
 */
function httpPropertyName(name) {
    return "http" + capitalizedHeaderName(name);
}

/**
 * Derives the normalized form of the original header name from the http*
 * property `name`.
 *
 * "httpAccept" => "accept"
 * "httpContentType" => "content-type"
 * "httpXForwardedSsl" => "x-forwarded-ssl"
 */
function reversePropertyName(name) {
    var dashed = name.substring(4).replace(/(.)([A-Z])/g, function (s, a, b) {
        return a + "-" + b;
    });

    return normalizedHeaderName(dashed);
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
 * Returns a string of the `date` in the given `format`.
 */
function strftime(date, format) {
    var regexp;
    for (var symbol in strftimeCallbacks) {
        regexp = new RegExp("%" + symbol, "g");
        format = format.replace(regexp, strftimeCallbacks[symbol](date));
    }

    return format;
}

/**
 * Returns a human-friendly string of the given byte size.
 */
function byteSizeFormat(size) {
    var tier = size > 0 ? Math.floor(Math.log(size) / Math.log(1024)) : 0;
    var n = size / Math.pow(1024, tier);

    if (tier > 0) {
        n = Math.floor(n * 10) / 10; // Preserve only 1 digit after decimal.
    }

    return String(n) + ["B", "K", "M", "G", "T"][tier];
}

/**
 * Escapes all special HTML characters in the given `string`.
 */
function escapeHtml(string) {
  return String(string)
    .replace(/&(?!\w+;)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Escapes all special regular expression characters in the given `string`.
 */
function escapeRe(string) {
    return String(string).replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");
}

/**
 * Returns `true` if the given `obj` is a RegExp.
 */
function isRe(obj) {
    return Object.prototype.toString.call(obj) == "[object RegExp]";
}

/**
 * Returns `true` if the given `obj` has no properties.
 */
function isEmptyObject(obj) {
    for (var key in obj) {
        return false;
    }

    return true;
}

/**
 * Compares the `length` property of `a` and `b`. Suitable for use as the
 * return value in an Array.prototype.sort callback.
 */
function compareLength(a, b) {
    if (a.length < b.length) {
        return -1;
    }

    if (b.length < a.length) {
        return 1;
    }

    return 0;
}

/**
 * Sorts the given `array` by the length of its members.
 */
function sortByLength(array) {
    array.sort(compareLength);
}

/**
 * A helper for returning a 400 Bad Request response.
 */
function badRequest(callback) {
    var content = "Bad Request";

    callback(400, {
        "Content-Type": "text/plain",
        "Content-Length": Buffer.byteLength(content).toString()
    }, content);
}

/**
 * A helper for returning a 401 Unauthorized response.
 */
function unauthorized(env, callback, realm) {
    realm = realm || "Authorization Required";

    var content = "Unauthorized";

    callback(401, {
        "Content-Type": "text/plain",
        "Content-Length": Buffer.byteLength(content).toString(),
        "WWW-Authenticate": 'Basic realm="' + realm + '"'
    }, content);
}

/**
 * A helper for returning a 404 Not Found response.
 */
function notFound(env, callback) {
    var content = "Not found: " + env.pathInfo;

    callback(404, {
        "Content-Type": "text/plain",
        "Content-Length": Buffer.byteLength(content).toString()
    }, content);
}

/**
 * A helper app that returns an empty 200 response.
 */
function empty(env, callback) {
    callback(empty.status, empty.headers, empty.body);
}

empty.status = 200;
empty.headers = {"Content-Type": "text/plain", "Content-Length": "0"};
empty.body = "";
