// If you read through the source in 02_params.js, you may have noticed that
// there was an error argument provided in the callback to the `req.params` call
// that was simply ignored. This style of passing errors as the first argument
// to callback functions is very standard practice in node programs.
//
// The problem is that when you're in an asynchronous environment you can't
// simply throw the error because the callback is called out of the original
// calling context. Thus, any try/catch mechanism that was used when the caller
// was called is not able to catch the error when thrown. Since an uncaught
// error will crash the server, we need a mechanism to handle them gracefully.
//
// The solution in Strata is the global error handler, `strata.handleError`.
// This function takes three arguments: the error, and the environment and
// callback arguments that were passed to the app. In Strata, the environment
// and callback represent the context of the request. So even though the calling
// context is no longer accessible we can still return an intelligent response
// to the client without bringing the whole server down.
//
// The `strata.handleError` function handles the error by issuing a 500 Internal
// Server Error to the client and logging the error to `strata.error`. This
// function should be overwritten by users who wish to provide custom error
// handling logic at the global level.
//
// The return value of `strata.handleError` must be a boolean. True means that
// the callback was used to issue a response to the client so the server may
// stop processing the request. False means that the error was not fatal and the
// request may continue processing. By default all errors are fatal.
//
// The following application is a clone of 02_params.js that demonstrates how
// to handle errors properly.

var strata = require("./../lib");

module.exports = function (env, callback) {
    var req = new strata.Request(env);

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
