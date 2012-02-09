var utils = require("./utils");

/**
 * A middleware that tries each of the given `apps` in turn, returning the
 * response from the first one that doesn't return a status code the same as
 * `cascadeStatus`, which defaults to 404.
 */
module.exports = function (apps, cascadeStatus, defaultApp) {
    cascadeStatus = cascadeStatus || 404;
    defaultApp = defaultApp || utils.notFound;

    function tryApp(i, env, callback) {
        var app = apps[i];

        if (!app) {
            defaultApp(env, callback);
            return;
        }

        app(env, function (status, headers, body) {
            if (status == cascadeStatus) {
                tryApp(i + 1, env, callback);
            } else {
                callback(status, headers, body);
            }
        });
    }

    return function cascade(env, callback) {
        tryApp(0, env, callback);
    }
};
