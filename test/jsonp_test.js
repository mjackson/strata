var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    jsonp = require("./../lib/jsonp");

vows.describe("gzip").addBatch({
    "A gzip middleware": {
        "with a string body": {
            topic: function () {
                this.body = JSON.stringify({message: "Hello world!"});

                var self = this;
                var app = jsonp(function (env, callback) {
                    callback(200, {"Content-Type": "application/json"}, self.body);
                });

                mock.request("", app, this.callback);
            },
            "should wrap it in a JavaScript callback": function (err, status, headers, body) {
                assert.equal(headers["Content-Type"], "application/javascript");

                var expect = "callback(" + this.body + ")";

                assert.equal(body, expect);
            }
        },
        "with a Stream body": {
            topic: function () {
                this.body = JSON.stringify({message: "Hello world!"});

                var self = this;
                var app = jsonp(function (env, callback) {
                    callback(200, {"Content-Type": "application/json"}, new mock.Stream(self.body));
                });

                mock.request("", app, this.callback);
            },
            "should wrap it in a JavaScript callback": function (err, status, headers, body) {
                assert.equal(headers["Content-Type"], "application/javascript");

                var expect = "callback(" + this.body + ")";

                assert.equal(body, expect);
            }
        }
    }
}).export(module);
