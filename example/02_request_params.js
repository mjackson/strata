// One of the most common tasks in building a web app is retrieving request
// parameters that were sent by the client in either the URL query string or the
// request body. Strata provides access to both of these and much more via the
// Request object.
//
// The example below demonstrates how to access the union of query and body
// parameters using a Request object. Note that because the request body is read
// from a stream it must be accessed in a callback. In this simple example the
// parameters are merely encoded as JSON and returned to the client in an
// application/json response.

var strata = require("./../lib"),
    Request = strata.Request;

module.exports = function (env, callback) {
    // A Request object is instantiated with one argument: the environment.
    var req = new Request(env);

    req.params(function (err, params) {
        // The params object is a union of query and body parameters. Lets
        // encode them as JSON and send them back to the client.
        var content = JSON.stringify(params);

        callback(200, {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(content).toString()
        }, content);
    });
}
