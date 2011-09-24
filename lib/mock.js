var url = require("url"),
    assert = require("assert"),
    EventEmitter = require("events").EventEmitter,
    strata = require("./index"),
    lint = require("./lint"),
    utils = require("./utils");

exports.env = makeEnv;
exports.request = request;

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
