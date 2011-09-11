var path = require("path"),
    strata = require("./index"),
    multipart = require("./multipart"),
    querystring = require("./querystring"),
    utils = require("./utils"),
    Accept = require("./header/accept"),
    AcceptCharset = require("./header/acceptcharset"),
    AcceptEncoding = require("./header/acceptencoding"),
    AcceptLanguage = require("./header/acceptlanguage");

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

/**
 * The protocol used in the request (i.e. "http:" or "https:").
 */
Request.prototype.__defineGetter__("protocol", function protocol() {
    if (this.env.httpXForwardedSsl === "on") {
        return "https:";
    } else if (this.env.httpXForwardedProto) {
        return this.env.httpXForwardedProto.split(",")[0] + ":";
    }

    return this.env.protocol;
});

/**
 * The version of the protocol used in the request.
 */
Request.prototype.__defineGetter__("protocolVersion", function protocolVersion() {
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

Request.prototype.__defineGetter__("queryString", function queryString() {
    return this.env.queryString;
});

Request.prototype.__defineSetter__("queryString", function queryString(value) {
    this.env.queryString = value;
});

Request.prototype.__defineGetter__("contentType", function contentType() {
    return this.env.contentType;
});

Request.prototype.__defineGetter__("contentLength", function contentLength() {
    return this.env.contentLength;
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

/**
 * Returns the name of the user agent making the request, as indicated in the
 * User-Agent request header.
 */
Request.prototype.__defineGetter__("userAgent", function userAgent() {
    return this.env.httpUserAgent;
});

/**
 * Returns the URI of the resource that referred the client, as indicated in the
 * Referer request header.
 */
Request.prototype.__defineGetter__("referrer", function referrer() {
    return this.env.httpReferer;
});

/**
 * Returns +true+ if this request was made over SSL, +false+ otherwise.
 */
Request.prototype.__defineGetter__("ssl", function ssl() {
    return this.protocol === "https:";
});

/**
 * Returns +true+ if this request was made via XMLHttpRequest as indicated by
 * the X-Requested-With header, +false+ otherwise.
 */
Request.prototype.__defineGetter__("xhr", function xhr() {
    return this.env.httpXRequestedWith === "XMLHttpRequest";
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
 * Returns the port number used in this request.
 */
Request.prototype.__defineGetter__("port", function port() {
    var port = this.hostWithPort.split(":")[1] || this.env.httpXForwardedPort;

    if (port) {
        return port;
    } else if (this.ssl) {
        return "443";
    } else if (this.env.httpXForwardedHost) {
        return "80";
    }

    return this.env.serverPort;
});

/**
 * Returns a URL containing the protocol, hostname, and port of the original
 * request.
 */
Request.prototype.__defineGetter__("baseUrl", function baseUrl() {
    var protocol = this.protocol;
    var url = protocol + "//" + this.host;

    var port = this.port;
    if ((protocol == "https:" && port != "443") || (protocol == "http:" && port != "80")) {
        url += ":" + port;
    }

    return url;
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

    if (queryString == "") {
        return this.path;
    }

    return this.path + "?" + queryString;
});

/**
 * Attempts to reconstruct the original URL of this request.
 */
Request.prototype.__defineGetter__("url", function url() {
    return this.baseUrl + this.fullPath;
});

/**
 * Returns +true+ if this request indicates the client accepts the given
 * +mediaType+.
 */
Request.prototype.accept = function accept(mediaType) {
    if (!this.env["strata.request.accept"]) {
        this.env["strata.request.accept"] = new Accept(this.env.httpAccept);
    }

    return this.env["strata.request.accept"].accept(mediaType);
}

/**
 * Returns +true+ if this request indicates the client accepts the given
 * +charset+.
 */
Request.prototype.acceptCharset = function acceptCharset(charset) {
    if (!this.env["strata.request.acceptCharset"]) {
        this.env["strata.request.acceptCharset"] = new AcceptCharset(this.env.httpAcceptCharset);
    }

    return this.env["strata.request.acceptCharset"].accept(charset);
}

/**
 * Returns +true+ if this request indicates the client accepts the given
 * +encoding+.
 */
Request.prototype.acceptEncoding = function acceptEncoding(encoding) {
    if (!this.env["strata.request.acceptEncoding"]) {
        this.env["strata.request.acceptEncoding"] = new AcceptEncoding(this.env.httpAcceptEncoding);
    }

    return this.env["strata.request.acceptEncoding"].accept(encoding);
}

/**
 * Returns +true+ if this request indicates the client accepts the given
 * +language+.
 */
Request.prototype.acceptLanguage = function acceptLanguage(language) {
    if (!this.env["strata.request.acceptLanguage"]) {
        this.env["strata.request.acceptLanguage"] = new AcceptLanguage(this.env.httpAcceptLanguage);
    }

    return this.env["strata.request.acceptLanguage"].accept(language);
}

/**
 * Returns the prefix that is used for the names of file uploads.
 */
Request.prototype.__defineGetter__("uploadPrefix", function uploadPrefix() {
    return this.env["strata.request.uploadPrefix"] || "StrataUpload-";
});

/**
 * Sets the prefix that is used for the names of file uploads.
 */
Request.prototype.__defineSetter__("uploadPrefix", function setUploadPrefix(value) {
    this.env["strata.request.uploadPrefix"] = value;
});

/**
 * Returns the directory where file uploads are stored.
 */
Request.prototype.__defineGetter__("uploadDir", function uploadDir() {
    return this.env["strata.request.uploadDir"] || "/tmp";
});

/**
 * Sets the directory where file uploads are stored.
 */
Request.prototype.__defineSetter__("uploadDir", function setUploadDir(value) {
    this.env["strata.request.uploadDir"] = value;
});

/**
 * Is true if this request was most likely made using an HTML form.
 */
Request.prototype.__defineGetter__("formData", function formData() {
    var type = this.mediaType;

    if (Request.FORM_DATA_MEDIA_TYPES.indexOf(type) !== -1) {
        return true;
    }

    var method = this.env["strata.originalMethod"] || this.method;

    return (!type && method === "POST");
});

/**
 * Is true if this request contains data that is able to be parsed.
 */
Request.prototype.__defineGetter__("parseableData", function parseableData() {
    if (Request.PARSEABLE_DATA_MEDIA_TYPES.indexOf(this.mediaType) !== -1) {
        return true;
    }

    return this.formData;
});

/**
 * Calls the given +callback+ with an object of cookies received in the HTTP
 * Cookie header.
 */
Request.prototype.cookies = function cookies(callback) {
    if (!this.env.httpCookie) {
        callback(null, {});
        return;
    }

    if (this.env["strata.request.cookieString"] !== this.env.httpCookie) {
        this.env["strata.request.cookieString"] = this.env.httpCookie;
        delete this.env["strata.request.cookies"];
    }

    if (this.env["strata.request.cookies"]) {
        callback(null, this.env["strata.request.cookies"]);
        return;
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

        self.env["strata.request.cookies"] = cookies;
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
        callback(null, {});
        return;
    }

    if (this.env["strata.request.queryString"] !== this.env.queryString) {
        this.env["strata.request.queryString"] = this.env.queryString;
        delete this.env["strata.request.query"];
    }

    if (this.env["strata.request.query"]) {
        callback(null, this.env["strata.request.query"]);
        return;
    }

    var parser = new querystring.Parser,
        params = {},
        self = this;

    parser.onParam = function (name, value) {
        params[name] = value;
    }

    parser.onEnd = function () {
        self.env["strata.request.query"] = params;
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
    if (this.env["strata.request.body"]) {
        callback(null, this.env["strata.request.body"]);
        return;
    }

    var input = this.env["strata.input"],
        self = this;

    input.resume(); // In case it's paused.

    if (this.mediaType === "application/json") {
        var body = "";

        input.on("data", function (buffer) {
            body += buffer.toString("utf8");
        });

        input.on("end", function () {
            try {
                var obj = JSON.parse(body);
                self.env["strata.request.body"] = obj;
                callback(null, obj);
            } catch (e) {
                callback(e, {});
            }
        });
    } else if (this.parseableData) {
        var contentType = this.contentType || "",
            match = contentType.match(/^multipart\/.*boundary=(?:"([^"]+)"|([^;]+))/im),
            params = {},
            parser;

        if (match) {
            var boundary = match[1] || match[2];

            try {
                parser = new multipart.Parser(boundary, this.uploadDir, this.uploadPrefix);
            } catch (e) {
                callback(new strata.Error("Cannot create multipart parser", e), params);
                return;
            }

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
                    callback(new strata.Error("Error parsing multipart body: " + length + " of " + buffer.length + " bytes parsed"), params);
                }
            });

            input.on("end", function () {
                try {
                    parser.end();
                } catch (e) {
                    callback(new strata.Error("Error parsing multipart body", e), params);
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
            self.env["strata.request.body"] = params;
            callback(null, params);
        }
    } else {
        var body = "";

        input.on("data", function (buffer) {
            body += buffer.toString("utf8");
        });

        input.on("end", function () {
            self.env["strata.request.body"] = body;
            callback(null, body);
        });
    }
}

/**
 * Calls the given +callback+ with an object that is the union of query and
 * body parameters.
 */
Request.prototype.params = function params(callback) {
    if (this.env["strata.request.params"]) {
        callback(null, this.env["strata.request.params"]);
        return;
    }

    var input = this.env["strata.input"],
        params = {},
        self = this;

    // Need to pause the input stream here because body parsing is deferred
    // until the query parsing is done.
    input.pause();

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
                    if (typeof body == "object") {
                        for (var param in body) {
                            params[param] = body[param];
                        }
                    }

                    self.env["strata.request.params"] = params;
                    callback(null, params);
                }
            });
        }
    });
}
