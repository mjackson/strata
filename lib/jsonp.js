var util = require("util"),
    Stream = require("./mock").Stream;

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
                body = new Body(header, footer, body);

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
    var headerSent = false;

    this.write = function (chunk) {
        if (!headerSent) {
            Stream.prototype.write.call(this, header);
            headerSent = true;
        }

        Stream.prototype.write.call(this, chunk);
    }

    this.end = function (chunk) {
        if (chunk) {
            this.write(chunk);
        }

        Stream.prototype.write.call(this, footer);
        Stream.prototype.end.call(this);
    }

    Stream.call(this, body);
}

util.inherits(Body, Stream);
