var strata = require("./../index"),
    utils = require("./../utils");

/**
 * A middleware that performs basic auth on the incoming request before passing
 * it downstream. The `validate` argument must be a function that accepts three
 * arguments: the username and password used in the request, and a callback to
 * to call when auth is complete. This callback should be called with two
 * arguments: any error that occured and a string that contains the name of the
 * authorized user, if any.
 *
 *     strata.authBasic(app, function (user, pass, callback) {
 *         if (user == "admin" && pass == "secret") {
 *             callback(null, user);
 *         } else {
 *             callback(null, false);
 *         }
 *     });
 *
 * When authorization fails, the client will automatically receive a 401
 * Unauthorized response with the appropriate challenge in the WWW-Authenticate
 * header.
 */
module.exports = function (app, validate, realm) {
    if (typeof validate !== "function") {
        throw new strata.Error("Missing validation function for basic auth");
    }

    return function authBasic(env, callback) {
        if (env.remoteUser) {
            app(env, callback);
            return;
        }

        var authorization = env.httpAuthorization;

        if (!authorization) {
            utils.unauthorized(env, callback, realm);
            return;
        }

        var parts = authorization.split(" "),
            scheme = parts[0];

        if (scheme.toLowerCase() != "basic") {
            utils.badRequest(env, callback);
            return;
        }

        var params = new Buffer(parts[1], "base64").toString().split(":");

        validate(params[0], params[1], function (err, user) {
            if (err && strata.handleError(err, env, callback)) {
                return;
            }

            if (user) {
                env.remoteUser = user;
                app(env, callback);
            } else {
                utils.unauthorized(env, callback, realm);
            }
        });
    }
};
