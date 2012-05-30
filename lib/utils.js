var http = require("http");

exports.emptyBody = emptyBody;
exports.normalizedHeaderName = normalizedHeaderName;
exports.canonicalHeaderName = canonicalHeaderName;
exports.capitalizedHeaderName = capitalizedHeaderName;
exports.httpPropertyName = httpPropertyName;
exports.propertyName = propertyName;
exports.byteSizeFormat = byteSizeFormat;
exports.escapeHtml = escapeHtml;
exports.escapeRe = escapeRe;
exports.compileRoute = compileRoute;
exports.isEmptyObject = isEmptyObject;
exports.isRegExp = isRegExp;
exports.compareLength = compareLength;
exports.sortByLength = sortByLength;
exports.badRequest = badRequest;
exports.unauthorized = unauthorized;
exports.forbidden = forbidden;
exports.notFound = notFound;
exports.serverError = serverError;
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
    message = exports.HTTP_STATUS_CODES[statusCode];
    exports.HTTP_STATUS_MESSAGES[message] = parseInt(statusCode, 10);
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
 * Converts the given header `name` to a string that should be used as the
 * environment property name for that header.
 *
 * "Accept" => "httpAccept"
 * "Content-Type" => "httpContentType"
 * "x-forwarded-ssl" => "httpXForwardedSsl"
 */
function httpPropertyName(name) {
    return "http" + capitalizedHeaderName(name);
}

/**
 * Converts the given header `name` to a string that could be used as a
 * JavaScript object property name.
 */
function propertyName(name) {
    var capitalName = capitalizedHeaderName(name)
    return capitalName.substring(0, 1).toLowerCase() + capitalName.substring(1);
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
 * Compiles the given `route` string into a RegExp that can be used to match
 * it. The route may contain named keys in the form of a colon followed by a
 * valid JavaScript identifier (e.g. ":name", ":_name", or ":$name" are all
 * valid keys). If it does, these keys will be added to the given `keys` array.
 *
 * If the route contains the special "*" symbol, it will automatically create a
 * key named "splat" and will substituted with a "(.*?)" pattern in the
 * resulting RegExp.
 */
function compileRoute(route, keys) {
    var pattern = route.replace(/((:[a-z_$][a-z0-9_$]*)|[*.+()])/ig, function (match) {
        switch (match) {
        case "*":
            keys.push("splat");
            return "(.*?)";
        case ".":
        case "+":
        case "(":
        case ")":
            return escapeRe(match);
        }

        keys.push(match.substring(1));

        return "([^./?#]+)";
    });

    return new RegExp("^" + pattern + "$");
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
 * Returns `true` if the given `obj` is a RegExp.
 * Note: This can be removed on node 0.6 in favor of util.isRegExp.
 */
function isRegExp(obj) {
    return Object.prototype.toString.call(obj) == "[object RegExp]";
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
        "Content-Length": String(Buffer.byteLength(content))
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
        "Content-Length": String(Buffer.byteLength(content)),
        "WWW-Authenticate": 'Basic realm="' + realm + '"'
    }, content);
}

/**
 * A helper for returning a 403 Forbidden response.
 */
function forbidden(env, callback) {
    var content = "Forbidden";

    callback(403, {
        "Content-Type": "text/plain",
        "Content-Length": String(Buffer.byteLength(content))
    }, content);
}

/**
 * A helper for returning a 404 Not Found response.
 */
function notFound(env, callback) {
    var content = "Not Found: " + env.pathInfo;

    callback(404, {
        "Content-Type": "text/plain",
        "Content-Length": String(Buffer.byteLength(content))
    }, content);
}

/**
 * A helper for returning a 500 Internal Server Error response.
 */
function serverError(env, callback) {
    var content = "Internal Server Error";

    callback(500, {
        "Content-Type": "text/plain",
        "Content-Length": String(Buffer.byteLength(content))
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
