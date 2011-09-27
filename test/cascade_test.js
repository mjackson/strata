var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    cascade = require("./../lib/cascade");

vows.describe("cascade").addBatch({
    "A cascade middleware": {
        topic: function () {
            var apps = [
                generateApp(0, 404),
                generateApp(1, 404),
                generateApp(2, 200)
            ];

            var app = cascade(apps, 404);

            mock.request("", app, this.callback);
        },
        "should return the response of the first app": function (err, status, headers, body) {
            assert.ok(headers["X-Number"]);
            assert.equal(headers["X-Number"], "2");
        }
    }
}).export(module);

function generateApp(n, status) {
    status = status || 404;

    return function (env, callback) {
        callback(status, {
            "Content-Type": "text/plain",
            "X-Number": n.toString()
        }, "");
    }
}
