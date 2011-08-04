var link = require("./../link"),
    utils = require("./utils"),
    Request = require("./request");

/**
 * A middleware that may be used for HTTP clients who do not natively support
 * PUT, DELETE, etc. to coerce the environment's requestMethod to instead use
 * the one specified in a request parameter or HTTP header.
 */
module.exports = function (app, paramName, headerName) {
    paramName = paramName || "_method";
    headerName = headerName || "X-Http-Method-Override";

    var propName = utils.httpPropertyName(headerName),
        key = "link.methodOverride.originalMethod";

    return function methodOverride(env, callback) {
        if (env.requestMethod === "POST") {
            var req = new Request(env);

            req.params(function (err, params) {
                if (err) {
                    link.handleError(err, env, callback);
                    return;
                }

                var method = params[paramName] || env[propName];

                if (method) {
                    env[key] = env.requestMethod;
                    env.requestMethod = method.toUpperCase();
                }

                app(env, function (status, headers, body) {
                    if (env[key]) {
                        env.requestMethod = env[key];
                        delete env[key];
                    }

                    callback(status, headers, body);
                });
            });
        } else {
            app(env, callback);
        }
    }
}
