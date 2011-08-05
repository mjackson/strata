/**
 * The classic "Hello world" app.
 */
module.exports = function (env, callback) {
    callback(200, {
        "Content-Type": "text/plain",
        "Content-Length": "12"
    }, "Hello world!");
}
