var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    contentLength = require("./../lib/contentlength"),
    BufferedStream = require("bufferedstream");

vows.describe("contentlength").addBatch({
    "A contentLength middleware": {
        "with a string body": {
            topic: function () {
                this.body = "Hello world!";

                var self = this;
                var app = contentLength(function (env, callback) {
                    callback(200, {"Content-Type": "text/plain"}, self.body);
                });

                mock.request("", app, this.callback);
            },
            "should add a Content-Length header": function (err, status, headers, body) {
                var length = this.body.length.toString();
                assert.strictEqual(headers["Content-Length"], length);
            }
        },
        "with a Stream body": {
            topic: function () {
                this.body = new BufferedStream("Hello world!");

                var self = this;
                var app = contentLength(function (env, callback) {
                    callback(200, {"Content-Type": "text/plain"}, self.body);
                });

                mock.request({
                    error: mock.stream(this),
                }, app, this.callback);
            },
            "should write to error": function (err) {
                assert.match(this.data, /body with no length/);
            }
        }
    }
}).export(module);
