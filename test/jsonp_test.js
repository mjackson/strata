var assert = require("assert");
var vows = require("vows");
var BufferedStream = require("bufferedstream");
var strata = require("../lib");
var mock = strata.mock;
var jsonp = strata.jsonp;

vows.describe("jsonp").addBatch({
  "A jsonp middleware": {
    "with a string body": {
      topic: function () {
        this.body = JSON.stringify({ message: "Hello world!" });

        var self = this;
        var app = jsonp(function (env, callback) {
          callback(200, { "Content-Type": "application/json" }, self.body);
        });

        mock.call(app, '/', this.callback);
      },
      "should wrap it in a JavaScript callback": function (err, status, headers, body) {
        assert.equal(headers["Content-Type"], "application/javascript");
        var expect = "callback(" + this.body + ")";
        assert.equal(body, expect);
      },
      "with a custom callback name": {
        topic: function () {
          this.body = JSON.stringify({ message: "Hello world!" });

          var self = this;
          var app = jsonp(function (env, callback) {
            callback(200, { "Content-Type": "application/json" }, self.body);
          }, "aCallback");

          mock.call(app, '/', this.callback);
        },
        "should wrap it in a JavaScript callback with that name": function (err, status, headers, body) {
          assert.equal(headers["Content-Type"], "application/javascript");
          var expect = "aCallback(" + this.body + ")";
          assert.equal(body, expect);
        },
        "when the request contains a `callback` parameter": {
          topic: function () {
            this.body = JSON.stringify({ message: "Hello world!" });

            var self = this;
            var app = jsonp(function (env, callback) {
              callback(200, { "Content-Type": "application/json" }, self.body);
            }, "aCallback");

            mock.call(app, "/?callback=customCallback", this.callback);
          },
          "should wrap it in a JavaScript callback with the name in that parameter": function (err, status, headers, body) {
            assert.equal(headers["Content-Type"], "application/javascript");
            var expect = "customCallback(" + this.body + ")";
            assert.equal(body, expect);
          }
        }
      }
    },
    "with a Stream body": {
      topic: function () {
        this.body = JSON.stringify({ message: "Hello world!" });

        var self = this;
        var app = jsonp(function (env, callback) {
          var stream = new BufferedStream(self.body);
          callback(200, { "Content-Type": "application/json" }, stream);
        });

        mock.call(app, '/', this.callback);
      },
      "should wrap it in a JavaScript callback": function (err, status, headers, body) {
        assert.equal(headers["Content-Type"], "application/javascript");
        var expect = "callback(" + this.body + ")";
        assert.equal(body, expect);
      }
    }
  }
}).export(module);
