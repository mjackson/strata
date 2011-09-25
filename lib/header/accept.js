var util = require("util"),
    Header = require("./../header"),
    utils = require("./../utils");

module.exports = Accept;

/**
 * Represents an HTTP Accept header according to the HTTP 1.1 specification,
 * and provides several convenience methods for determining acceptable media
 * types.
 *
 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.1
 */
function Accept(value) {
    if (value) {
        // Strip accept-extension for now. May want to do something with this
        // later if people actually start using it.
        value = value.split(/,\s*/).map(function (part) {
            return part.replace(/(;\s*q\s*=\s*[\d.]+).*$/, "$1")
        }).join(", ");
    }

    Header.call(this, "Accept", value);
}

util.inherits(Accept, Header);

/**
 * Returns an object of all values in this header to their respective qvalue.
 */
Accept.prototype.qvalues = function qvalues() {
    if (!this._qvalues) {
        this._qvalues = parseQvalues(this.value);
    }

    return this._qvalues;
}

/**
 * Returns an array of all values of this header.
 */
Accept.prototype.values = function values() {
    return Object.keys(this.qvalues());
}

/**
 * Returns `true` if the given `value` is acceptable according to this header.
 */
Accept.prototype.accept = function accept(value) {
    return this.qvalue(value) != 0
}

Accept.prototype.qvalue = function qvalue(mediaType) {
    var qvalues = this.qvalues();

    if (utils.isEmptyObject(qvalues)) {
        return 1;
    }

    var matches = this.matches(mediaType);

    if (matches.length == 0) {
        return 0;
    }

    return normalizeQvalue(qvalues[matches[0]]);
}

Accept.prototype.matches = function matches(mediaType) {
    var parsed = parseMediaType(mediaType),
        type = parsed[0],
        subtype = parsed[1],
        params = parsed[2];

    var parsedValue, valueType, valueSubtype, valueParams;
    var matches = this.values().filter(function (value) {
        if (value == mediaType || value == "*/*") {
            return true;
        }

        parsedValue = parseMediaType(value);
        valueType = parsedValue[0];
        valueSubtype = parsedValue[1];
        valueParams = parsedValue[2];

        if (valueType == type &&
            (valueSubtype == "*" || valueSubtype == subtype) &&
            (valueParams == "" || paramsMatch(params, valueParams))) {
                return true;
        }

        return false;
    });

    utils.sortByLength(matches);
    matches.reverse();

    return matches;
}

function paramsMatch(params, match) {
    if (params == match) {
        return true;
    }

    var parsedParams = parseRangeParams(params);
    var parsedMatch = parseRangeParams(match);

    for (var prop in parsedMatch) {
        if (parsedMatch[prop] !== parsedParams[prop]) {
            return false;
        }
    }

    return true;
}

Accept.parseQvalues = parseQvalues;
Accept.stringifyQvalues = stringifyQvalues;
Accept.normalizeQvalue = normalizeQvalue;
Accept.parseMediaType = parseMediaType;
Accept.parseRangeParams = parseRangeParams;

/**
 * Parses all acceptable values in the given `value` string into an object keyed
 * by value name, whose values are qvalues.
 */
function parseQvalues(value) {
    var qvalues = {},
        match;

    value.split(/,\s*/).forEach(function (part) {
        match = part.match(/^([^\s,]+?)(?:\s*;\s*q\s*=\s*(\d+(?:\.\d+)?))?$/);

        if (match) {
            qvalues[match[1]] = normalizeQvalue(parseFloat(match[2] || 1));
        }
    });

    return qvalues;
}

/**
 * Converts the given object of `qvalues` into a string.
 */
function stringifyQvalues(qvalues) {
    var parts = [],
        qvalue;

    for (var value in qvalues) {
        qvalue = qvalues[value];
        parts.push(value + (qvalue == 1 ? "" : ";q=" + qvalue));
    }

    return parts.join(", ");
}

/**
 * Converts 1.0 and 0.0 qvalues to 1 and 0 respectively. Used to maintain
 * consistency across qvalue methods.
 */
function normalizeQvalue(qvalue) {
    if (qvalue == 1 || qvalue == 0) {
        return Math.floor(qvalue);
    }

    return qvalue;
}

/**
 * Parses a media type string into its relevant pieces. The return value
 * will be an array with three values: 1) the content type, 2) the content
 * subtype, and 3) the media type parameters. An empty array is returned if
 * no match can be made.
 */
function parseMediaType(mediaType) {
    var match = mediaType.match(/^([a-z*]+)\/([a-z0-9*\-.+]+)(?:;([a-z0-9=;]+))?$/);

    if (match) {
        return [match[1], match[2], match[3] || ""];
    }

    return [];
}

/**
 * Parses a string of media type range parameters into a hash of parameters
 * to their respective values.
 */
function parseRangeParams(params) {
    var parts = params.split(";"),
        rangeParams = {};

    var split, key, value;
    parts.forEach(function (part) {
        split = part.split("=");
        key = split[0];
        value = split[1];

        if (value) {
            rangeParams[key] = value;
        }
    });

    return rangeParams;
}
