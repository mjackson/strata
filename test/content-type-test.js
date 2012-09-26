var assert = require("assert");
var vows = require("vows");
var strata = require("../lib");
var mock = strata.mock;
var contentType = strata.contentType;

vows.describe("contentType").addBatch({
  "A contentType middleware": {
    topic: function () {
      this.type = "text/plain";

      var app = contentType(function (env, callback) {
        callback(200, {}, "");
      }, this.type);

      mock.call(app, '/', this.callback);
    },
    "should add a Content-Type header": function (err, status, headers, body) {
      assert.strictEqual(headers["Content-Type"], this.type);
    }
  }
}).export(module);
