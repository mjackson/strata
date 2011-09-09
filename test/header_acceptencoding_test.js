var assert = require("assert"),
    vows = require("vows"),
    AcceptEncoding = require("./../lib/header/acceptencoding");

vows.describe("header/acceptencoding").addBatch({
    "An AcceptEncoding header": {
        "should know its qvalues": function () {
            var header = new AcceptEncoding("");
            assert.equal(header.qvalue("gzip"), 0);
            assert.equal(header.qvalue("identity"), 1);

            header = new AcceptEncoding("gzip, *;q=0.5");
            assert.equal(header.qvalue("gzip"), 1);
            assert.equal(header.qvalue("identity"), 0.5);
        },
        "should match properly": function () {
            var header = new AcceptEncoding("gzip, identity, *");
            assert.deepEqual(header.matches(""), ["*"]);
            assert.deepEqual(header.matches("gzip"), ["gzip", "*"]);
            assert.deepEqual(header.matches("compress"), ["*"]);
        }
    }
}).export(module);
