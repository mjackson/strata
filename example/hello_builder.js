var link = require("./../lib/link");

/**
 * This app is constructed using a link.Builder. It uses several middlewares
 * in the request pipeline to automatically set some headers and log the
 * request.
 */
var app = new link.Builder;

app.use(link.commonLogger);
app.use(link.contentType, "text/plain");
app.use(link.contentLength);

app.run(function (env, callback) {
    callback(200, {}, "Hello world!");
});

module.exports = app;
