var url = require("url"),
    assert = require("assert"),
    EventEmitter = require("events").EventEmitter,
    util = require("util"),
    BufferedStream = require("bufferedstream"),
    strata = require("./index"),
    lint = require("./lint"),
    utils = require("./utils");

exports.request = request;
exports.env = makeEnv;
exports.call = call;
exports.stream = stream;

/**
 * Calls the given `callback` with the result of sending a mock request to the
 * given `app`. Creates the environment to use from the given `opts`. Set
 * `opts.lint` to `true` to wrap the `app` in a lint middleware.
 */
function request(opts, app, callback) {
    opts = opts || {};
    app = app || utils.empty;
    callback = callback || function (status, headers, body) {};

    if (typeof app !== "function") {
        throw new strata.Error("App must be a function");
    }

    if (opts.lint) {
        app = lint(app);
    }

    call(app, makeEnv(opts), callback);
}

/**
 * A wrapper for `strata.env` that allows a URL string to be given as `opts`
 * instead of a traditional object. This string will be used for the protocol,
 * serverName, serverPort, pathInfo, and queryString environment variables.
 */
function makeEnv(opts) {
    opts = opts || {};

    // If opts is a string, it specifies a URL.
    if (typeof opts === "string") {
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
 * Calls the given `app` with the given `env`. Calls the given `callback` with
 * any error, along with the status, headers, and body of the response. If the
 * body is a stream, it is buffered before being passed to the callback.
 */
function call(app, env, callback) {
    strata.call(app, env, function (status, headers, body) {
        if (typeof body === "string") {
            callback(null, status, headers, body);
            return;
        }

        // Buffer the body of the response for easy async testing.
        var contents = "";

        if (typeof body.resume === "function") {
            body.resume();
        }

        body.on("data", function (buffer) {
            contents += buffer.toString("utf8");
        });

        body.on("end", function () {
            callback(null, status, headers, contents);
        });
    });
}

/**
 * Returns a new FlushingStream that simply appends all data received to the
 * `data` property of the given object. Useful for collecting the contents of
 * streams when testing.
 */
function stream(obj) {
    obj.data = "";

    var stream = new FlushingStream;

    stream.on("data", function (chunk) {
        obj.data += chunk.toString();
    });

    return stream;
}

/**
 * A subclass of BufferedStream that immediately flushes all writes.
 */
function FlushingStream() {
    BufferedStream.apply(this, arguments);
}

util.inherits(FlushingStream, BufferedStream);

FlushingStream.prototype.write = function () {
    BufferedStream.prototype.write.apply(this, arguments);
    this.flush();
};
