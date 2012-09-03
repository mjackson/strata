var assert = require("assert");
var vows = require("vows");
var strata = require("../lib");
var mock = strata.mock;
var methodOverride = strata.methodOverride;

vows.describe("methodOverride").addBatch({
  "A methodOverride middleware": {
    topic: function () {
      var app = methodOverride(function (env, callback) {
        callback(200, {
          "Content-Type": "text/plain",
          "X-RequestMethod": env.requestMethod
        }, "");
      });

      return app;
    },
    "when using GET": {
      topic: function (app) {
        mock.call(app, "/?_method=put", this.callback);
      },
      "should return 200": function (err, status, headers, body) {
        assert.equal(status, 200);
      },
      "should not modify the request method": function (err, status, headers, body) {
        assert.equal(headers["X-RequestMethod"], "GET");
      }
    },
    "when using POST with a method in the queryString": {
      topic: function (app) {
        mock.call(app, mock.env({
          requestMethod: "POST",
          queryString: "_method=put"
        }), this.callback);
      },
      "should return 200": function (err, status, headers, body) {
        assert.equal(status, 200);
      },
      "should modify the request method": function (err, status, headers, body) {
        assert.equal(headers["X-RequestMethod"], "PUT");
      }
    },
    "when using POST with a method in the post body": {
      topic: function (app) {
        mock.call(app, mock.env({
          requestMethod: "POST",
          input: "_method=put"
        }), this.callback);
      },
      "should return 200": function (err, status, headers, body) {
        assert.equal(status, 200);
      },
      "should modify the request method": function (err, status, headers, body) {
        assert.equal(headers["X-RequestMethod"], "PUT");
      }
    },
    "when using POST with a method in the HTTP headers": {
      topic: function (app) {
        mock.call(app, mock.env({
          requestMethod: "POST",
          headers: {
            "X-Http-Method-Override": "put"
          }
        }), this.callback);
      },
      "should return 200": function (err, status, headers, body) {
        assert.equal(status, 200);
      },
      "should modify the request method": function (err, status, headers, body) {
        assert.equal(headers["X-RequestMethod"], "PUT");
      }
    }
  }
}).export(module);
