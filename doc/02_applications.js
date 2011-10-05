/*
# Applications

The most basic unit in Strata is the application. In Strata, an application is
simply a *function* (see the [SPEC](https://github.com/mjijackson/strata/blob/master/SPEC))
that accepts two arguments: the **environment** and a **callback**.

The environment is a plain object with several CGI-like properties that pertain
to the environment the app is operating in. This object is not the same as
`process.env`. Whereas `process.env` contains information about the environment
the node process is running in, a Strata environment object contains information
about an incoming HTTP request. It contains many of the same properties as
[Apache's environment](http://httpd.apache.org/docs/2.2/env.html) or
[PHP's special $_SERVER variable](http://php.net/manual/en/reserved.variables.server.php).

It is important to remember that the environment object is always unique to the
current request and is shared among all callbacks that are used in constructing
the response. This provides a convenient concurrency primitive in an otherwise
completely asynchronous environment.

The callback is a function that is used to send the response when the app is
ready to do so. It must be called with three arguments: the HTTP status code,
an object containing HTTP headers and their values, and the response body.

The body may be a string or a readable Stream. In the case of a string it is
used as the response body. In the case of a Stream it is pumped through to the
client as data becomes available.

Both the environment and the callback are described in much greater detail in
the Strata [SPEC](https://github.com/mjijackson/strata/blob/master/SPEC).

## Hello World

The following example demonstrates the simplest app possible. It does not
make use of the environment because it doesn't need to. It simply sends a
string of text in an HTTP 200 response.
*/

var strata = require("strata");

var app = function (env, callback) {
    callback(200, {
        "Content-Type": "text/plain",
        "Content-Length": "12"
    }, "Hello world!");
}

strata.run(app);

/*
Save the above code to a file named `app.js` and run it with the `node`
executable:

    $ node app.js

Then view the app at [http://localhost:1982/](http://localhost:1982/).

## Running Strata Applications

You run Strata applications using `strata.run`. This function takes an app as
its first argument and any options needed to create the HTTP server and run the
app as a second argument. Valid options include the following:

  - `host`      The host name to accept connections on (defaults to INADDR_ANY)
  - `port`      The port to listen on (defaults to 1982)
  - `socket`    Unix socket file to listen on (trumps host/port)
  - `key`       Private key to use for SSL (HTTPS only)
  - `cert`      Public X509 certificate to use (HTTPS only)

A callback function may be given as the final argument. This will be called when
the application is booted and the server is listening for incoming connections.

For example, to run an app on port 3000 you could do the following:

    strata.run(app, { port: 3000 });

## Using the `strata` Executable

Strata comes bundled with an executable that may be used to easily run Strata
apps from the command line. It's basically a wrapper for `strata.run` that
accepts the various options that function expects as command line options (try
`strata --help` from the command line for more information).

The main argument the executable expects is the path to a JavaScript module file
that exports a Strata app. The contents of this file may look something like
this:

    function app(env, callback) {
        // ...
    }

    module.exports = app;

If no path is given, the executable will look in the current working directory
for a file named `app.js`.
*/
