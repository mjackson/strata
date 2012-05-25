var strata = require("./index"),
    utils = require("./utils"),
    Request = require("./request");

/**
 * A middleware that substitutes `env.requestMethod` with a value from a request
 * parameter or HTTP header. This can be used to fake a PUT or DELETE request
 * from an HTTP client that only actually supports GET or POST, for example. The
 * default parameter name is "_method" and the default header name is
 * "X-Http-Method-Override".
 */
module.exports = function (app, paramName, headerName) {
    paramName = paramName || "_method";
    headerName = headerName || "X-Http-Method-Override";

    var propName = utils.httpPropertyName(headerName);

    return function methodOverride(env, callback) {
        if (env.requestMethod === "POST") {
            var req = new Request(env);

            req.params(function (err, params) {
                if (err && strata.handleError(err, env, callback)) {
                    return;
                }

                var method = params[paramName] || env[propName];

                // Update the requestMethod.
                if (method) {
                    env.strataOriginalMethod = env.requestMethod;
                    env.requestMethod = method.toUpperCase();
                }

                app(env, function (status, headers, body) {
                    // Revert for the sake of upstream apps.
                    if (env.strataOriginalMethod) {
                        env.requestMethod = env.strataOriginalMethod;
                        delete env.strataOriginalMethod;
                    }

                    callback(status, headers, body);
                });
            });
        } else {
            app(env, callback);
        }
    }
};
