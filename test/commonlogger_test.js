var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    commonLogger = require("./../lib/commonlogger"),
    utils = require("./../lib/utils");

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

            return app;
        },
        "should log the request": function (app) {
            mock.request("", app, function (status, headers, body) {});
            assert.match(this.output, /GET \/.+200/);
        }
    }
}).export(module);
