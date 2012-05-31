/*
# Errors

JavaScript programs do not typically have very good error reporting or handling.
Two of the main problems that users face when trying to report and handle errors
properly are:

  - JavaScript provides the user with little more than a base `Error` object for
    reporting errors
  - The prominent use of callbacks in asynchronous programming renders the
    `try`/`catch` mechanism useless for handling errors most of the time because
    errors are typically thrown from inside the callback

Strata attempts to address both of these issues so that users can more easily
build robust servers with excellent error reporting and handling capabilities.

## Error Reporting

Strata uses a simple abstraction for errors that makes it simple to build
meaningful hierarchies of errors, complete with stack traces. You can inherit
from Strata's base error prototype, `strata.Error` to get this extra
functionality.

    var util = require("util"),
        strata = require("strata");

    function LoginFailedError(message, cause) {
        message = message || "Login Failed";
        strata.Error.call(this, message, cause);
    }

    util.inherits(LoginFailedError, strata.Error);

The `message` argument to the `strata.Error` constructor serves as that error's
message. The `cause` argument is another Error object that was the cause of this
error at some lower level. When an Error is created with another error as its
cause, the cause is available in the error's `cause` property and stack traces
of both are available in the error's `fullStack` property. This allows you to
easily trace the origins of an error back to the lowest level error responsible.

For example, the `LoginFailedError` demonstrated above could be caused by any
number of other errors. An invalid username and/or password or a database
connectivity issue are just a few.

## Error Handling

If you read through the example code in the previous chapter, you may have
noticed that there was an `err` argument provided in the callback to
`req.params` that was simply ignored. This style of passing errors as the
first argument to a callback is standard practice in node programs.

Typically, error handling in an asynchronous environment is a pain point for
programmers. The problem is that when you're in a callback you can't simply
[throw](https://developer.mozilla.org/en/JavaScript/Reference/Statements/throw)
the error because the callback is called out of the original calling context.
Thus, any `try`/`catch` mechanism that was used when the caller was called is
not able to catch the error when thrown. Since an uncaught error will crash the
program, we need a mechanism to handle them gracefully.

The solution in Strata is the global error handler, `strata.handleError`.
This function takes three arguments: the error, and the environment and
callback arguments that were passed to the app. In Strata, the environment
and callback represent the context of the request, so even though the calling
context is no longer accessible we can still return an intelligent response
to the client without bringing the whole server down.

The return value of `strata.handleError` **must** always be a boolean. A `true`
value means that the callback was used to issue a response to the client so
the server may stop processing the request, while `false` means that the error
was not fatal and the request may continue processing. By default all errors are
considered fatal, so `true` is returned.

To properly handle the error from the previous chapter, we could modify the app
to look like this:
*/

var strata = require("strata");

strata.run(function (env, callback) {
    var req = strata.Request(env);

    req.params(function (err, params) {
        // If there was an error and strata.handleError issued a response
        // based on it, return and stop processing the request.
        if (err && strata.handleError(err, env, callback)) {
            return;
        }

        var content = JSON.stringify(params);

        var res = strata.Response(content);
        res.contentType = "application/json";
        res.contentLength = Buffer.byteLength(content);

        res.send(callback);
    });
});

/*
The `strata.handleError` function handles the error by issuing a 500 Internal
Server Error to the client and writing the error to `env.error` (the error
stream, see the [SPEC](https://github.com/mjijackson/strata/blob/master/SPEC)).

## Custom Error Handling

The `strata.handleError` function should be overridden by users who wish to
run custom error handling logic at the global level.

Continuing with the example app above, you may wish to serve a 400 response when
the error is caused by a client who sent invalid request parameters. After all,
it's not the server's fault the client sent bad data. So returning a 500 in this
case isn't very helpful.

For example, a client may send a `Content-Type` header with a value of
`application/json` but with invalid [JSON](http://www.json.org/) in the request
body. In this instance, the error that is passed to the `req.params` callback is
an instance of `strata.InvalidRequestBodyError`.

If you wish to handle all instances of this error with a 400 response, you may
override `strata.handleError`.
*/

// Get a reference to the original error handler.
var _handleError = strata.handleError;

strata.handleError = function (err, env, callback) {
    if (err instanceof strata.InvalidRequestBodyError) {
        callback(400, {}, "Invalid Request Body");
        return true;
    }

    return _handleError(err, env, callback);
};

/*
As in previous chapters, you can save the code in the examples above to a file
named `app.js` and run it with the `node` executable:

    $ node app.js

Then view the app at [http://localhost:1982/](http://localhost:1982/). To get
this app to return a 400 response, send it some bad data. For example, send an
`application/json` request with invalid JSON in the request body, like this:

    $ curl -v -H "Content-Type: application/json" --data "a" http://localhost:1982/

When the JSON parser is unable to parse the request body, it will return an
error to the call to `req.params`, which in turn will issue a 400 response using
the overridden version of `strata.handleError`.
*/
