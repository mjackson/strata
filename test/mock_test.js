var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    utils = require("./../lib/utils");

vows.describe("mock").addBatch({
    "A mock request to utils.empty": {
        topic: function () {
            mock.request(null, utils.empty, this.callback);
        },
        "should return a correct status code": function (err, status, headers, body) {
            assert.equal(status, utils.empty.status);
        },
        "should return the correct headers": function (err, status, headers, body) {
            assert.deepEqual(headers, utils.empty.headers);
        },
        "should return an empty body": function (err, status, headers, body) {
            assert.equal(body, utils.empty.body);
        }
    }
}).export(module);
