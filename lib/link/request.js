var path = require("path"),
    multipart = require("./multipart"),
    querystring = require("./querystring"),
    utils = require("./utils");

module.exports = Request;

/**
 * Provides a convenient interface to the application environment and various
 * properties of the request. This class is stateless, and directly modifies
 * the +env+ provided in the constructor.
 */
function Request(env) {
    this.env = env;
}

/**
 * The set of form-data media types. Requests that indicate one of these media
 * types were most likely made using an HTML form.
 */
Request.FORM_DATA_MEDIA_TYPES = [
    "application/x-www-form-urlencoded",
    "multipart/form-data"
];

/**
 * The set of parseable media types. Requests that indicate one of these media
 * types should be able to be parsed automatically.
 */
Request.PARSEABLE_DATA_MEDIA_TYPES = [
    "multipart/related",
    "multipart/mixed",
    "application/json"
];

Request.prototype.__defineGetter__("protocolVersion", function version() {
    return this.env.protocolVersion;
});

Request.prototype.__defineGetter__("method", function method() {
    return this.env.requestMethod;
});

Request.prototype.__defineGetter__("scriptName", function scriptName() {
    return this.env.scriptName;
});

Request.prototype.__defineSetter__("scriptName", function setScriptName(value) {
    this.env.scriptName = value;
});

Request.prototype.__defineGetter__("pathInfo", function pathInfo() {
    return this.env.pathInfo;
});

Request.prototype.__defineSetter__("pathInfo", function setPathInfo(value) {
    this.env.pathInfo = value;
});

/**
 * The media type (type/subtype) portion of the Content-Type header without any
 * media type parameters. e.g., when Content-Type is "text/plain;charset=utf-8",
 * the mediaType is "text/plain".
 *
 * For more information on the use of media types in HTTP, see:
 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.7
 */
Request.prototype.__defineGetter__("mediaType", function mediaType() {
    var contentType = this.env.contentType;
    return contentType && contentType.split(/\s*[;,]\s*/)[0].toLowerCase();
});

Request.prototype.__defineGetter__("contentLength", function contentLength() {
    return this.env.contentLength;
});

Request.prototype.__defineGetter__("contentType", function contentType() {
    var type = this.env.contentType;
    return (type && type !== "") ? type : null;
});

Request.prototype.__defineGetter__("userAgent", function userAgent() {
    return this.env.httpUserAgent;
});

/**
 * The URL scheme used in the request (i.e. "http" or "https").
 */
Request.prototype.__defineGetter__("scheme", function scheme() {
    if (this.env.httpXForwardedSsl === "on") {
        return "https";
    } else if (this.env.httpXForwardedProto) {
        return this.env.httpXForwardedProto.split(",")[0];
    }

    return this.env["link.urlScheme"];
});

/**
 * Returns +true+ if this request was made over SSL, +false+ otherwise.
 */
Request.prototype.__defineGetter__("ssl", function ssl() {
    return this.scheme === "https";
});

Request.prototype.__defineGetter__("hostWithPort", function hostWithPort() {
    var forwarded = this.env.httpXForwardedHost;

    if (forwarded) {
        var parts = forwarded.split(/,\s?/);
        return parts[parts.length - 1];
    } else if (this.env.httpHost) {
        return this.env.httpHost;
    }

    return this.env.serverName + ":" + this.env.serverPort;
});

/**
 * Returns the name of the host used in this request.
 */
Request.prototype.__defineGetter__("host", function host() {
    return this.hostWithPort.replace(/:\d+$/, "");
});

/**
 * Returns the port as a Number.
 */
Request.prototype.__defineGetter__("port", function port() {
    var port = this.hostWithPort.split(":")[1] || this.env.httpXForwardedPort;

    if (port) {
        return parseInt(port, 10);
    } else if (this.ssl) {
        return 443;
    } else if (this.env.httpXForwardedHost) {
        return 80;
    }

    return parseInt(this.env.serverPort, 10);
});

