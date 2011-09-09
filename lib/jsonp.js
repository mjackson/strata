var util = require("util"),
    EventEmitter = require("events").EventEmitter;

/**
 * A middleware that wraps the response body in a JavaScript callback function
 * if it is application/json.
 */
module.exports = function (app, callbackName) {
    callbackName = callbackName || "callback";

    var header = callbackName + "(",
        footer = ")",
        wrapperLength = Buffer.byteLength(header + footer);

    return function jsonp(env, callback) {
        app(env, function (status, headers, body) {
            if (headers["Content-Type"] === "application/json") {
                if (typeof body == "string") {
                    body = header + body + footer;
                } else {
                    body = new Body(header, footer, body);
                }

                // It's JavaScript now!
                headers["Content-Type"] = "application/javascript";

                // Add on the wrapper length to Content-Length if it is set.
                if ("Content-Length" in headers) {
                    var length = parseInt(headers["Content-Length"], 10) || 0;
                    length += wrapperLength;

                    headers["Content-Length"] = length.toString();
                }
            }

            callback(status, headers, body);
        });
    }
}

/**
 * A small wrapper class for streams that wraps the data in the given +header+
 * and +footer+ on the way through.
 */
function Body(header, footer, body) {
    var headerSent = false,
        self = this;

    body.on("data", function (chunk) {
        if (!headerSent) {
            self.emit("data", header);
            headerSent = true;
        }

        self.emit("data", chunk);
    });

    body.on("end", function () {
        self.emit("data", footer);
        self.emit("end");
    });
}

util.inherits(Body, EventEmitter);
