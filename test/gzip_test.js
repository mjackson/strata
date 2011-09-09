var assert = require("assert"),
    vows = require("vows"),
    EventEmitter = require("events").EventEmitter,
    mock = require("./../lib/mock"),
    Gzip = require("compress").Gzip,
    gzip = require("./../lib/gzip");

vows.describe("gzip").addBatch({
    "A gzip middleware": {
        "with a string body": {
            topic: function () {
                this.body = JSON.stringify({message: "Hello world!"});

                var self = this;
                var app = gzip(function (env, callback) {
                    callback(200, {"Content-Type": "application/json"}, self.body);
                });

                mock.getBody({
                    headers: {
                        "Accept-Encoding": "gzip, *"
                    }
                }, app, this.callback);
            },
            "should gzip encode it": function (body) {
                var compressor = new Gzip;
                compressor.init();
                var expect = compressor.deflate(this.body) + compressor.end();

                assert.equal(body, expect);
            }
        },
        "with a Stream body": {
            topic: function () {
                this.body = JSON.stringify({message: "Hello world!"});

                var self = this;
                var app = gzip(function (env, callback) {
                    callback(200, {"Content-Type": "application/json"}, new mock.Stream(self.body));
                });

                mock.getBody({
                    headers: {
                        "Accept-Encoding": "gzip, *"
                    }
                }, app, this.callback);
            },
            "should gzip encode it": function (body) {
                var compressor = new Gzip;
                compressor.init();
                var expect = compressor.deflate(this.body) + compressor.end();

                assert.equal(body, expect);
            }
        },
        "when the client does not accept gzip encoding": {
            topic: function () {
                this.body = JSON.stringify({message: "Hello world!"});

                var self = this;
                var app = gzip(function (env, callback) {
                    callback(200, {"Content-Type": "application/json"}, self.body);
                });

                mock.getBody({}, app, this.callback);
            },
            "should not encode the body": function (body) {
                assert.equal(body, this.body);
            }
        }
    }
}).export(module);
