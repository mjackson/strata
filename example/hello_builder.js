var strata = require("./../lib/index");

/**
 * This app is constructed using a strata.Builder. It uses several middlewares
 * in the request pipeline to automatically set some headers and log the
 * request.
 */
var app = new strata.Builder;

app.use(strata.commonLogger);
app.use(strata.contentType, "text/plain");
app.use(strata.contentLength);

app.run(function (env, callback) {
    callback(200, {}, "Hello world!");
});

module.exports = app;
