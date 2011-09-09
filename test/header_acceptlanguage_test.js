var assert = require("assert"),
    vows = require("vows"),
    AcceptLanguage = require("./../lib/header/acceptlanguage");

vows.describe("header/acceptlanguage").addBatch({
    "An AcceptLanguage header": {
        "should know its qvalues": function () {
            var header = new AcceptLanguage("");
            assert.equal(header.qvalue("en"), 1);

            header = new AcceptLanguage("en;q=0.5, en-gb");
            assert.equal(header.qvalue("en"), 0.5);
            assert.equal(header.qvalue("en-gb"), 1);
            assert.equal(header.qvalue("da"), 0);
        },
        "should match properly": function () {
            var header = new AcceptLanguage("da, *, en");
            assert.deepEqual(header.matches(""), ["*"]);
            assert.deepEqual(header.matches("da"), ["da", "*"]);
            assert.deepEqual(header.matches("en"), ["en", "*"]);
            assert.deepEqual(header.matches("en-gb"), ["en", "*"]);
            assert.deepEqual(header.matches("eng"), ["*"]);

            header = new AcceptLanguage("en, en-gb");
            assert.deepEqual(header.matches("en-gb"), ["en-gb", "en"]);
        }
    }
}).export(module);
