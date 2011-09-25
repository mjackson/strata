var util = require("util"),
    Header = require("./../header"),
    Accept = require("./accept");

module.exports = AcceptEncoding;

/**
 * Represents an HTTP Accept-Encoding header according to the HTTP 1.1
 * specification, and provides several convenience methods for determining
 * acceptable content encodings.
 *
 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
 */
function AcceptEncoding(value) {
    Header.call(this, "Accept-Encoding", value);
}

util.inherits(AcceptEncoding, Header);

AcceptEncoding.prototype.qvalues = Accept.prototype.qvalues;
AcceptEncoding.prototype.values = Accept.prototype.values;
AcceptEncoding.prototype.accept = Accept.prototype.accept;

/**
 * Determines the quality factor (qvalue) of the given `encoding`.
 */
AcceptEncoding.prototype.qvalue = function qvalue(encoding) {
    var matches = this.matches(encoding);

    if (matches.length == 0) {
        return encoding == "identity" ? 1 : 0;
    }

    var qvalues = this.qvalues();

    return Accept.normalizeQvalue(qvalues[matches[0]]);
}

/**
 * Returns an array of encodings from this header that match the given
 * `encoding`, ordered by precedence.
 */
AcceptEncoding.prototype.matches = function matches(encoding) {
    return this.values().filter(function (value) {
        return value == encoding || value == "*";
    }).sort(function (a, b) {
        // "*" gets least precedence, all others are equal.
        return a == "*" ? 1 : (b == "*" ? -1 : 0);
    });
}
