var assert = require("assert"),
    vows = require("vows"),
    path = require("path"),
    fs = require("fs"),
    mock = require("./../lib/mock"),
    Gzip = require("gzbz2").Gzip,
    gzip = require("./../lib/gzip"),
    stat = require("./../lib/static"),
    utils = require("./../lib/utils");

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
        "with a file Stream body": {
            topic: function () {
                this.file = path.resolve(__dirname, "_files/test.txt");

                var app = utils.notFound;
                app = stat(app, path.resolve(__dirname, "_files"));
                app = gzip(app);

                mock.request({
                    pathInfo: "/test.txt",
                    headers: {
                        "Accept-Encoding": "gzip, *"
                    }
                }, app, this.callback);
            },
            "should gzip encode it": function (err, status, headers, body) {
                var expect = fs.readFileSync(this.file + ".gz", "utf8");
                fs.writeFileSync("sample.txt.gz", body);
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
