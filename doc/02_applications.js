/*
# Applications

Before you get started with Strata, it's important to have a basic understanding
of how Strata works. The Strata [SPEC](https://raw.github.com/mjijackson/strata/master/SPEC)
defines two interfaces: 1) an interface for node's built-in HTTP server to
communicate the request to the application and 2) an interface for the
application to communicate the response back to the server.

A Strata application (app) is a JavaScript function. The server communicates
with the app by calling it with two arguments: the **environment** and a
**callback**. The environment is an object that has CGI-like properties
(`requestMethod`, `serverName`, `scriptName`, `pathInfo`, etc.), some
Strata-specific properties, and may also include application-specific extension
properties. The callback is a function the application uses to send the
response.

The application communicates with the server by calling the callback with three
arguments: the response **status** code, an object containing HTTP **headers**,
and the response **body**. The body may be a string or a Stream. The server then
returns the appropriate response to the client. If the response body is a
Stream, it is streamed to the client as data becomes available.

It is important to remember that the environment object is always unique to the
current request and is shared among all callbacks that are used in constructing
the response. This provides a convenient concurrency primitive in an otherwise
completely asynchronous environment.

Both the environment and the callback are described in much greater detail in
the Strata [SPEC](https://github.com/mjijackson/strata/blob/master/SPEC).

## Hello World

The following example demonstrates the simplest app possible. It simply sends a
string of text in a response with an HTTP 200 status code.
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

## Using the strata Executable

Strata comes bundled with an executable that may be used to easily run apps from
the command line. It's basically a wrapper for `strata.run` that accepts the
various options that function expects as command line options (try
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

For example, if you wanted to run an app in a file `web.js` on port 3000, you
would invoke `strata` like this:

    $ strata -p 3000 web.js
*/
