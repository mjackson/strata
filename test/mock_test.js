var assert = require("assert");
var qs = require("querystring");
var vows = require("vows");
var strata = require("../lib");
var utils = strata.utils;
var mock = strata.mock;

vows.describe("mock").addBatch({
  "A mock request to utils.ok": {
    topic: function () {
      mock.call(utils.ok, '/', this.callback);
    },
    "should return a correct status code": function (err, status, headers, body) {
      assert.equal(status, 200);
    },
    "should return the correct headers": function (err, status, headers, body) {
      assert.deepEqual(headers, { 'Content-Type': 'text/plain', 'Content-Length': '2' });
    },
    "should return an OK body": function (err, status, headers, body) {
      assert.equal(body, 'OK');
    }
  },
  "A mock HEAD request": {
    topic: function () {
      var app = function (env, callback) {
        assert.equal(env.requestMethod, "HEAD");
        utils.ok(env, callback);
      };

      mock.call(app, mock.env({
        requestMethod: "HEAD"
      }), this.callback);
    },
    "should return a Content-Length of 0": function (err, status, headers, body) {
      assert.equal(headers["Content-Length"], "0");
    },
    "should return an empty body": function (err, status, headers, body) {
      assert.equal(body, "");
    }
  },
  "env": {
    "when given a params object": {
      topic: function () {
        return mock.env({ params: { a: 'a', b: 'b' } });
      },
      "encodes it in the query string": function (env) {
        var query = qs.parse(env.queryString);
        assert.equal(query.a, 'a');
        assert.equal(query.b, 'b');
      }
    }
  }
}).export(module);
