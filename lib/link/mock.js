var util = require("util"),
    url = require("url"),
    EventEmitter = require("events").EventEmitter,
    link = require("./../link"),
    lint = require("./lint");

exports.empty = empty;
exports.request = request;
exports.envFor = envFor;
exports.Stream = MockStream;

function empty(env, callback) {
    callback(empty.status, empty.headers, empty.body);
}

empty.status = 200;
empty.headers = {"Content-Type": "text/plain", "Content-Length": "0"};
empty.body = "";

/**
 * Calls the given +callback+ with the result of sending a mock request to the
 * given +app+. Creates the environment to use from the given +uri+ and +opts+.
 * Set opts.lint +true+ to wrap the +app+ in a lint middleware.
 */
function request(uri, opts, app, callback) {
    uri = uri || {};
    opts = opts || {};
    app = app || exports.empty;
    callback = callback || function (status, headers, body) {};

    if (opts.lint) {
        app = lint(app);
        delete opts.lint;
    }

    app(envFor(uri, opts), callback);
}

/**
 * A wrapper for +link.envFor+ that provides the following:
 *
 *   - allows a String to be given as +uri+
 *   - allows a String to be provided as +opts.input+
 */
function envFor(uri, opts) {
    uri = uri || {};
    opts = opts || {};

    if (typeof uri == "string") {
        uri = url.parse(uri);
    }

    // Wrap String inputs in a MockStream.
    var input;
    if (opts.input) {
        if (opts.input instanceof EventEmitter) {
            input = opts.input;
        } else if (typeof opts.input === "string") {
            input = new MockStream(opts.input);
        } else {
            throw new Error("Input must be an EventEmitter or String");
        }
    } else {
        input = new MockStream;
    }

    opts.input = input;

    return link.envFor(uri, opts);
}

/**
 * Imitates a stream that emits the given +string+.
 */
function MockStream(string) {
    EventEmitter.call(this);

    string = string || "";

    this.encoding = null;
    this.wait = false;

    this.readable = true;
    this.writable = false;

    var buffer = new Buffer(string),
        self = this;

    process.nextTick(function () {
        if (self.wait) {
            process.nextTick(arguments.callee);
            return;
        }

        if (self.encoding) {
            self.emit("data", buffer.toString(self.encoding));
        } else {
            self.emit("data", buffer);
        }

        self.emit("end");
        self.readable = false;
    });
}

util.inherits(MockStream, EventEmitter);

MockStream.prototype.setEncoding = function (encoding) {
    this.encoding = encoding;
}

MockStream.prototype.pause = function () {
    this.wait = true;
}

MockStream.prototype.resume = function () {
    this.wait = false;
}