/**
 * Returns a string representing the scheme, hostname, and port of the original
 * request.
 */
Request.prototype.__defineGetter__("baseUrl", function baseUrl() {
    var scheme = this.scheme;

    var url = scheme + "://";
    url += this.host;

    if ((scheme === "https" && port !== 443) || (scheme === "http" && port !== 80)) {
        url += ":" + String(this.port);
    }

    return url;
});

/**
 * Attempts to reconstruct the original URL of this request.
 */
Request.prototype.__defineGetter__("url", function url() {
    return this.baseUrl + this.fullPath;
});

/**
 * The path of this request, without the query string.
 */
Request.prototype.__defineGetter__("path", function path() {
    return this.scriptName + this.pathInfo;
});

/**
 * The path of this request, including the query string.
 */
Request.prototype.__defineGetter__("fullPath", function fullPath() {
    var queryString = this.queryString;

    if (queryString === "") {
        return this.path;
    }

    return this.path + "?" + queryString;
});

/**
 * Is +true+ if this request was made via XMLHttpRequest, +false+ otherwise.
 */
Request.prototype.__defineGetter__("xhr", function xhr() {
    return this.env.httpXRequestedWith === "XMLHttpRequest";
});

/**
 * Returns the query string.
 */
Request.prototype.__defineGetter__("queryString", function queryString() {
    return this.env.queryString;
});

/**
 * Returns the prefix that is used for the names of file uploads.
 */
Request.prototype.__defineGetter__("uploadPrefix", function uploadPrefix() {
    return this.env["link.request.uploadPrefix"] || "LinkUpload-";
});

/**
 * Sets the prefix that is used for the names of file uploads.
 */
Request.prototype.__defineSetter__("uploadPrefix", function setUploadPrefix(value) {
    this.env["link.request.uploadPrefix"] = value;
});

/**
 * Returns the directory where file uploads are stored.
 */
Request.prototype.__defineGetter__("uploadDir", function uploadDir() {
    return this.env["link.request.uploadDir"] || "/tmp";
});

/**
 * Sets the directory where file uploads are stored.
 */
Request.prototype.__defineSetter__("uploadDir", function setUploadDir(value) {
    this.env["link.request.uploadDir"] = value;
});

Request.prototype.__defineGetter__("formData", function formData() {
    var type = this.mediaType;

    if (Request.FORM_DATA_MEDIA_TYPES.indexOf(type) !== -1) {
        return true;
    }

    var method = this.env["link.methodOverride.originalMethod"] || this.method;

    return (!type && method === "POST");
});

Request.prototype.__defineGetter__("parseableData", function parseableData() {
    return Request.PARSEABLE_DATA_MEDIA_TYPES.indexOf(this.mediaType) !== -1;
});

/**
 * Calls the given +callback+ with an object of cookies received in the HTTP
 * Cookie header.
 */
Request.prototype.cookies = function cookies(callback) {
    if (!this.env.httpCookie) {
        return callback(null, {});
    }

    if (this.env["link.request.cookieString"] !== this.env.httpCookie) {
        this.env["link.request.cookieString"] = this.env.httpCookie;
        delete this.env["link.request.cookies"];
    }

    if (this.env["link.request.cookies"]) {
        return callback(null, this.env["link.request.cookies"]);
    }

    var parser = new querystring.Parser(/[;,] */g),
        cookies = {},
        self = this;

    parser.onParam = function (name, value) {
        cookies[name] = value;
    }

    parser.onEnd = function () {
        // From RFC 2109:
        // If multiple cookies satisfy the criteria above, they are ordered in
        // the Cookie header such that those with more specific Path attributes
        // precede those with less specific. Ordering with respect to other
        // attributes (e.g., Domain) is unspecified.
        for (var cookieName in cookies) {
            if (Array.isArray(cookies[cookieName])) {
                cookies[cookieName] = cookies[cookieName][0] || "";
            }
        }

        self.env["link.request.cookies"] = cookies;
        callback(null, cookies);
    }

    parser.write(new Buffer(this.env.httpCookie));
    parser.end();
}

