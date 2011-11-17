var assert = require("assert"),
    vows = require("vows"),
    utils = require("./../lib/utils");

vows.describe("utils").addBatch({
    'An "Accept" header': headerConversionContext("Accept", "accept", "Accept", "Accept", "httpAccept"),
    'An "accept" header': headerConversionContext("accept", "accept", "Accept", "Accept", "httpAccept"),
    'A "Content-Type" header': headerConversionContext("Content-Type", "content-type", "Content-Type", "ContentType", "httpContentType"),
    'A "content-type" header': headerConversionContext("content-type", "content-type", "Content-Type", "ContentType", "httpContentType"),
    'An "X-Forwarded-Ssl" header': headerConversionContext("X-Forwarded-Ssl", "x-forwarded-ssl", "X-Forwarded-Ssl", "XForwardedSsl", "httpXForwardedSsl"),
    'An "x-forwarded-ssl" header': headerConversionContext("x-forwarded-ssl", "x-forwarded-ssl", "X-Forwarded-Ssl", "XForwardedSsl", "httpXForwardedSsl")
}).export(module);

function headerConversionContext(header, normalized, canonical, capitalized, property) {
    var context = {};

    context.topic = header;

    context["should be converted to the proper normalized name"] = function (header) {
        assert.equal(utils.normalizedHeaderName(header), normalized);
    }
    context["should be converted to the proper canonical name"] = function (header) {
        assert.equal(utils.canonicalHeaderName(header), canonical);
    }
    context["should be converted to the proper capitalized name"] = function (header) {
        assert.equal(utils.capitalizedHeaderName(header), capitalized);
    }
    context["should be converted to the proper http* property name"] = function (header) {
        assert.equal(utils.httpPropertyName(header), property);
    }

    return context;
}
