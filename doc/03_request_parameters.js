/*
# Request Parameters

One of the most common tasks in building a web app is retrieving request
parameters that were sent by the client in either the URL query string or the
request body. Strata provides access to both of these and much more via the
`Request` object.

You instantiate a `Request` object with one argument: the environment.

    var req = new Request(env);

A `Request` uses the environment to read information about the incoming
request and even cache the results of certain operations (e.g. parsing the
request body) to speed up execution later.

You can use `req.params` to access the union of all parameters that were sent
(i.e. both query and body parameters) easily. The function takes one
argument: a callback that is called with any error and an object containing
the request parameters.

In the example app below the request parameters are simply encoded as JSON and
returned to the client in an `application/json` response.
*/

var strata = require("strata"),
    Request = strata.Request;

module.exports = function (env, callback) {
    var req = new Request(env);

    req.params(function (err, params) {
        var content = JSON.stringify(params);

        callback(200, {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(content).toString()
        }, content);
    });
}

/*
As in the previous chapter, you can save the above code to a file named `app.js`
and run it with:

    $ strata app.js

Then view the app at [http://localhost:1982/](http://localhost:1982/). To test
out Strata's request parameter parsing capabilities, trying sending various
parameters to the app in the query string and request body. Strata natively
supports `application/json`, `application/x-www-url-formencoded`, and
`multipart/form-data` parsing, as well as several other multipart subtypes.
*/
