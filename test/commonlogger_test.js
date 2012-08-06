var assert = require("assert");
var vows = require("vows");
var mock = require("./../lib/mock");
var commonLogger = require("./../lib/commonlogger");
var utils = require("./../lib/utils");

vows.describe("commonlogger").addBatch({
  "A commonLogger middleware": {
    topic: function () {
      this.output = "";

      var self = this;
      var app = commonLogger(utils.empty, {
        write: function (message) {
          self.output += message;
        }
      });

      mock.request("", app, this.callback);
    },
    "should log the request": function (err, status, headers, body) {
      assert.match(this.output, /GET \/.+200/);
    }
  }
}).export(module);
