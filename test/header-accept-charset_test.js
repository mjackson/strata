var assert = require("assert");
var vows = require("vows");
var strata = require("../lib");
var AcceptCharset = strata.AcceptCharset;

vows.describe("AcceptCharset").addBatch({
  "An AcceptCharset header": {
    "may be instantiated without using new": function () {
      assert.instanceOf(AcceptCharset(), AcceptCharset);
    },
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
