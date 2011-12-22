var util = require("util"),
    Request = require("./request");

var zlib;
try {
    zlib = require("zlib");
} catch (e) {
    // The local zlib is just a shim around gzbz2 that mimics the zlib API in
    // node 0.6. It should be removed once strata's node dependency is >= 0.6.
    zlib = require("./zlib");
}

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
                if (req.acceptsEncoding("gzip")) {
                    var gzip = zlib.createGzip(options);

                    if (typeof body == "string") {
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
}
