var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/link/mock"),
    contentType = require("./../lib/link/contenttype");

vows.describe("contenttype").addBatch({
    "A contentType middleware": {
        "should automatically add a Content-Type header": function () {
            var type = "text/plain";
            var app = function (env, callback) {
                callback(200, {}, "");
            }

            app = contentType(app, type);

            mock.request("", app, function (status, headers, body) {
                assert.strictEqual(headers["Content-Type"], type);
            });
        }
    }
}).export(module);
