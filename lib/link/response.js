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
 * Returns +true+ if this response is empty, +false+ otherwise.
 */
Response.prototype.empty = function empty() {
    if (this.body === "") {
        return true;
    }

    return utils.STATUS_WITH_NO_ENTITY_BODY.indexOf(this.status) !== -1;
}

/**
 * Sets the +value+ of the header with the given +name+.
 */
Response.prototype.setHeader = function setHeader(name, value) {
    name = utils.canonicalHeaderName(name);
    this.headers[name] = value;
}

/**
 * Removes the header with the given +name+.
 */
Response.prototype.removeHeader = function removeHeader(name) {
    name = utils.canonicalHeaderName(name);
    delete this.headers[name];
}

/**
 * Returns +true+ if this response has a header with the given +name+.
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

Response.prototype.setCookie = function setCookie(name, value) {
    var cookie = encodeURIComponent(name) + "=",
        meta = "";

    if (typeof value === "object") {
        if (value.domain) meta += "; domain=" + value.domain;
        if (value.path) meta += "; path=" + value.path;
        if (value.expires) meta += "; expires=" + value.expires.toUTCString();
        if (value.secure) meta += "; secure";
        if (value.httpOnly) meta += "; HttpOnly";
        value = value.value || "";
    }

    cookie += encodeURIComponent(value);
    cookie += meta;

    this.addHeader("Set-Cookie", cookie);
}
