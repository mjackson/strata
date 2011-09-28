/*
# Middleware

One of the most powerful concepts to understand when building apps with
Strata is middleware. This concept should be familiar to anyone who has previous
experience developing applications with [WSGI](http://www.wsgi.org/) or [Rack](http://rack.rubyforge.org/).
This chapter explains what middleware looks like in Strata.

A middleware is essentially an app that has a reference to another app. We call
this other app the "downstream" app, for reasons that should soon be apparent.

When a request comes in, the middleware is called first. A middleware
typically exists to do one (or both) of the following:

  - modify the environment before calling the downstream app
  - modify the status, headers, or body received from calling the downstream
    app before passing them back "upstream"

The simplest middleware that ships with Strata is `strata.contentType`. The
source is below.

    module.exports = function (app, defaultType) {
        defaultType = defaultType || "text/html";

        return function contentType(env, callback) {
            app(env, function (status, headers, body) {
                if (!headers["Content-Type"]) {
                    headers["Content-Type"] = defaultType;
                }

                callback(status, headers, body);
            });
        }
    }

This middleware is a function that takes an app and an optional default
content type as arguments and returns a Strata app. When called, the
middleware simply calls the downstream app. When it receives the status,
headers, and body from downstream it checks to see if the `Content-Type`
[header](http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.17) exists
in the response. If not, it adds its default content type. Then, it passes all
three arguments upstream.

## Modifying the Environment

The `strata.contentType` middleware shown above modifies the response on
its way upstream. Specifically, it sets a header in the response if it's not
already set. However, middleware can also be used to set various properties in
the environment for the sake of *downstream* apps.

The example app below demonstrates how to build a simple middleware that stores
the value of a request parameter named "user" in a custom environment variable
so that it may be used by the downstream app.
*/

var strata = require("strata"),
    Request = strata.Request;

// This function is the middleware. It keeps a reference to the downstream app.
function setUser(app) {
    return function (env, callback) {
        var req = new Request(env);

        // Get the value of the "user" request parameter and put it in the
        // myappUser environment variable. Names of environment variables should
        // be prefixed uniquely (see the SPEC).
        req.params(function (err, params) {
            if (err && strata.handleError(err, env, callback)) {
                return;
            }

            env.myappUser = params.user || "Anonymous User";

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

/*
As in previous chapters, you can save the above code to a file named `app.js`
and run it with:

    $ strata app.js

Then view the app at [http://localhost:1982/](http://localhost:1982/).

Tip: When running this app, try [http://localhost:1982/?user=Michael](http://localhost:1982/?user=Michael)
or something similar.

## Examples

Strata ships with many middleware modules that allow you to do various things
including log requests, serve static files efficiently, and gzip encode
responses. You can browse through the [lib](https://github.com/mjijackson/strata/tree/master/lib)
directory to find more examples.
*/