/**
 * Calls the given +callback+ with an object of parameters received in the
 * query string.
 */
Request.prototype.query = function query(callback) {
    if (!this.env.queryString) {
        return callback(null, {});
    }

    if (this.env["link.request.queryString"] !== this.env.queryString) {
        this.env["link.request.queryString"] = this.env.queryString;
        delete this.env["link.request.query"];
    }

    if (this.env["link.request.query"]) {
        return callback(null, this.env["link.request.query"]);
    }

    var parser = new querystring.Parser,
        params = {},
        self = this;

    parser.onParam = function (name, value) {
        params[name] = value;
    }

    parser.onEnd = function () {
        self.env["link.request.query"] = params;
        callback(null, params);
    }

    parser.write(new Buffer(this.env.queryString));
    parser.end();
}

/**
 * Calls the given +callback+ with the contents of the request body. If the
 * body is parseable, this will be an object of data. Otherwise, it will be the
 * contents of the body as a string.
 */
Request.prototype.body = function body(callback) {
    if (this.env["link.request.body"]) {
        return callback(null, this.env["link.request.body"]);
    }

    var contentType = this.contentType || "",
        input = this.env["link.input"],
        self = this;

    input.resume(); // In case it's paused.

    if (contentType === "application/json") {
        var body = "";

        input.on("data", function (buffer) {
            body += buffer.toString("utf8");
        });

        input.on("end", function () {
            try {
                var obj = JSON.parse(body);
                self.env["link.request.body"] = obj;
                callback(null, obj);
            } catch (e) {
                callback(e, {});
            }
        });
    } else if (this.formData || this.parseableData) {
        var match = contentType.match(/^multipart\/.*boundary=(?:"([^"]+)"|([^;]+))/im),
            params = {},
            parser;

        if (match) {
            var boundary = match[1] || match[2];

            parser = new multipart.Parser(boundary, this.uploadDir, this.uploadPrefix);

            // Throttle the input stream based on how quickly we can
            // write to disk.
            parser.onFile = function (file) {
                file.on("write", function () {
                    input.pause();
                });

                file.on("progress", function (size) {
                    input.resume();
                });
            }

            input.on("data", function (buffer) {
                var length = parser.write(buffer);
                if (length !== buffer.length) {
                    input.pause();
                    callback(new Error("Multipart parsing error: " + length + " of " + buffer.length + " bytes parsed"), params);
                }
            });

            input.on("end", function () {
                try {
                    parser.end();
                } catch (e) {
                    callback(e, params);
                }
            });
        } else {
            parser = new querystring.Parser;

            input.on("data", function (buffer) {
                parser.write(buffer);
            });

            input.on("end", function () {
                parser.end();
            });
        }

        parser.onParam = function (name, value) {
            params[name] = value;
        }

        parser.onEnd = function () {
            self.env["link.request.body"] = params;
            callback(null, params);
        }
    } else {
        var body = "";

        input.on("data", function (buffer) {
            body += buffer.toString("utf8");
        });

        input.on("end", function () {
            self.env["link.request.body"] = body;
            callback(null, body);
        });
    }
}

/**
 * Calls the given +callback+ with an object that is the union of query and
 * body parameters.
 */
Request.prototype.params = function params(callback) {
    if (this.env["link.request.params"]) {
        callback(this.env["link.request.params"]);
    } else {
        var params = {},
            self = this;

        this.query(function (err, query) {
            if (err) {
                callback(err, params);
            } else {
                for (var param in query) {
                    params[param] = query[param];
                }

                self.body(function (err, body) {
                    if (err) {
                        callback(err, params);
                    } else {
                        if (typeof body === "object") {
                            for (var param in body) {
                                params[param] = body[param];
                            }
                        }

                        self.env["link.request.params"] = params;

                        callback(null, params);
                    }
                });
            }
        });
    }
}
