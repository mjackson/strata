var assert = require("assert"),
    vows = require("vows"),
    utils = require("./../lib/utils");

vows.describe("utils").addBatch({
    'An "Accept" header': headerConversionContext("Accept", "accept", "Accept", "Accept", "httpAccept"),
    'An "accept" header': headerConversionContext("accept", "accept", "Accept", "Accept", "httpAccept"),
    'A "Content-Type" header': headerConversionContext("Content-Type", "content-type", "Content-Type", "ContentType", "httpContentType"),
    'A "content-type" header': headerConversionContext("content-type", "content-type", "Content-Type", "ContentType", "httpContentType"),
    'An "X-Forwarded-Ssl" header': headerConversionContext("X-Forwarded-Ssl", "x-forwarded-ssl", "X-Forwarded-Ssl", "XForwardedSsl", "httpXForwardedSsl"),
    'An "x-forwarded-ssl" header': headerConversionContext("x-forwarded-ssl", "x-forwarded-ssl", "X-Forwarded-Ssl", "XForwardedSsl", "httpXForwardedSsl"),
    "compileRoute": {
        "should properly recognize valid identifiers": function () {
            var keys, pattern;

            keys = [];
            pattern = utils.compileRoute("/users/:id", keys);

            assert.ok(pattern);
            assert.deepEqual(keys, ["id"]);
            assert.match("/users/1", pattern);
            assert.match("/users/asdf1324_", pattern);

            keys = [];
            pattern = utils.compileRoute("/users/:$id/photos/:_photo_id", keys);

            assert.ok(pattern);
            assert.deepEqual(keys, ["$id", "_photo_id"]);
            assert.match("/users/1/photos/1", pattern);

            keys = [];
            pattern = utils.compileRoute("/users/:id.:format", keys);

            assert.ok(pattern);
            assert.deepEqual(keys, ["id", "format"]);
            assert.match("/users/2.json", pattern);
        },
        "should properly recognize the splat character": function () {
            var keys = [];
            var pattern = utils.compileRoute("/users/*", keys);

            assert.ok(pattern);
            assert.deepEqual(keys, ["splat"]);
            assert.match("/users/1", pattern);
            assert.match("/users/1/photos/1", pattern);
        },
        "should ignore invalid identifiers": function () {
            var keys = [];
            var pattern = utils.compileRoute("/users/:1id");

            assert.ok(pattern);
            assert.isEmpty(keys);
        }
    },

}).export(module);

function headerConversionContext(header, normalized, canonical, capitalized, property) {
    var context = {};

    context.topic = header;

    context["should be converted to the proper normalized name"] = function (header) {
        assert.equal(utils.normalizedHeaderName(header), normalized);
    };
    context["should be converted to the proper canonical name"] = function (header) {
        assert.equal(utils.canonicalHeaderName(header), canonical);
    };
    context["should be converted to the proper capitalized name"] = function (header) {
        assert.equal(utils.capitalizedHeaderName(header), capitalized);
    };
    context["should be converted to the proper http* property name"] = function (header) {
        assert.equal(utils.httpPropertyName(header), property);
    };

    return context;
}
