var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    contentType = require("./../lib/contenttype");

vows.describe("contenttype").addBatch({
    "A contentType middleware": {
        topic: function () {
            this.type = "text/plain";

            var app = contentType(function (env, callback) {
                callback(200, {}, "");
            }, this.type);

            mock.request("", app, this.callback);
        },
        "should add a Content-Type header": function (err, status, headers, body) {
            assert.strictEqual(headers["Content-Type"], this.type);
        }
    }
}).export(module);
