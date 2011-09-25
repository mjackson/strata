var util = require("util"),
    Header = require("./../header"),
    Accept = require("./accept"),
    utils = require("./../utils");

module.exports = AcceptLanguage;

/**
 * Represents an HTTP Accept-Language header according to the HTTP 1.1
 * specification, and provides several convenience methods for determining
 * acceptable content languages.
 *
 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
 */
function AcceptLanguage(value) {
    Header.call(this, "Accept-Language", value);
}

util.inherits(AcceptLanguage, Header);

AcceptLanguage.prototype.qvalues = Accept.prototype.qvalues;
AcceptLanguage.prototype.values = Accept.prototype.values;
AcceptLanguage.prototype.accept = Accept.prototype.accept;

/**
 * Determines the quality factor (qvalue) of the given `language`.
 */
AcceptLanguage.prototype.qvalue = function qvalue(language) {
    var qvalues = this.qvalues();

    if (utils.isEmptyObject(qvalues)) {
        return 1;
    }

    var matches = this.matches(language);

    if (matches.length == 0) {
        return 0;
    }

    return Accept.normalizeQvalue(qvalues[matches[0]]);
}

/**
 * Returns an array of languages from this header that match the given
 * `language`, ordered by precedence.
 */
AcceptLanguage.prototype.matches = function matches(language) {
    return this.values().filter(function (value) {
        if (value == language || value == "*") {
            return true;
        }

        var match = language.match(/^(.+?)-/);

        return match && value == match[1];
    }).sort(function (a, b) {
        // "*" gets least precedence, all others are compared by length.
        return a == "*" ? -1 : (b == "*" ? 1 : utils.compareLength(a, b));
    }).reverse();
}
