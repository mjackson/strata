var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/link/mock"),
    commonLogger = require("./../lib/link/commonlogger");

vows.describe("commonlogger").addBatch({
    "A commonLogger middleware": {
        topic: function () {
            this.output = "";

            var self = this;
            var app = commonLogger(mock.empty, {
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
