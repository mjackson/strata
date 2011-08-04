var assert = require("assert"),
    vows = require("vows"),
    path = require("path"),
    fs = require("fs"),
    EventEmitter = require("events").EventEmitter,
    mock = require("./../lib/link/mock"),
    stat = require("./../lib/link/static");

vows.describe("static").addBatch({
    "A static middleware": {
        topic: function () {
            this.root = path.join(__dirname, "_files");
            this.text = fs.readFileSync(path.join(this.root, "text"), "utf8");

            var app = stat(function (env, callback) {
                var message = "Not found: " + env.pathInfo;
                callback(404, {
                    "Content-Type": "text/plain",
                    "Content-Length": message.length.toString(10)
                }, message);
            }, this.root);

            return app;
        },
        "should correctly serve static files": function (app) {
            var self = this;
            mock.request("/text", app, function (status, headers, body) {
                assert.equal(status, 200);
                assert.instanceOf(body, EventEmitter);

                var contents = "";

                body.resume();
                body.on("data", function (buffer) {
                    contents += buffer.toString("utf8");
                });
                body.on("end", function () {
                    assert.equal(contents, self.text);
                });
            });
        },
        "should correctly forward the request to the downstream app when a matching file cannot be found": function (app) {
            mock.request("/does-not-exist", app, function (status, headers, body) {
                assert.equal(status, 404);
            });
        }
    }
}).export(module);
