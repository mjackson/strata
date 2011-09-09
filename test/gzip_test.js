var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    Gzip = require("compress").Gzip,
    gzip = require("./../lib/gzip");

vows.describe("gzip").addBatch({
    "A gzip middleware": {
        "with a string body": {
            topic: function () {
                this.body = "Hello world!";

                var self = this;
                var app = gzip(function (env, callback) {
                    callback(200, {"Content-Type": "text/plain"}, self.body);
                });

                mock.request({
                    headers: {
                        "Accept-Encoding": "gzip, *"
                    }
                }, app, this.callback);
            },
            "should gzip encode it": function (err, status, headers, body) {
                assert.equal(headers["Content-Type"], "text/plain");
                assert.equal(headers["Content-Encoding"], "gzip");

                var compressor = new Gzip;
                compressor.init();
                var expect = compressor.deflate(this.body) + compressor.end();

                assert.equal(body, expect);
            }
        },
        "with a Stream body": {
            topic: function () {
                this.body = "Hello world!";

                var self = this;
                var app = gzip(function (env, callback) {
                    callback(200, {"Content-Type": "text/plain"}, new mock.Stream(self.body));
                });

                mock.request({
                    headers: {
                        "Accept-Encoding": "gzip, *"
                    }
                }, app, this.callback);
            },
            "should gzip encode it": function (err, status, headers, body) {
                assert.equal(headers["Content-Type"], "text/plain");
                assert.equal(headers["Content-Encoding"], "gzip");

                var compressor = new Gzip;
                compressor.init();
                var expect = compressor.deflate(this.body) + compressor.end();

                assert.equal(body, expect);
            }
        },
        "when the client does not accept gzip encoding": {
            topic: function () {
                this.body = "Hello world!";

                var self = this;
                var app = gzip(function (env, callback) {
                    callback(200, {"Content-Type": "text/plain"}, self.body);
                });

                mock.request("", app, this.callback);
            },
            "should not encode the body": function (err, status, headers, body) {
                assert.equal(headers["Content-Type"], "text/plain");
                assert.isUndefined(headers["Content-Encoding"]);
                assert.equal(body, this.body);
            }
        }
    }
}).export(module);
