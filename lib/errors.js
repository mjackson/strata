var util = require("util");

exports.Error = StrataError;
exports.InvalidRequestBodyError = InvalidRequestBodyError;

/**
 * An Error subclass that is better-suited for subclassing and is nestable.
 * Arguments are the error message and an optional cause, which should be
 * another error object that was responsible for causing this error at some
 * lower level.
 */
function StrataError(message, cause) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.cause = cause;
}

util.inherits(StrataError, Error);

StrataError.prototype.__defineGetter__("fullStack", function fullStack() {
    var stack = this.stack;

    if (this.cause) {
        stack += "\nCaused by " + this.cause.fullStack;
    }

    return stack;
});

// For consistency with StrataError.
Error.prototype.__defineGetter__("fullStack", function fullStack() {
    return this.stack;
});

/**
 * This error is returned when the request body is not valid for some reason,
 * probably because it does not conform to the Content-Type indicated in the
 * request headers.
 */
function InvalidRequestBodyError(message, cause) {
    message = message || "Invalid Request Body";
    StrataError.call(this, message, cause);
}

util.inherits(InvalidRequestBodyError, StrataError);
