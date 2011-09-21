var util = require("util"),
    Gzip = require("gzbz2").Gzip,
    Request = require("./request"),
    Stream = require("./mock").Stream;

/**
 * A middleware that gzip encodes the body of the response on the fly if the
 * client accepts gzip encoding. Will only encode bodies when the Content-Type
 * matches the given +typeMatcher+.
 */
module.exports = function (app, typeMatcher) {
    typeMatcher = typeMatcher || /text|javascript|json/i;

    return function gzip(env, callback) {
        app(env, function (status, headers, body) {
            var type = headers["Content-Type"];

            if (type && typeMatcher.exec(type)) {
                var req = new Request(env);

                // Make sure the client accepts gzip encoding first.
                if (req.acceptEncoding("gzip")) {
                    // Wrap the original body in a gzip.Body.
                    body = new Body(body);

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

/**
 * A small wrapper class for streams that gzip's the data on the way through.
 */
function Body(body) {
    var gzip = new Gzip;
    gzip.init();

    this.write = function (chunk) {
        if (typeof chunk == "string") {
            chunk = new Buffer(chunk);
        }

        Stream.prototype.write.call(this, gzip.deflate(chunk));
    }

    this.end = function (chunk) {
        if (chunk) {
            this.write(chunk);
        }

        Stream.prototype.write.call(this, gzip.end());
        Stream.prototype.end.call(this);
    }

    Stream.call(this, body);
}

util.inherits(Body, Stream);
