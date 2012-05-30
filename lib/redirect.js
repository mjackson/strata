var Request = require("./request");

module.exports = redirect;

/**
 * Sends an HTTP redirect using the given `callback` to the given `location`.
 * The default `status` is 302.
 */
function redirect(env, callback, location, status) {
    status = status || 302;

    var content = '<p>You are being redirected to <a href="' + location + '">' + location + "</a>.</p>";

    callback(status, {
        "Content-Type": "text/html",
        "Content-Length": String(Buffer.byteLength(content)),
        "Location": location
    }, content);
}

/**
 * Records the current location in the session and sends an HTTP redirect to
 * the given `location` using the given `status`. The client may be directed
 * back to the current location using +redirect.back+.
 *
 * Note: In order to work properly the app must be using HTTP sessions.
 */
redirect.forward = function forward(env, callback, location, status) {
    if (!env.session) {
        env.session = {};
    }

    env.session["strata.referrer"] = new Request(env).fullPath;

    redirect(env, callback, location, status);
}

/**
 * Sends an HTTP redirect to the previous location. If +redirect.forward+ was
 * used previously, this will redirect to the location that the client was at
 * when that redirect was made. Otherwise, the location will be the value of
 * the HTTP Referer header or "/".
 */
redirect.back = function back(env, callback, status) {
    var session = env.session,
        location;

    if (session && session["strata.referrer"]) {
        location = session["strata.referrer"];
        delete session["strata.referrer"];
    } else {
        location = env.httpReferer || "/";
    }

    redirect(env, callback, location, status);
}
