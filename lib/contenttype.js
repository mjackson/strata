/**
 * A middleware that sets a default Content-Type header in case one hasn't
 * already been set in a downstream app.
 */
module.exports = function (app, defaultType) {
    defaultType = defaultType || "text/html";

    return function contentType(env, callback) {
        app(env, function (status, headers, body) {
            if (!headers["Content-Type"]) {
                headers["Content-Type"] = defaultType;
            }

            callback(status, headers, body);
        });
    }
};
