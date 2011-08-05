var link = require("./../lib/link");

var app = new link.Builder;

app.use(link.commonLogger);
app.use(link.contentType, "text/plain");
app.use(link.contentLength);

app.map("/examples", function (app) {
    app.use(link.static, __dirname);
    app.run(function (env, callback) {
        callback(404, {}, "Not found: " + env.pathInfo);
    });
});

app.run(function (env, callback) {
    callback(200, {}, "Try GET /examples/builder.js");
});

module.exports = app;
