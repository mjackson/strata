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
 * the `env` provided in the constructor.
 */
function Request(env) {
    if (!(this instanceof Request)) {
        return new Request(env);
    }

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

/**
 * The HTTP method used in the request.
 */
Request.prototype.__defineGetter__("method", function method() {
    return this.env.requestMethod;
});

/**
 * The time the request was received by the server.
 */
Request.prototype.__defineGetter__("time", function time() {
    return this.env.requestTime;
});

/**
 * The IP address of the client.
 */
Request.prototype.__defineGetter__("remoteAddr", function remoteAddr() {
    if (this.env.httpXForwardedFor) {
        return this.env.httpXForwardedFor;
    }

    return this.env.remoteAddr;
});

/**
 * The port number the client machine is using.
 */
Request.prototype.__defineGetter__("remotePort", function remotePort() {
    return this.env.remotePort;
});

/**
 * The name of the virtual location of the current request within the context of
 * the rest of the application.
 */
Object.defineProperty(Request.prototype, "scriptName", {
    enumerable: true,
    set: function (value) {
        this.env.scriptName = value;
    },
    get: function () {
        return this.env.scriptName;
    }
});

/**
 * The remainder of the request URL's path.
 */
Object.defineProperty(Request.prototype, "pathInfo", {
    enumerable: true,
    set: function (value) {
        this.env.pathInfo = value;
    },
    get: function () {
        return this.env.pathInfo;
    }
});

/**
 * The query string that was used in the URL.
 */
Object.defineProperty(Request.prototype, "queryString", {
    enumerable: true,
    set: function (value) {
        this.env.queryString = value;
    },
    get: function () {
        return this.env.queryString;
    }
});

/**
 * The type of content in the request body.
 */
Request.prototype.__defineGetter__("contentType", function contentType() {
    return this.env.contentType;
});

/**
 * The byte length of the request body.
 */
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
 * Returns `true` if this request was made over SSL, `false` otherwise.
 */
Request.prototype.__defineGetter__("ssl", function ssl() {
    return this.protocol === "https:";
});

/**
 * Returns `true` if this request was made via XMLHttpRequest as indicated by
 * the X-Requested-With header, `false` otherwise.
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
    } else if (this.env.serverPort) {
        return this.env.serverName + ":" + this.env.serverPort;
    }

    return this.env.serverName;
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
 * Returns `true` if this request indicates the client accepts the given
 * `mediaType`.
 */
Request.prototype.accepts = function accepts(mediaType) {
    if (!this.env.strataAccept) {
        this.env.strataAccept = new Accept(this.env.httpAccept);
    }

    return this.env.strataAccept.accept(mediaType);
}

/**
 * Returns `true` if this request indicates the client accepts the given
 * `charset`.
 */
Request.prototype.acceptsCharset = function acceptsCharset(charset) {
    if (!this.env.strataAcceptCharset) {
        this.env.strataAcceptCharset = new AcceptCharset(this.env.httpAcceptCharset);
    }

    return this.env.strataAcceptCharset.accept(charset);
}

/**
 * Returns `true` if this request indicates the client accepts the given
 * `encoding`.
 */
Request.prototype.acceptsEncoding = function acceptsEncoding(encoding) {
    if (!this.env.strataAcceptEncoding) {
        this.env.strataAcceptEncoding = new AcceptEncoding(this.env.httpAcceptEncoding);
    }

    return this.env.strataAcceptEncoding.accept(encoding);
}

/**
 * Returns `true` if this request indicates the client accepts the given
 * `language`.
 */
Request.prototype.acceptsLanguage = function acceptsLanguage(language) {
    if (!this.env.strataAcceptLanguage) {
        this.env.strataAcceptLanguage = new AcceptLanguage(this.env.httpAcceptLanguage);
    }

    return this.env.strataAcceptLanguage.accept(language);
}

/**
 * Returns the prefix that is used for the names of file uploads.
 */
Request.prototype.__defineGetter__("uploadPrefix", function uploadPrefix() {
    return this.env.strataUploadPrefix || "StrataUpload-";
});

/**
 * Sets the prefix that is used for the names of file uploads.
 */
Request.prototype.__defineSetter__("uploadPrefix", function setUploadPrefix(value) {
    this.env.strataUploadPrefix = value;
});

/**
 * Returns the directory where file uploads are stored.
 */
Request.prototype.__defineGetter__("uploadDir", function uploadDir() {
    return this.env.strataUploadDir || "/tmp";
});

/**
 * Sets the directory where file uploads are stored.
 */
Request.prototype.__defineSetter__("uploadDir", function setUploadDir(value) {
    this.env.strataUploadDir = value;
});

/**
 * Is true if this request was most likely made using an HTML form.
 */
Request.prototype.__defineGetter__("formData", function formData() {
    var type = this.mediaType;

    if (Request.FORM_DATA_MEDIA_TYPES.indexOf(type) !== -1) {
        return true;
    }

    var method = this.env.strataOriginalMethod || this.method;

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
 * Calls the given `callback` with an object of cookies received in the HTTP
 * Cookie header.
 */
Request.prototype.cookies = function cookies(callback) {
    if (!this.env.httpCookie) {
        callback(null, {});
        return;
    }

    if (this.env.strataCookieString !== this.env.httpCookie) {
        this.env.strataCookieString = this.env.httpCookie;
        delete this.env.strataCookies;
    }

    if (this.env.strataCookies) {
        callback(null, this.env.strataCookies);
        return;
    }

    var parser = new querystring.Parser(/[;,] */g),
        cookies = {},
        self = this;

    parser.onParam = function (name, value) {
        cookies[name] = value;
    };

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

        self.env.strataCookies = cookies;
        callback(null, cookies);
    };

    parser.write(new Buffer(this.env.httpCookie));
    parser.end();
}

/**
 * Calls the given `callback` with an object of parameters received in the
 * query string.
 */
Request.prototype.query = function query(callback) {
    if (!this.env.queryString) {
        callback(null, {});
        return;
    }

    if (this.env.strataQueryString !== this.env.queryString) {
        this.env.strataQueryString = this.env.queryString;
        delete this.env.strataQuery;
    }

    if (this.env.strataQuery) {
        callback(null, this.env.strataQuery);
        return;
    }

    var parser = new querystring.Parser,
        query = {},
        self = this;

    parser.onParam = function (name, value) {
        query[name] = value;
    };

    parser.onEnd = function () {
        self.env.strataQuery = query;
        callback(null, query);
    };

    parser.write(new Buffer(this.env.queryString));
    parser.end();
}

/**
 * Calls the given `callback` with the contents of the request body. If the
 * body is parseable, this will be an object of data. Otherwise, it will be the
 * contents of the body as a string.
 */
Request.prototype.body = function body(callback) {
    if ("strataBody" in this.env) {
        callback(null, this.env.strataBody);
        return;
    }

    var input = this.env.input,
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
                self.env.strataBody = obj;
                callback(null, obj);
            } catch (e) {
                var err = new strata.InvalidRequestBodyError("Invalid JSON", e);
                callback(err, {});
            }
        });
    } else if (this.parseableData) {
        var contentType = this.contentType || "",
            match = contentType.match(/^multipart\/.*boundary=(?:"([^"]+)"|([^;]+))/im),
            body = {},
            parser;

        if (match) {
            var boundary = match[1] || match[2];

            try {
                parser = new multipart.Parser(boundary, this.uploadDir, this.uploadPrefix);
            } catch (e) {
                var message = "Cannot create multipart parser";
                callback(new strata.Error(message, e), body);
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
            };

            input.on("data", function (buffer) {
                var length = parser.write(buffer);
                if (length !== buffer.length) {
                    input.pause();
                    var message = "Error parsing multipart body: " + length + " of " + buffer.length + " bytes parsed";
                    callback(new strata.InvalidRequestBodyError(message), body);
                }
            });

            input.on("end", function () {
                try {
                    parser.end();
                } catch (e) {
                    var message = "Error parsing multipart body";
                    callback(new strata.InvalidRequestBodyError(message, e), body);
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
            body[name] = value;
        };

        parser.onEnd = function () {
            self.env.strataBody = body;
            callback(null, body);
        };
    } else {
        var body = "";

        if (input.ended) {
            self.env.strataBody = body;
            callback(null, body);
        } else {
            input.on("data", function (buffer) {
                body += buffer.toString("utf8");
            });

            input.on("end", function () {
                self.env.strataBody = body;
                callback(null, body);
            });
        }
    }
}

/**
 * Calls the given `callback` with an object that is the union of query and
 * body parameters.
 */
Request.prototype.params = function params(callback) {
    if (this.env.strataParams) {
        callback(null, this.env.strataParams);
        return;
    }

    var input = this.env.input,
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
                    if (typeof body === "object") {
                        for (var param in body) {
                            params[param] = body[param];
                        }
                    }

                    self.env.strataParams = params;
                    callback(null, params);
                }
            });
        }
    });
}

