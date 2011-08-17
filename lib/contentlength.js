var utils = require("./utils");

/**
 * A middleware that sets the Content-Length header if it is missing on string
 * bodies. Does not work for Stream bodies.
 */
module.exports = function (app) {
    return function contentLength(env, callback) {
        app(env, function (status, headers, body) {
            if (utils.STATUS_WITH_NO_ENTITY_BODY.indexOf(status) == -1 &&
                !("Content-Length" in headers) &&
                !headers["Transfer-Encoding"]) {
                    if (typeof body.length != "undefined") {
                        headers["Content-Length"] = String(body.length);
                    } else {
                        env["link.error"].write("Cannot set Content-Length for body with no length\n");
                    }
            }

            callback(status, headers, body);
        });
    }
}
