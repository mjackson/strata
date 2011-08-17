var link = require("./../lib/link");

/**
 * This app is constructed using a link.Builder.
 */
var app = new link.Builder;

app.use(link.commonLogger);
app.use(link.contentType, "text/plain");
app.use(link.contentLength);

/**
 * This call mounts a static file server at the "/example" location. Any
 * request to this location with a path to a file in this directory will serve
 * that file.
 */
app.map("/example", function (app) {
    app.use(link.static, __dirname);
    app.run(function (env, callback) {
        callback(404, {}, "Not found: " + env.pathInfo);
    });
});

/**
 * This route merely echoes back the request parameters as a JSON string in
 * the request body. Works for all request methods.
 */
app.route("/params", function (env, callback) {
    var req = new link.Request(env);

    req.params(function (err, params) {
        if (err && link.handleError(err, env, callback)) {
            return;
        }

        callback(200, {}, "The request params were: " + JSON.stringify(params));
    });
});

/**
 * This is the default app which only gets called if none of the previous
 * routes match.
 */
app.run(function (env, callback) {
    callback(200, {}, "Try GET /example/builder.js");
});

module.exports = app;