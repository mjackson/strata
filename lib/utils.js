var http = require("http");

exports.emptyBody = emptyBody;
exports.normalizedHeaderName = normalizedHeaderName;
exports.canonicalHeaderName = canonicalHeaderName;
exports.capitalizedHeaderName = capitalizedHeaderName;
exports.httpPropertyName = httpPropertyName;
exports.byteSizeFormat = byteSizeFormat;
exports.escapeHtml = escapeHtml;
exports.escapeRe = escapeRe;
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
    return normalizedHeaderName(name).replace(/(^|-)([a-z])/g, function (s, a, b) {
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

var escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
};

/**
 * Escapes all special HTML characters in the given `string`.
 */
function escapeHtml(string) {
    return String(string).replace(/[&<>"']/g, function (c) {
        return escapeMap[c];
    });
}

/**
 * Escapes all special regular expression characters in the given `string`.
 */
function escapeRe(string) {
    return String(string).replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");
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
