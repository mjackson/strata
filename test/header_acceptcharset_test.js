var assert = require("assert"),
    vows = require("vows"),
    AcceptCharset = require("./../lib/header/acceptcharset");

vows.describe("header/acceptcharset").addBatch({
    "An AcceptCharset header": {
        "should know its qvalues": function () {
            var header = new AcceptCharset("");
            assert.equal(header.qvalue("unicode-1-1"), 0);
            assert.equal(header.qvalue("iso-8859-1"), 1);

            header = new AcceptCharset("unicode-1-1");
            assert.equal(header.qvalue("unicode-1-1"), 1);
            assert.equal(header.qvalue("iso-8859-5"), 0);
            assert.equal(header.qvalue("iso-8859-1"), 1);

            header = new AcceptCharset("unicode-1-1, *;q=0.5");
            assert.equal(header.qvalue("unicode-1-1"), 1);
            assert.equal(header.qvalue("iso-8859-5"), 0.5);
            assert.equal(header.qvalue("iso-8859-1"), 0.5);

            header = new AcceptCharset("iso-8859-1;q=0, *;q=0.5");
            assert.equal(header.qvalue("iso-8859-5"), 0.5);
            assert.equal(header.qvalue("iso-8859-1"), 0);

            header = new AcceptCharset("*;q=0");
            assert.equal(header.qvalue("iso-8859-1"), 0);
        },
        "should match properly": function () {
            var header = new AcceptCharset("iso-8859-1, iso-8859-5, *");
            assert.deepEqual(header.matches(""), ["*"]);
            assert.deepEqual(header.matches("iso-8859-1"), ["iso-8859-1", "*"]);
            assert.deepEqual(header.matches("unicode-1-1"), ["*"]);
        }
    }
}).export(module);
