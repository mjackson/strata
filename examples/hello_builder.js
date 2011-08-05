var link = require("./../lib/link"),
    app = new link.Builder;

app.use(link.commonLogger);
app.use(link.contentType, "text/plain");
app.use(link.contentLength);

app.run(function (env, callback) {
    callback(200, {}, "Hello world!");
});

module.exports = app;
