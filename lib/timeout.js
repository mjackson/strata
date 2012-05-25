var utils = require("./utils");

/**
 * A middleware that sets a limit on how long a server may attempt to handle a
 * request before an error is returned to the client.
 */
module.exports = function (app, expiry, timeoutHandler) {
    // Default expiry is 30 seconds.
    expiry = expiry || 30000;

    // Default handler is a 500.
    timeoutHandler = timeoutHandler || utils.serverError;

    return function timeout(env, callback) {
        var timer = setTimeout(function () {
            timer = null;
            timeoutHandler(env, callback);
        }, expiry);

        app(env, function (status, headers, body) {
            if (timer) {
                clearTimeout(timer);
                timer = null;
                callback(status, headers, body);
            }
        });
    }
};
