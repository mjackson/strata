var utils = require("./utils");

module.exports = Response;

/**
 * Provides a convenient interface for setting various properties of the
 * response.
 *
 *   var res = new Response(status, headers, body);
 *   res.addHeader("Content-Length", "123");
 *   res.setCookie("cookieName", "cookieValue");
 *   callback(res.status, res.headers, res.body);
 */
function Response(status, headers, body) {
    this.status = status || 200;
    this.headers = headers || {};
    this.body = body || "";
}

/**
 * Sugar for sending this response using the given `callback`.
 */
Response.prototype.send = function send(callback) {
    callback(this.status, this.headers, this.body);
}

/**
 * Returns `true` if this response is empty, `false` otherwise.
 */
Response.prototype.__defineGetter__("empty", function empty() {
    if (this.body === "") {
        return true;
    }

    return utils.STATUS_WITH_NO_ENTITY_BODY.indexOf(this.status) !== -1;
});

/**
 * Returns `true` if this response uses chunked transfer encoding.
 */
Response.prototype.__defineGetter__("chunked", function chunked() {
    return this.headers["Transfer-Encoding"] === "chunked";
});

/**
 * Sets the Location header to redirect the client to the given `location`. The
 * `status` defaults to 302.
 */
Response.prototype.redirect = function redirect(location, status) {
    this.status = status || 302;
    this.headers["Location"] = location;
}

Response.prototype.__defineGetter__("contentType", function contentType() {
    return this.headers["Content-Type"];
});

Response.prototype.__defineGetter__("contentLength", function contentLength() {
    return parseInt(this.headers["Content-Length"], 10) || 0;
});

Response.prototype.__defineGetter__("location", function location() {
    return this.headers["Location"];
});

/**
 * Sets the `value` of the header with the given `name`.
 */
Response.prototype.setHeader = function setHeader(name, value) {
    name = utils.canonicalHeaderName(name);
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

Response.prototype.addHeader = function addHeader(name, value) {
    name = utils.canonicalHeaderName(name);

    if (this.headers[name]) {
        if (!Array.isArray(this.headers[name])) {
            this.headers[name] = [this.headers[name]];
        }

        this.headers[name].push(value);
    } else {
        this.headers[name] = value;
    }
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

    var cookie = encodeURIComponent(name) + "=",
        meta = "";

    if (typeof value == "object") {
        if (value.domain) meta += "; domain=" + value.domain;
        if (value.path) meta += "; path=" + value.path;
        if (value.expires) meta += "; expires=" + value.expires.toUTCString();
        if (value.secure) meta += "; secure";
        if (value.httpOnly) meta += "; HttpOnly";
        value = value.value || "";
    }

    cookie += encodeURIComponent(value);
    cookie += meta;

    var setCookie = this.headers["Set-Cookie"];

    if (Array.isArray(setCookie)) {
        setCookie.push(cookie);
        cookie = setCookie.join("\n");
    } else if (typeof setCookie == "string" && setCookie != "") {
        cookie = [setCookie, cookie].join("\n");
    }

    this.headers["Set-Cookie"] = cookie;
}

/**
 * Removes the cookie with the given `name` and `value`.
 */
Response.prototype.removeCookie = function removeCookie(name, value) {
    value = value || {};

    var setCookie = this.headers["Set-Cookie"],
        cookies;

    if (Array.isArray(setCookie)) {
        cookies = setCookie;
    } else if (typeof setCookie == "string") {
        cookies = setCookie.split("\n");
    } else {
        cookies = [];
    }

    var matcher;
    if (value.domain) {
        matcher = new RegExp("^" + encodeURIComponent(name) + "=.*domain=" + value.domain);
    } else {
        matcher = new RegExp("^" + encodeURIComponent(name) + "=");
    }

    cookies = cookies.filter(function (c) {
        return !matcher.test(c);
    });

    this.headers["Set-Cookie"] = cookies.join("\n");

    if (typeof value == "string") {
        this.setCookie(name, {
            value: value,
            expires: new Date(0)
        });
    } else {
        this.setCookie(name, {
            value: value.value,
            domain: value.domain,
            path: value.path,
            expires: new Date(0)
        });
    }
}
