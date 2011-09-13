// One of the most powerful concepts to understand when building apps with
// Strata is middleware. A middleware is an app that has a reference to another
// app. We call this other app the "downstream" app, for reasons that should
// soon be apparent.
//
// When a request comes in, the middleware is called first. A middleware
// typically exists to do one (or both) of the following:
//
//   - modify the environment before calling the downstream app
//   - modify the status, headers, or body received from calling the downstream
//     app before passing them "upstream"
//
// The simplest example of this is the `strata.contentType` middleware. This
// middleware is a function that takes an app and an optional default content
// type as arguments and returns a Strata app. When called, the middleware
// simply calls the downstream app. When it receives the status, headers, and
// body from downstream it checks to see if the `Content-Type` header exists in
// the response. If not, it adds its default content type. Then, it passes all
// three arguments upstream.
//
// Strata ships with many middleware modules that allow you to do various things
// including log requests, serve static files efficiently, and gzip encode
// response bodies. You can browse through the `lib` directory for more
// examples.
//
// The example below demonstrates how to build a simple middleware that stores
// the value of a request parameter "user" in a custom environment variable so
// that it may be used by the downstream app.
//
// Tip: When running the app, try
// [http://localhost:1982/?user=Michael](http://localhost:1982/?user=Michael)

var strata = require("./../lib");

// This function is the middleware.
function setUser(app) {
    return function (env, callback) {
        var req = new strata.Request(env);

        // Get the value of the "user" request parameter and put it in the
        // myapp.user environment variable.
        req.params(function (err, params) {
            if (err && strata.handleError(err, env, callback)) {
                return;
            }

            env.myappUser = params.user || "User";

            // Call the downstream app.
            app(env, callback);
        });
    }
}

module.exports = setUser(function (env, callback) {
    // In the downstream app we have access to any custom variables that were
    // set by middleware upstream.
    var content = "Welcome, " + env.myappUser + "!";

    callback(200, {
        "Content-Type": "text/plain",
        "Content-Length": Buffer.byteLength(content).toString()
    }, content);
});
