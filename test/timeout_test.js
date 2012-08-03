var assert = require("assert");
var vows = require("vows");
var mock = require("./../lib/mock");
var utils = require("./../lib/utils");
var timeout = require("./../lib/timeout");

vows.describe("timeout").addBatch({
    "A timeout middleware": {
        topic: function () {
            var app = timeout(function (env, callback) {
                // Wait 20ms before sending the response.
                setTimeout(function () {
                    utils.empty(env, callback);
                }, 20);
            }, 10);

            mock.request("/", app, this.callback);
        },
        "should timeout the request properly": function (err, status, headers, body) {
            assert.equal(status, 500);
        }
    }
}).export(module);
