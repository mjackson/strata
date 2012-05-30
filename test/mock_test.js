var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    utils = require("./../lib/utils");

vows.describe("mock").addBatch({
    "A mock request to utils.empty": {
        topic: function () {
            mock.request(null, utils.empty, this.callback);
        },
        "should return a correct status code": function (err, status, headers, body) {
            assert.equal(status, utils.empty.status);
        },
        "should return the correct headers": function (err, status, headers, body) {
            assert.deepEqual(headers, utils.empty.headers);
        },
        "should return an empty body": function (err, status, headers, body) {
            assert.equal(body, utils.empty.body);
        }
    },
    "A mock HEAD request": {
        topic: function () {
            var app = function (env, callback) {
                assert.equal(env.requestMethod, "HEAD");
                var content = "Hello world";
                callback(200, {
                    "Content-Type": "text/plain",
                    "Content-Length": String(Buffer.byteLength(content))
                }, content);
            };

            mock.request({
                requestMethod: "HEAD"
            }, app, this.callback);
        },
        "should return a Content-Length of 0": function (err, status, headers, body) {
            assert.equal(headers["Content-Length"], "0");
        },
        "should return an empty body": function (err, status, headers, body) {
            assert.equal(body, "");
        }
    }
}).export(module);
