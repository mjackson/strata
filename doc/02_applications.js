/*
# Applications

The most basic unit in Strata is the application. According to the Strata
[SPEC](https://github.com/mjijackson/strata/blob/master/SPEC), an application
(app) is simply a function that takes two arguments: the environment and a
callback.

The environment is simply a plain object with several CGI-like properties that
pertain to the environment the app is operating in. This object is not the same
as `process.env`. Whereas `process.env` contains information about the machine
environment the node process is running in, the Strata environment includes
information about the request, HTTP headers, the server, etc. This object is
unique to the current request.

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

module.exports = function (env, callback) {
    callback(200, {
        "Content-Type": "text/plain",
        "Content-Length": "12"
    }, "Hello world!");
}

/*
Save the above code to a file named `app.js` and run it with:

    $ strata app.js

Then view the app at [http://localhost:1982/](http://localhost:1982/).
*/
