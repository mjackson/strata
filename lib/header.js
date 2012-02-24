var strata = require("./index");

module.exports = Header;

/**
 * Represents a generic HTTP header.
 */
function Header(name, value) {
    if (!(this instanceof Header)) {
        return new Header(name, value);
    }

    if (typeof name === "undefined") {
        throw new strata.Error("Header name is required");
    }

    this.name = name;
    this.value = value || "";
}

Header.prototype.toString = function toString() {
    return [this.name, this.value].join(": ");
}
