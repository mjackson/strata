var util = require("util"),
    zlib = require("zlib"),
    Request = require("./request");

/**
 * A middleware that gzip encodes the body of the response on the fly if the
 * client accepts gzip encoding. The `options` may be any of node's zlib options
 * (see http://nodejs.org/api/zlib.html) or any of the following:
 *
 *   - types        A regular expression that is used to match the Content-Type
 *                  header to determine if the content is able to be gzip'd or
 *                  not. Defaults to `/text|javascript|json/i`.
 */
module.exports = function (app, options) {
    options = options || {};

    var typeMatcher;
    if ("types" in options) {
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
                if (req.acceptEncoding("gzip")) {
                    var gzip = zlib.createGzip(options);

                    if (typeof body == "string") {
                        gzip.end(body);
                    } else {
                        body.pipe(gzip);
                    }

                    body = gzip;
                    headers["Content-Encoding"] = "gzip";

                    // TODO: Can we calculate the correct length here?
                    if ("Content-Length" in headers) {
                        delete headers["Content-Length"];
                    }
                }
            }

            callback(status, headers, body);
        });
    }
}
