var util = require("util"),
    http = require("http"),
    https = require("https"),
    url = require("url"),
    EventEmitter = require("events").EventEmitter,
    UserError = require("usererror"),
    BufferedStream = require("bufferedstream"),
    utils = require("./utils");

/**
 * The current version of Strata as [major, minor, patch].
 */
exports.version = [0, 11, 0];

exports.run = run;
exports.createServer = createServer;
exports.env = makeEnv;
exports.call = call;
exports.handleError = handleError;
exports.Error = StrataError;
exports.InvalidRequestBodyError = InvalidRequestBodyError;

// Setup methods that can be called directly on this module that will delegate
// to the default build/route. This is the high-level sugar API.

var build = require("./build");
var _defaultApp;

function defaultApp() {
    if (_defaultApp == null) {
        _defaultApp = build();
    }

    return _defaultApp;
}

["use", "map", "route", "get", "post", "put", "del", "head", "options"].forEach(function (method) {
    exports[method] = function () {
        var app = defaultApp();
        return app[method].apply(app, arguments);
    };
});

exports.__defineGetter__("app", function () {
    return _defaultApp;
});

/**
 * Creates and starts a server for the given `app` using `opts`. Registers the
 * given `callback` on the "listening" event of the server that is created. The
 * `opts` object may contain any properties used to create the server (see
 * `createServer`) and the following:
 *
 *   - host     The host name to accept connections on (defaults to INADDR_ANY)
 *   - port     The port to listen on (defaults to 1982)
 *   - socket   Unix socket file to listen on (trumps host/port)
 *
 * Returns the newly created server.
 */
function run(app, opts, callback) {
    if (typeof app === "function") {
        // If the user supplies an app here and we already have a _defaultApp
        // configured, then delegate to the _defaultApp.
        if (_defaultApp) {
            _defaultApp.run(app);
            app = _defaultApp;
        }
    } else {
        callback = opts;
        opts = app;
        app = defaultApp(); // Otherwise run the `defaultApp`.
    }

    if (typeof opts === "function") {
        callback = opts;
        opts = null;
    }

    opts = opts || {};

    var server = createServer(app, opts);

    if (typeof callback === "function") {
        server.on("listening", callback);
    }

    if (opts.socket) {
        server.listen(opts.socket);
    } else {
        server.listen(opts.port || 1982, opts.host);
    }

    return server;
}

/**
 * Creates an HTTP server for the given `app`. If `opts` are supplied, they are
 * used as the options for an HTTPS server. It may contain the following
 * properties:
 *
 *   - key      Private key to use for SSL (HTTPS only)
 *   - cert     Public X509 certificate to use (HTTPS only)
 *   - name     The name of the server (defaults to $SERVER_NAME)
 *   - quiet    Set true to prevent the server from writing a startup message
 *              to the console after it starts
 *
 * The `app` should be a valid Strata app (see the SPEC).
 */
function createServer(app, opts) {
    if (typeof app !== "function") {
        throw new StrataError("App must be a function");
    }

    opts = opts || {};

    var server, protocol;
    if (opts.key && opts.cert) {
        server = https.createServer({key: opts.key, cert: opts.cert});
        protocol = "https:";
    } else {
        server = http.createServer();
        protocol = "http:";
    }

    var serverName, serverPort;
    server.on("listening", function () {
        var addr = server.address();

        serverName = opts.name || process.env.SERVER_NAME || addr.address;
        serverPort = (addr.port || "").toString();

        if (opts.quiet) {
            return;
        }

        var msg = ">> Strata web server version " + exports.version.join(".");
        msg += " running on node " + process.versions.node + "\n";
        msg += ">> Listening on " + addr.address;

        if (addr.port) {
            msg += ":" + addr.port;
        }

        msg += ", CTRL+C to stop";

        console.log(msg);
    });

    server.on("request", function (req, res) {
        var uri = url.parse(req.url);
        var env = makeEnv({
            protocol: protocol,
            protocolVersion: req.httpVersion,
            requestMethod: req.method,
            requestTime: new Date,
            remoteAddr: req.connection.remoteAddress,
            remotePort: req.connection.remotePort,
            serverName: serverName,
            serverPort: serverPort,
            pathInfo: uri.pathname,
            queryString: uri.query,
            headers: req.headers,
            input: req,
            error: process.stderr
        });

        call(app, env, function (status, headers, body) {
            res.writeHead(status, headers);

            if (typeof body === "string") {
                if (body == "") {
                    res.end();
                } else {
                    res.end(body);
                }
            } else {
                // Resume the stream in case it's paused.
                if (typeof body.resume === "function") {
                    body.resume();
                }

                util.pump(body, res);
            }
        });
    });

    return server;
}

