var assert = require("assert"),
    vows = require("vows"),
    path = require("path"),
    fs = require("fs"),
    mock = require("./../lib/mock"),
    gzip = require("./../lib/gzip"),
    file = require("./../lib/file"),
    utils = require("./../lib/utils"),
    BufferedStream = require("bufferedstream");

vows.describe("gzip").addBatch({
    "A gzip middleware": {
        "with a string body": {
            topic: function () {
                this.file = path.resolve(__dirname, "_files/test.txt");
                this.body = fs.readFileSync(this.file + ".gz", "utf8");

                var self = this;
                var app = gzip(function (env, callback) {
                    var body = fs.readFileSync(self.file, "utf8");
                    callback(200, {"Content-Type": "text/plain"}, body);
                });

                mock.request({
                    headers: {
                        "Accept-Encoding": "gzip, *"
                    }
                }, app, this.callback);
            },
            "should gzip encode it": function (err, status, headers, body) {
                assert.equal(headers["Content-Encoding"], "gzip");
                assert.equal(body, this.body);
            }
        },
        "with a Stream body": {
            topic: function () {
                this.file = path.resolve(__dirname, "_files/test.txt");
                this.body = fs.readFileSync(this.file + ".gz", "utf8");

                var self = this;
                var app = gzip(function (env, callback) {
                    var body = new BufferedStream(fs.readFileSync(self.file, "utf8"));
                    callback(200, {"Content-Type": "text/plain"}, body);
                });

                mock.request({
                    headers: {
                        "Accept-Encoding": "gzip, *"
                    }
                }, app, this.callback);
            },
            "should gzip encode it": function (err, status, headers, body) {
                assert.equal(headers["Content-Encoding"], "gzip");
                assert.equal(body, this.body);
            }
        },
        "with a file Stream body": {
            topic: function () {
                this.file = path.resolve(__dirname, "_files/test.txt");
                this.body = fs.readFileSync(this.file + ".gz", "utf8");

                var app = utils.notFound;
                app = file(app, path.resolve(__dirname, "_files"));
                app = gzip(app);

                mock.request({
                    pathInfo: "/test.txt",
                    headers: {
                        "Accept-Encoding": "gzip, *"
                    }
                }, app, this.callback);
            },
            "should gzip encode it": function (err, status, headers, body) {
                assert.equal(headers["Content-Encoding"], "gzip");
                assert.equal(body, this.body);
            }
        },
        "when the client does not accept gzip encoding": {
            topic: function () {
                this.file = path.resolve(__dirname, "_files/test.txt");
                this.body = fs.readFileSync(this.file, "utf8");

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
