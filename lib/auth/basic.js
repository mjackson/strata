var strata = require("./../index");

module.exports = function (app, validate, realm) {
    validate = validate || function (user, pass, cb) { cb(null, false); }
    realm = realm || "Authorization Required";

    return function authBasic(env, callback) {
        if (env.remoteUser) {
            app(env, callback);
            return;
        }

        var authorization = env.httpAuthorization;

        if (!authorization) {
            unauthorized(realm, callback);
            return;
        }

        var parts = authorization.split(" "),
            scheme = parts[0];

        if (scheme.toLowerCase() != "basic") {
            callback(400, {}, "Bad Request");
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
                unauthorized(realm, callback);
            }
        });
    }
}

function unauthorized(realm, callback) {
    callback(401, {
        "WWW-Authenticate": 'Basic realm="' + realm + '"'
    }, "Unauthorized");
}
