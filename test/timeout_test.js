var assert = require("assert");
var vows = require("vows");
var strata = require("../lib");
var mock = strata.mock;
var utils = strata.utils;
var timeout = strata.timeout;

vows.describe("timeout").addBatch({
  "A timeout middleware": {
    topic: function () {
      var app = timeout(function (env, callback) {
        // Wait 20ms before sending the response.
        setTimeout(function () {
          utils.ok(env, callback);
        }, 20);
      }, 10);

      mock.call(app, "/", this.callback);
    },
    "should timeout the request properly": function (err, status, headers, body) {
      assert.equal(status, 500);
    }
  }
}).export(module);
