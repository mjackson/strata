var assert = require("assert"),
    vows = require("vows"),
    utils = require("./../lib/link/utils");

vows.describe("utils").addBatch({
    'An "Accept" header': headerContext("Accept", "Accept", "Accept", "httpAccept"),
    'An "accept" header': headerContext("accept", "Accept", "Accept", "httpAccept"),
    'A "Content-Type" header': headerContext("Content-Type", "Content-Type", "ContentType", "httpContentType"),
    'A "content-type" header': headerContext("content-type", "Content-Type", "ContentType", "httpContentType"),
    'An "X-Requested-With" header': headerContext("X-Requested-With", "X-Requested-With", "XRequestedWith", "httpXRequestedWith"),
    'An "x-requested-with" header': headerContext("x-requested-with", "X-Requested-With", "XRequestedWith", "httpXRequestedWith"),
    'An "X-Forwarded-SSL" header': headerContext("X-Forwarded-SSL", "X-Forwarded-Ssl", "XForwardedSsl", "httpXForwardedSsl"),
    'An "x-forwarded-ssl" header': headerContext("x-forwarded-ssl", "X-Forwarded-Ssl", "XForwardedSsl", "httpXForwardedSsl")
}).export(module);

function headerContext(header, canonicalName, capitalizedName, propertyName) {
    var context = {};

    context.topic = header;
    context["should be converted to the proper canonical name"] = function (header) {
        assert.equal(utils.canonicalHeaderName(header), canonicalName);
    }
    context["should be converted to the proper capitalized name"] = function (header) {
        assert.equal(utils.capitalizedHeaderName(header), capitalizedName);
    }
    context["should be converted to the proper http* property name"] = function (header) {
        assert.equal(utils.httpPropertyName(header), propertyName);
    }

    return context;
}
