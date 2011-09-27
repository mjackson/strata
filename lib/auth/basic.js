var strata = require("./../index");

module.exports = function (app, validate, realm) {
    if (typeof validate != "function") {
        throw new strata.Error("Missing validation function for basic auth");
    }

    return function authBasic(env, callback) {
        if (env.remoteUser) {
            app(env, callback);
            return;
        }

        var authorization = env.httpAuthorization;

        if (!authorization) {
            unauthorized(callback, realm);
            return;
        }

        var parts = authorization.split(" "),
            scheme = parts[0];

        if (scheme.toLowerCase() != "basic") {
            badRequest(callback);
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
                unauthorized(callback, realm);
            }
        });
    }
}

function unauthorized(callback, realm) {
    realm = realm || "Authorization Required";

    var content = "Unauthorized";

    callback(401, {
        "Content-Type": "text/plain",
        "Content-Length": Buffer.byteLength(content).toString(),
        "WWW-Authenticate": 'Basic realm="' + realm + '"'
    }, content);
}

function badRequest(callback) {
    var content = "Bad Request";

    callback(400, {
        "Content-Type": "text/plain",
        "Content-Length": Buffer.byteLength(content).toString()
    }, content);
}
