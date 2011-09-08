var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    contentLength = require("./../lib/contentlength");

vows.describe("contentlength").addBatch({
    "A contentLength middleware": {
        "should automatically add a Content-Length header": function () {
            var body = "Hello world!";
            var app = function (env, callback) {
                callback(200, {}, body);
            }

            app = contentLength(app);

            mock.request("", app, function (status, headers, body) {
                assert.strictEqual(headers["Content-Length"], body.length.toString(10));
            });
        },
        "should write notify strata.error when being used on a stream": function () {
            var errors = "";
            var body = new mock.Stream("Hello world");
            var app = function (env, callback) {
                callback(200, {}, body);
            }

            app = contentLength(app);

            mock.request({
                error: {
                    write: function (message) {
                        errors += message;
                    }
                }
            }, app, function (status, headers, body) {});

            assert.match(errors, /body with no length/);
        }
    }
}).export(module);
