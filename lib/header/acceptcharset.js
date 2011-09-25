var util = require("util"),
    Header = require("./../header"),
    Accept = require("./accept");

module.exports = AcceptCharset;

/**
 * Represents an HTTP Accept-Charset header according to the HTTP 1.1
 * specification, and provides several convenience methods for determining
 * acceptable character sets.
 *
 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.2
 */
function AcceptCharset(value) {
    Header.call(this, "Accept-Charset", value);
}

util.inherits(AcceptCharset, Header);

AcceptCharset.prototype.qvalues = Accept.prototype.qvalues;
AcceptCharset.prototype.values = Accept.prototype.values;
AcceptCharset.prototype.accept = Accept.prototype.accept;

/**
 * Determines the quality factor (qvalue) of the given `charset`.
 */
AcceptCharset.prototype.qvalue = function qvalue(charset) {
    var matches = this.matches(charset);

    if (matches.length == 0) {
        return charset == "iso-8859-1" ? 1 : 0;
    }

    var qvalues = this.qvalues();

    return Accept.normalizeQvalue(qvalues[matches[0]]);
}

/**
 * Returns an array of character sets from this header that match the given
 * `charset`, ordered by precedence.
 */
AcceptCharset.prototype.matches = function matches(charset) {
    return this.values().filter(function (value) {
        return value == charset || value == "*";
    }).sort(function (a, b) {
        // "*" gets least precedence, all others are equal.
        return a == "*" ? 1 : (b == "*" ? -1 : 0);
    });
}
