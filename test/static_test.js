var assert = require("assert"),
    vows = require("vows"),
    path = require("path"),
    fs = require("fs"),
    EventEmitter = require("events").EventEmitter,
    mock = require("./../lib/mock"),
    stat = require("./../lib/static");

var root = path.join(__dirname, "_files");

vows.describe("static").addBatch({
    "A static middleware": {
        topic: function () {
            var app = stat(function (env, callback) {
                var message = "Not found: " + env.pathInfo;
                callback(404, {
                    "Content-Type": "text/plain",
                    "Content-Length": message.length.toString(10)
                }, message);
            }, root, "index.html");

            return app;
        },
        "when a static file is requested": {
            topic: function (app) {
                this.body = fs.readFileSync(path.join(root, "text"), "utf8");
                getBody("/text", app, this.callback);
            },
            "should serve that file": function (body) {
                assert.equal(body, this.body);
            }
        },
        "when a directory is requested": {
            topic: function (app) {
                this.body = fs.readFileSync(path.join(root, "index.html"), "utf8");
                getBody("/", app, this.callback);
            },
            "should serve the index file": function (body) {
                assert.equal(body, this.body);
            }
        },
        "when a matching file cannot be found": {
            topic: function (app) {
                getStatus("/does-not-exist", app, this.callback);
            },
            "should forward the request to the downstream app": function (status) {
                assert.equal(status, 404);
            }
        }
    }
}).export(module);

function getStatus(file, app, callback) {
    mock.request(file, app, function (status, headers, body) {
        callback(null, status);
    });
}

function getBody(file, app, callback) {
    mock.request(file, app, function (status, headers, body) {
        assert.equal(status, 200);
        assert.instanceOf(body, EventEmitter);

        var contents = "";

        body.resume();
        body.on("data", function (buffer) {
            contents += buffer.toString("utf8");
        });
        body.on("end", function () {
            callback(null, contents);
        });
    });
}
