var assert = require("assert"),
    vows = require("vows"),
    qs = require("querystring"),
    querystring = require("./../lib/querystring");

vows.describe("querystring").addBatch({
    "A Parser": {
        "write": {
            topic: new querystring.Parser,
            "should return the length of the written buffer": function (parser) {
                var a = new Buffer("a=1");
                assert.equal(parser.write(a), a.length);
                var b = new Buffer("&b=2");
                assert.equal(parser.write(b), b.length);
                assert.equal(parser.body, a + b);
            }
        },
        'when parsing "a=1&a=2"': parserContext("a=1&a=2"),
        'when parsing "a=1&b=2%20&b=3"': parserContext("a=1&b=2%20&b=3")
    }
}).export(module);

function parserContext(query) {
    var context = {};

    context.topic = function () {
        var parser = new querystring.Parser,
            params = {},
            self = this;

        parser.onParam = function (name, value) {
            params[name] = value;
        };
        parser.onEnd = function () {
            self.callback(null, params);
        };

        parser.write(query);
        parser.end();
    };

    context["should parse correctly"] = function (params) {
        assert.deepEqual(params, qs.parse(query));
    };

    return context;
}
