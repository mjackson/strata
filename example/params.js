var link = require("./../lib/link");

/**
 * This app simply packages up the request parameters into a JSON string and
 * sends them back in the response body.
 */
module.exports = function (env, callback) {
    var req = new link.Request(env);

    req.params(function (err, params) {
        if (err && link.handleError(err, env, callback)) {
            return;
        }

        var content = JSON.stringify(params);

        callback(200, {
            "Content-Type": "application/json",
            "Content-Length": content.length.toString(10)
        }, content);
    });
}
