var utils = require("./utils"),
    Request = require("./request");

/**
 * A middleware that may be used for HTTP clients who do not natively support
 * PUT, DELETE, etc. to coerce the environment's requestMethod to instead use
 * the one specified in a request parameter or HTTP header.
 */
module.exports = function (app, paramName, headerName) {
    paramName = paramName || "_method";
    headerName = headerName || "X-Http-Method-Override";

    var propName = utils.httpPropertyName(headerName);

    return function methodOverride(env, callback) {
        if (env.requestMethod === "POST") {
            var req = new Request(env);

            req.params(function (err, params) {
                var method = params[paramName] || env[propName];

                if (method) {
                    env["link.methodOverride.originalMethod"] = env.requestMethod;
                    env.requestMethod = method.toUpperCase();
                }

                app(env, callback);
            });
        } else {
            app(env, callback);
        }
    }
}
