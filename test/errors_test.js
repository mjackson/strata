var assert = require("assert"),
    vows = require("vows"),
    strata = require("./../lib/index"),
    errors = require("./../lib/errors");

vows.describe("errors").addBatch({
    "An errors.Error": {
        topic: new errors.Error("Bang!"),
        "should be an instance of Error": function (err) {
            assert.instanceOf(err, Error);
        }
    },
    "An errors.InvalidRequestBodyError": {
        topic: new errors.InvalidRequestBodyError("Bang!"),
        "should be an instance of Error": function (err) {
            assert.instanceOf(err, Error);
        },
        "should be an instance of errors.Error": function (err) {
            assert.instanceOf(err, errors.Error);
        }
    }
}).export(module);
