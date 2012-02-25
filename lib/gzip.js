var util = require("util"),
    Request = require("./request"),
    utils = require("./utils");

var gzipMiddleware;

try {
    var zlib = require("zlib");

    /**
     * A middleware that gzip encodes the body of the response on the fly if the
     * client accepts gzip encoding. The `options` may be any of node's zlib
     * options (see http://nodejs.org/api/zlib.html) or any of the following:
     *
     *   - types    A regular expression that is used to match the Content-Type
     *              header to determine if the content is able to be gzip'd or
     *              not. Defaults to `/text|javascript|json/i`.
     */
    gzipMiddleware = function (app, options) {
        options = options || {};

        var typeMatcher;
        if (utils.isRegExp(options.types)) {
            typeMatcher = options.types;
            delete options.types;
        } else {
            typeMatcher = /text|javascript|json/i;
        }

        return function gzip(env, callback) {
            app(env, function (status, headers, body) {
                var type = headers["Content-Type"];

                if (type && typeMatcher.exec(type)) {
                    var req = new Request(env);

                    // Make sure the client accepts gzip encoding first.
                    if (req.acceptsEncoding("gzip")) {
                        var gzip = zlib.createGzip(options);

                        if (typeof body === "string") {
                            gzip.end(body);
                        } else {
                            body.pipe(gzip);
                        }

                        if ("Content-Length" in headers) {
                            delete headers["Content-Length"];
                        }

                        headers["Vary"] = "Accept-Encoding";
                        headers["Content-Encoding"] = "gzip";
                        body = gzip;
                    }
                }

                callback(status, headers, body);
            });
        }
    };
} catch (e) {
    // Strata's gzip module requires node >= 0.6. If it's not available output
    // a warning message to the console and carry on.
    console.log("WARNING: strata.gzip requires node >= 0.6");

    gzipMiddleware = function (app, options) {
        return function gzip(env, callback) {
            app(env, callback);
        }
    };
}

module.exports = gzipMiddleware;
