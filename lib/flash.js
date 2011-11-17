var Request = require("./request");

module.exports = flash;

/**
 * A middleware that sets the `flash` environment variable with one in the
 * session, if available.
 */
function flash(app) {
    return function (env, callback) {
        if (env.session && env.session["strata.flash"]) {
            env.flash = env.session["strata.flash"];
            delete env.session["strata.flash"];
        }

        app(env, callback);
    }
}

/**
 * Stores the given `message` in the session for retrieval on the next request.
 */
flash.set = function set(env, message) {
    if (!env.session) {
        env.session = {};
    }

    env.session["strata.flash"] = String(message);
}

/**
 * Stores the given `message` directly in the environment so that it may be used
 * on this request.
 */
flash.now = function now(env, message) {
    env.flash = String(message);
}
