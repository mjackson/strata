var util = require("util"),
    EventEmitter = require("events").EventEmitter,
    Gzip = require("compress").Gzip,
    Request = require("./request");

/**
 * A middleware that gzip encodes the body of the response on the fly if the
 * client accepts gzip encoding. Will only encode bodies when the Content-Type
 * matches the given +typeMatcher+.
 */
module.exports = function (app, typeMatcher) {
    typeMatcher = typeMatcher || /text|javascript|json/i;

    return function (env, callback) {
        app(env, function (status, headers, body) {
            var type = headers["Content-Type"];

            if (type && typeMatcher.exec(type)) {
                var req = new Request(env);

                // Make sure the client accepts gzip encoding first.
                if (req.acceptEncoding("gzip")) {
                    headers["Content-Encoding"] = "gzip";

                    if (typeof body == "string") {
                        var gzip = new Gzip;
                        gzip.init();
                        body = gzip.deflate(body) + gzip.end();
                        headers["Content-Length"] = Buffer.byteLength(body).toString();
                    } else {
                        // Wrap the original body in a gzip.Body.
                        body = new Body(body);
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

    var self = this;

    body.on("data", function (chunk) {
        self.emit("data", gzip.deflate(chunk));
    });

    body.on("end", function () {
        self.emit("data", gzip.end());
        self.emit("end");
    });
}

util.inherits(Body, EventEmitter);
