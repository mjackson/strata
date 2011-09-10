// A Strata application (app) is simply a function that takes two arguments: the
// environment and a callback. These arguments are both described in detail in
// the SPEC (see the SPEC file in the project root directory).
//
// The callback must be called with three arguments: the HTTP status code, an
// object containing HTTP headers and their values, and the response body. The
// response body may be a string or a readable Stream. In the case of a Stream
// it will be pumped to the client as data becomes available. These arguments
// are also described in greater detail in the SPEC.
//
// The following example demonstrates the classic "hello world" app. Since this
// file exports a valid Strata app, you can run it from the command line with:
//
//     $ strata 01_hello.js

module.exports = function (env, callback) {
    callback(200, {
        "Content-Type": "text/plain",
        "Content-Length": "12"
    }, "Hello world!");
}
