var utils = require("./utils");

module.exports = Response;

/**
 * Provides a convenient interface for setting various properties of the
 * response.
 *
 *   var res = new Response(body, headers, status);
 *   res.addHeader("Content-Length", "123");
 *   res.setCookie("cookieName", "cookieValue");
 *   res.send(callback);
 */
function Response(body, headers, status) {
    if (!(this instanceof Response)) {
        return new Response(body, headers, status);
    }

    this.body = body || "";
    this.headers = headers || {};
    this.status = status || 200;
}

/**
 * Sugar for sending this response using the given `callback`.
 */
Response.prototype.send = function send(callback) {
    callback(this.status, this.headers, this.body);
}

/**
 * Returns `true` if this response is empty, `false` otherwise.
 * Note: This is determined by the status code, not the actual body.
 */
Response.prototype.__defineGetter__("empty", function empty() {
    if (this.body === "") {
        return true;
    }

    return utils.emptyBody(this.status);
});

/**
 * Returns `true` if this response uses chunked transfer encoding.
 */
Response.prototype.__defineGetter__("chunked", function chunked() {
    return this.transferEncoding === "chunked";
});

/**
 * Sets the `value` of the header with the given `name`.
 */
Response.prototype.setHeader = function setHeader(name, value) {
    name = utils.canonicalHeaderName(name);

    if (value instanceof Date) {
        value = value.toGMTString();
    } else if (typeof value !== "string") {
        value = value.toString();
    }

    this.headers[name] = value;
}

/**
 * Removes the header with the given `name`.
 */
Response.prototype.removeHeader = function removeHeader(name) {
    name = utils.canonicalHeaderName(name);
    delete this.headers[name];
}

/**
 * Returns `true` if this response has a header with the given `name`.
 */
Response.prototype.hasHeader = function hasHeader(name) {
    name = utils.canonicalHeaderName(name);
    return (name in this.headers);
}

/**
 * Adds the given `value` to the header with the given `name`.
 */
Response.prototype.addHeader = function addHeader(name, value) {
    name = utils.canonicalHeaderName(name);

    if (this.headers[name]) {
        value = [this.headers[name], value].join("\n");
    }

    this.headers[name] = value;
}

/**
 * Adds a cookie to the Set-Cookie header with the given `name` and `value`.
 * The `value` should be a string containing the value of the cookie or may be
 * an object with any of the following properties:
 *
 *   - value        The value of the cookie
 *   - domain       The domain
 *   - path         The path
 *   - expires      Should be a Date object
 *   - secure       Should be a boolean
 *   - httpOnly     Should be a boolean
 */
Response.prototype.setCookie = function setCookie(name, value) {
    value = value || {};

    if (typeof value === "string") {
        value = {value: value};
    }

    var cookie = encodeURIComponent(name) + "=";

    if (value.value) cookie += encodeURIComponent(value.value);
    if (value.domain) cookie += "; domain=" + value.domain;
    if (value.path) cookie += "; path=" + value.path;
    if (value.expires) cookie += "; expires=" + value.expires.toUTCString();
    if (value.secure) cookie += "; secure";
    if (value.httpOnly) cookie += "; HttpOnly";

    var setCookie = this.headers["Set-Cookie"];

    if (typeof setCookie === "string" && setCookie != "") {
        cookie = [setCookie, cookie].join("\n");
    }

    this.headers["Set-Cookie"] = cookie;
}

/**
 * Removes the cookie with the given `name` and `value`. See Response#addCookie
 * for more information on the `value` argument.
 * Note: This will both expire the cookie and remove any value that it has
 * in the response.
 */
Response.prototype.removeCookie = function removeCookie(name, value) {
    value = value || {};

    if (typeof value === "string") {
        value = {value: value};
    }

    var setCookie = this.headers["Set-Cookie"],
        cookies;

    if (typeof setCookie === "string") {
        cookies = setCookie.split("\n");
    } else {
        cookies = [];
    }

    var matcher;
    if (value.domain) {
        matcher = new RegExp("^" + encodeURIComponent(name) + "=.*?domain=" + value.domain);
    } else {
        matcher = new RegExp("^" + encodeURIComponent(name) + "=");
    }

    cookies = cookies.filter(function (c) {
        return !matcher.test(c);
    });

    this.headers["Set-Cookie"] = cookies.join("\n");

    value.expires = new Date(0); // Expire the cookie.
    delete value.value; // Remove the cookie value.

    this.setCookie(name, value);
}

/**
 * Sets the Location header to redirect the client to the given `location`. The
 * `status` defaults to 302.
 */
Response.prototype.redirect = function redirect(location, status) {
    this.location = location;
    this.status = status || 302;
}

/**
 * An array of all HTTP response header names.
 */
Response.headers = [
    "Accept-Ranges",
    "Age",
    "Allow",
    "Cache-Control",
    "Connection",
    "Content-Encoding",
    "Content-Language",
    "Content-Length",
    "Content-Location",
    "Content-MD5",
    "Content-Disposition",
    "Content-Range",
    "Content-Type",
    "Date",
    "ETag",
    "Expires",
    "Last-Modified",
    "Link",
    "Location",
    "P3P",
    "Pragma",
    "Proxy-Authenticate",
    "Refresh",
    "Retry-After",
    "Server",
    "Set-Cookie",
    "Strict-Transport-Security",
    "Trailer",
    "Transfer-Encoding",
    "Vary",
    "Via",
    "Warning",
    "WWW-Authenticate"
];

/**
 * Define convenient getters/setters for all response headers using the
 * camel-cased version of the HTTP header name, e.g.:
 *
 * Host => host
 * Last-Modified => lastModified
 */
Response.headers.forEach(function (headerName) {
    var propertyName = utils.propertyName(headerName);

    if (propertyName in Response.prototype) {
        return;
    }

    Object.defineProperty(Response.prototype, propertyName, {
        enumerable: true,
        set: function (value) {
            this.setHeader(headerName, value);
        },
        get: function () {
            return this.headers[headerName];
        }
    });
});
