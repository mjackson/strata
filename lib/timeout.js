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
        env.timeout = setTimeout(function () {
            env.timeout = null;
            timeoutHandler(env, callback);
        }, expiry);

        app(env, function (status, headers, body) {
            if (env.timeout) {
                clearTimeout(env.timeout);
                env.timeout = null;
                callback(status, headers, body);
            }
        });
    }
};