/**
 * Creates an environment object using the given `opts`, which should be an
 * object with any of the following properties:
 *
 *   - protocol             The protocol being used (i.e. "http:" or "https:")
 *   - protocolVersion      The protocol version
 *   - requestMethod        The request method (e.g. "GET" or "POST")
 *   - requestTime          A Date that indicates the time the request was received
 *   - remoteAddr           The IP address of the client
 *   - remotePort           The port being used on the client machine
 *   - serverName           The host name of the server
 *   - serverPort           The port number the server is listening on
 *   - scriptName           The virtual location of the application
 *   - pathInfo             The path of the request
 *   - queryString          The query string
 *   - headers              An object of HTTP headers
 *   - input                The input stream of the request body
 *   - error                The error stream
 */
function makeEnv(opts) {
    opts = opts || {};

    var env = {};

    env.protocol = opts.protocol || "http:";
    env.protocolVersion = opts.protocolVersion || "1.0";
    env.requestMethod = (opts.requestMethod || "GET").toUpperCase();
    env.requestTime = opts.requestTime || new Date;
    env.remoteAddr = opts.remoteAddr || "";
    env.remotePort = opts.remotePort || "";
    env.serverName = opts.serverName || "";
    env.serverPort = opts.serverPort || "";
    env.scriptName = opts.scriptName || "";
    env.pathInfo = opts.pathInfo || "";
    env.queryString = opts.queryString || "";

    if (env.pathInfo == "" && env.scriptName == "") {
        env.pathInfo = "/";
    }

    if (opts.headers) {
        // Add http* properties for HTTP headers.
        var propName;
        for (var headerName in opts.headers) {
            propName = utils.httpPropertyName(headerName);
            env[propName] = opts.headers[headerName];
        }
    }

    // Set contentType and contentLength.
    env.contentType = env.httpContentType || "";
    delete env.httpContentType;
    env.contentLength = (parseInt(env.httpContentLength, 10) || 0).toString(10);
    delete env.httpContentLength;

    env.input = new BufferedStream(opts.input || "");
    env.error = opts.error || process.stderr;
    env.strataVersion = exports.version;

    return env;
}

/**
 * Calls the given `app` with the given `env` and `callback`. If any error is
 * thrown synchronously, it is caught and passed to `handleError`.
 *
 * IMPORTANT: This does not handle errors that are thrown inside a callback. Any
 * error that occurs inside a callback should pass that object as the first
 * argument to the caller.
 */
function call(app, env, callback) {
    function handleResponse(status, headers, body) {
        if (env.requestMethod == "HEAD" || utils.emptyBody(status)) {
            headers["Content-Length"] = "0";
            body = "";
        } else if (typeof body !== "string" && !headers["Content-Length"]) {
            headers["Transfer-Encoding"] = "chunked";
        }

        callback(status, headers, body);
    }

    try {
        app(env, handleResponse);
    } catch (err) {
        handleError(err, env, handleResponse);
    }
}

/**
 * This is the default global error handler. It simply logs the error to
 * the `env.error` stream and returns a 500 response to the client. Override
 * this function for custom error handling.
 *
 * IMPORTANT: The return value of this function is a boolean that indicates
 * whether or not a response was issued via the given callback. If no response
 * is issued the calling code may assume that the error was successfully
 * recovered and should continue.
 */
function handleError(err, env, callback) {
    var stack = err.fullStack || err.stack;

    if (!stack) {
        // Provide as much information as we can, even though the error
        // doesn't have a proper stack trace.
        stack = (err.name || "Error") + ": " + err.message;
    }

    env.error.write("Unhandled error!\n" + stack + "\n");

    var content = "Internal Server Error";

    callback(500, {
        "Content-Type": "text/plain",
        "Content-Length": Buffer.byteLength(content).toString()
    }, content);

    return true;
}

/**
 * This error is the base class for all errors in Strata.
 */
function StrataError(message, cause) {
    UserError.apply(this, arguments);
}

util.inherits(StrataError, UserError);

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

// Setup dynamic loading of constructors and middleware, accessible by
// property name.

var propPaths = {
    // Constructors
    "Header": "header",
    "Request": "request",
    "Response": "response",
    // Middleware
    "authBasic": "auth/basic",
    "build": "build",
    "cascade": "cascade",
    "commonLogger": "commonlogger",
    "contentLength": "contentlength",
    "contentType": "contenttype",
    "directory": "directory",
    "file": "file",
    "flash": "flash",
    "gzip": "gzip",
    "jsonp": "jsonp",
    "lint": "lint",
    "map": "map",
    "methodOverride": "methodoverride",
    "rewrite": "rewrite",
    "route": "route",
    "sessionCookie": "session/cookie",
    // Other
    "manual": "manual",
    "mock": "mock",
    "multipart": "multipart",
    "querystring": "querystring",
    "redirect": "redirect",
    "utils": "utils"
};

for (var propertyName in propPaths) {
    (function (path) {
        exports.__defineGetter__(propertyName, function () {
            return require("./" + path);
        });
    })(propPaths[propertyName]);
}
