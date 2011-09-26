var util = require("util"),
    Gzip = require("gzbz2").Gzip,
    Request = require("./request"),
    BufferedStream = require("./bufferedstream");

/**
 * A middleware that gzip encodes the body of the response on the fly if the
 * client accepts gzip encoding. Will only encode bodies when the Content-Type
 * matches the given `typeMatcher`.
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
 * A small wrapper class for response bodies that gzip's the data on the way
 * through.
 */
function Body(source, encoding) {
    this._gzip = new Gzip;
    this._gzip.init();

    BufferedStream.call(this, source, encoding);
}

util.inherits(Body, BufferedStream);

Body.prototype.write = function write(chunk) {
    return BufferedStream.prototype.write.call(this, this._gzip.deflate(chunk));
}

Body.prototype.end = function end(chunk, encoding) {
    if (arguments.length > 0) {
        this.write(chunk, encoding);
    }

    BufferedStream.prototype.write.call(this, this._gzip.end());
    BufferedStream.prototype.end.call(this);
}
