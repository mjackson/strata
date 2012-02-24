/*
# Middleware

One of the most important concepts to understand when building apps with Strata
is middleware. This concept should be familiar to anyone who has previous
experience developing applications with [WSGI](http://www.wsgi.org/) or [Rack](http://rack.rubyforge.org/).
This chapter explains what middleware is and what it typically looks like in
Strata.

## What is Middleware?

A middleware is essentially an app that calls another app. Now hold on, I know
that sounds a bit complex. Just remember that an app is merely a function. So,
another way of saying it is that a middleware is a function that calls another
function.

When a request comes in, the middleware app is called first. A middleware
typically exists to do one (or both) of the following:

  - modify the environment before calling the "downstream" app
  - modify the status, headers, or body received from calling the "downstream"
    app before passing them back "upstream"

Let's take a detailed look at some very simple middleware to get an idea of
what this might look like in code. The simplest middleware that ships with
Strata is `strata.contentType`. The source is copied below.

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
    };

As you can see, this middleware is simply a function that takes an app and an
optional default content type as arguments, and returns *another* app. The thing
to note about the app that is *returned* is that it has a reference to the app
that it was originally *given* when it was created.

Since the return value of this middleware (and all middleware) is an actual app
(i.e. it complies with the application interface defined in the SPEC) we can
call it just like we would call any other app. Now, take a closer look at the
body of the app that is *returned* (i.e. the function named `contentType`). When
it is called, it simply turns around and calls its *downstream* app!

The `env` argument in this case is passed right through to the downstream app
untouched. But notice, instead of simply passing along the `callback` argument,
the middleware inserts its *own* callback into the callback chain. When the
response comes back from the downstream app, the only thing the middleware does
is check to see if the `Content-Type` header is set. If not, it sets its value
to the value it was configured with. Then it passes the response back
*upstream*. This is a simple example of the kind of thing that middleware is
very good at.

## Upstream and Downstream

Since middleware can be inserted at any point in the callback chain, it is
helpful to use a vocabulary that lets us quickly understand in what order they
are arranged when describing the stack. As you saw above, the words *upstream*
and *downstream* are commonly used for this purpose.

If you ever get confused about their meaning, just think about them in the way
you would a stream of water. The environment is coming in fresh from the spring
upstream. As it travels downstream, various pieces of middleware meddle with it
and may change various properties, similar to the way a stream of water may pick
up leaves and other pollutants as it cascades down rocks and through the trees.

## Modifying the Environment

The `strata.contentType` middleware shown above modifies the response on
its way upstream. Specifically, it sets a header in the response if it's not
already set. However, middleware can also be used to set various properties in
the environment for the sake of *downstream* apps.

The example app below demonstrates how to build a simple middleware that stores
the value of a request parameter named "user" in a custom environment variable
so that it may be used by the downstream app. The app is constructed using a
`strata.Builder`, which provides an easy interface for constructing applications
fronted by middleware.
*/

var strata = require("strata");

// This function is the middleware. It keeps a reference to the downstream app.
function setUser(app) {
    return function (env, callback) {
        var req = strata.Request(env);

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

strata.use(strata.contentType); // Sets the Content-Type header
strata.use(strata.contentLength); // Sets the Content-Length header
strata.use(setUser); // Sets the myappUser environment variable

strata.run(function (env, callback) {
    // In the downstream app we have access to any custom variables that were
    // set by middleware upstream.
    callback(200, {}, "Welcome, " + env.myappUser + "!");
});

/*
As in previous chapters, you can save the above code to a file named `app.js`
and run it with the `node` executable:

    $ node app.js

Then view the app at [http://localhost:1982/](http://localhost:1982/).

Tip: When running this app, try [http://localhost:1982/?user=Michael](http://localhost:1982/?user=Michael)
or something similar.

## More Examples

Strata ships with many middleware modules that allow you to do various things
including log requests, serve static files efficiently, and gzip encode
responses. You can browse through the [lib](https://github.com/mjijackson/strata/tree/master/lib)
directory to find more examples.
*/
