var link = require("./../lib/link");

/**
 * This app is constructed using a link.Builder. It uses several middlewares
 * in the request pipeline to automatically set some headers and log the
 * request. See builder.js for a more complex example of using a Builder.
 */
var app = new link.Builder;

app.use(link.commonLogger);
app.use(link.contentType, "text/plain");
app.use(link.contentLength);

app.run(function (env, callback) {
    callback(200, {}, "Hello world!");
});

module.exports = app;
