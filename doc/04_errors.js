/*
# Error Handling

If you read through the example code in the previous chapter, you may have
noticed that there was an `err` argument provided in the callback to
`req.params` that was simply ignored. This style of passing errors as the
first argument to a callback is standard practice in node programs.

Typically, error handling in an asynchronous environment is a pain point for
programmers. The problem is that when you're in a callback you can't simply
`throw` the error because the callback is called out of the original calling
context. Thus, any `try`/`catch` mechanism that was used when the caller
was called is not able to catch the error when thrown. Since an uncaught
error will crash the program, we need a mechanism to handle them gracefully.

The solution in Strata is the global error handler, `strata.handleError`.
This function takes three arguments: the error, and the environment and
callback arguments that were passed to the app. In Strata, the environment
and callback represent the context of the request. So even though the calling
context is no longer accessible we can still return an intelligent response
to the client without bringing the whole server down.

The `strata.handleError` function handles the error by issuing a 500 Internal
Server Error to the client and writing the error to `env.error` (the error
stream, see the [SPEC](https://github.com/mjijackson/strata/blob/master/SPEC)).
This function should be overridden by users who wish to provide custom error
handling logic at the global level.

For example, your database driver may choose to return an error when you run
a query using a primary key that is not present in the database. In this
case, you could setup a global error handler that handles this specific type
of error by returning a 404 to the client, instead of returning a 500.

The return value of `strata.handleError` **must** always be a boolean. A `true`
value means that the callback was used to issue a response to the client so
the server may stop processing the request, while `false` means that the error
was not fatal and the request may continue processing. By default all errors are
considered fatal, so `true` is returned.

The following app is a clone of the example in the previous chapter, except this
time any error that may be returned in the callback to `req.params` will be
handled gracefully.
*/

var strata = require("strata"),
    Request = strata.Request;

module.exports = function (env, callback) {
    var req = new Request(env);

    req.params(function (err, params) {
        // If there was an error and strata.handleError issued a response based
        // on it, stop processing the request.
        if (err && strata.handleError(err, env, callback)) {
            return;
        }

        var content = JSON.stringify(params);

        callback(200, {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(content).toString()
        }, content);
    });
}

/*
In this example, an error returned by `req.params` represents an error that
Strata's request parser encountered when parsing the request query or body.

As in previous chapters, you can save the above code to a file named `app.js`
and run it with:

    $ strata app.js

Then view the app at [http://localhost:1982/](http://localhost:1982/).
*/
