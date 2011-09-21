var util = require("util"),
    url = require("url"),
    EventEmitter = require("events").EventEmitter,
    Stream = require("stream").Stream,
    assert = require("assert"),
    strata = require("./index"),
    lint = require("./lint"),
    utils = require("./utils");

exports.request = request;
exports.env = makeEnv;
exports.Stream = MockStream;

/**
 * Calls the given +callback+ with the result of sending a mock request to the
 * given +app+. Creates the environment to use from the given +opts+. Set
 * +opts.lint+ to +true+ to wrap the +app+ in a lint middleware.
 */
function request(opts, app, callback) {
    opts = opts || {};
    app = app || utils.empty;
    callback = callback || function (status, headers, body) {};

    if (opts.lint) {
        app = lint(app);
        delete opts.lint;
    }

    // The app may be any object that has a toApp method (e.g. a Builder).
    if (typeof app.toApp == "function") {
        app = app.toApp();
    }

    if (opts.stream) {
        delete opts.stream;
        app(makeEnv(opts), callback);
    } else {
        // Buffer the body of the response for easy async testing.
        app(makeEnv(opts), function (status, headers, body) {
            if (typeof body == "string") {
                callback(null, status, headers, body);
            } else {
                assert.instanceOf(body, EventEmitter);

                var contents = "";

                if (typeof body.resume == "function") {
                    body.resume();
                }

                body.on("data", function (buffer) {
                    contents += buffer.toString("utf8");
                });

                body.on("end", function () {
                    callback(null, status, headers, contents);
                });
            }
        });
    }
}

/**
 * A wrapper for +strata.env+ that allows a URL string to be given as +opts+
 * instead of a traditional object. This string will be used for the protocol,
 * serverName, serverPort, pathInfo, and queryString environment variables.
 */
function makeEnv(opts) {
    opts = opts || {};

    // If opts is a string, it specifies a URL.
    if (typeof opts == "string") {
        var uri = url.parse(opts);

        opts = {
            protocol: uri.protocol,
            serverName: uri.hostname,
            serverPort: uri.port,
            pathInfo: uri.pathname,
            queryString: uri.query
        };
    }

    return strata.env(opts);
}

/**
 * A constructor that inherits from Stream and emits data from the given
 * `source`. If it's a Stream it will be piped through to this stream.
 * Otherwise, it should be a string or a Buffer which will be emitted by this
 * stream as soon as possible.
 */
function MockStream(source) {
    Stream.call(this);

    this._chunks = [];
    this._wait = false;
    this.encoding = null;
    this.readable = true;
    this.writable = true;

    var self = this;

    process.nextTick(function () {
        if (self.readable || self._chunks.length) {
            var hasData = self._chunks.length != 0;

            var chunk;
            while (self.readable && self._chunks.length && !self._wait) {
                chunk = self._chunks.shift();

                if (self.encoding) {
                    self.emit("data", chunk.toString(self.encoding));
                } else {
                    self.emit("data", chunk);
                }
            }

            if (hasData && self._chunks.length == 0) {
                self.emit("drain");
            }

            process.nextTick(arguments.callee);
        }
    });

    if (source instanceof Stream) {
        source.pipe(this);
    } else {
        this.end(source);
    }
}

util.inherits(MockStream, Stream);

MockStream.prototype.setEncoding = function setEncoding(encoding) {
    this.encoding = encoding;
}

MockStream.prototype.pause = function pause() {
    this._wait = true;
    this.emit("pause");
}

MockStream.prototype.resume = function resume() {
    this._wait = false;
    this.emit("resume");
}

MockStream.prototype.write = function write(chunk) {
    if (typeof chunk == "string") {
        chunk = new Buffer(chunk);
    }

    this._chunks.push(chunk);
}

MockStream.prototype.end = function end(chunk) {
    if (chunk) {
        this.write(chunk);
    }

    var self = this;

    this.destroySoon(function () {
        self.emit("end");
    });
}

MockStream.prototype.destroy = function destroy() {
    this._chunks = [];
    this.readable = false;
    this.writable = false;
}

MockStream.prototype.destroySoon = function destroySoon(callback) {
    var self = this;

    process.nextTick(function () {
        if (self._chunks.length == 0) {
            self.destroy();
            if (typeof callback == "function") {
                callback();
            }
        } else {
            process.nextTick(arguments.callee);
        }
    });
}
