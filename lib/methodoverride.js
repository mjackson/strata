var strata = require("./index"),
    utils = require("./utils"),
    Request = require("./request");

/**
 * This middleware substitutes the requestMethod environment variable with a
 * value that was provided in a request parameter or HTTP header. This can be
 * used to fake a PUT or DELETE request from an HTTP client that only actually
 * supports GET or POST, for example. The default paramName is "_method" and the
 * default header name is "X-Http-Method-Override".
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

                if (method) {
                    env["strata.originalMethod"] = env.requestMethod;
                    env.requestMethod = method.toUpperCase();
                }

                app(env, function (status, headers, body) {
                    if (env["strata.originalMethod"]) {
                        env.requestMethod = env["strata.originalMethod"];
                        delete env["strata.originalMethod"];
                    }

                    callback(status, headers, body);
                });
            });
        } else {
            app(env, callback);
        }
    }
}