/**
 * An array of all HTTP request header names.
 */
Request.headers = [
    "Accept",
    "Accept-Charset",
    "Accept-Encoding",
    "Accept-Language",
    "Authorization",
    "Cache-Control",
    "Connection",
    "Cookie",
    "Content-Length",
    "Content-MD5",
    "Content-Type",
    "Date",
    "Expect",
    "From",
    "Host",
    "If-Match",
    "If-Modified-Since",
    "If-None-Match",
    "If-Range",
    "If-Unmodified-Since",
    "Max-Forwards",
    "Pragma",
    "Proxy-Authorization",
    "Range",
    "Referer",
    "TE",
    "Upgrade",
    "User-Agent",
    "Via",
    "Warning"
];

/**
 * Define convenient getters for all response headers using the camel-cased
 * version of the HTTP header name, e.g.:
 *
 * Accept => accept
 * Content-Type => contentType
 */
Request.headers.forEach(function (headerName) {
    var propertyName = utils.propertyName(headerName);

    if (propertyName in Request.prototype) {
        return;
    }

    var httpPropertyName = utils.httpPropertyName(headerName);

    Object.defineProperty(Request.prototype, propertyName, {
        enumerable: true,
        get: function () {
            return this.env[httpPropertyName];
        }
    });
});

// Alias for `referer`.
Request.prototype.__defineGetter__("referrer", function referrer() {
    return this.referer;
});
