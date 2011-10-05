var util = require("util"),
    http = require("http"),
    https = require("https"),
    url = require("url"),
    EventEmitter = require("events").EventEmitter,
    BufferedStream = require("./bufferedstream"),
    utils = require("./utils");

/**
 * The current version of Strata as [major, minor, patch].
 */
exports.version = [0, 5, 14];

exports.run = run;
exports.createServer = createServer;
exports.env = makeEnv;
exports.handleError = handleError;
exports.Error = StrataError;
exports.InvalidRequestBodyError = InvalidRequestBodyError;

/**
 * Creates and runs a server for the given `app` using `opts` (see
 * createServer). Registers the given `callback` on the "listening" event of the
 * server that is created. The `opts` object may contain any properties used to
 * create the server (see `strata.createServer`) and the following:
 *
 *   - host     The host name to accept connections on (defaults to INADDR_ANY)
 *   - port     The port to listen on (defaults to 1982)
 *   - socket   Unix socket file to listen on (trumps host/port)
 */
function run(app, opts, callback) {
    opts = opts || {};

    if (typeof opts == "function") {
        callback = opts;
        opts = null;
    }

    var server = createServer(app, opts);

    server.on("listening", function () {
        console.log(">> Strata web server version " + exports.version.join("."));

        var addr = server.address(),
            msg = "Listening on " + addr.address;

        if (!opts.socket) {
            msg += ":" + addr.port;
        }

        msg += ", CTRL+C to stop";

        console.log(">> " + msg);

        if (typeof callback == "function") {
            callback();
        }
    });

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
 *   - name     The name of the server
 *
 * The `app` should be a valid Strata app (see the SPEC), or an object that has
 * a `toApp` function that returns one (e.g. a strata.Builder).
 */
function createServer(app, opts) {
    opts = opts || {};

    // The app may be any object that has a toApp method (e.g. a Builder).
    if (typeof app.toApp == "function") {
        app = app.toApp();
    }

    if (typeof app != "function") {
        throw new StrataError("App must be a function");
    }

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
    });

    server.on("request", function handleRequest(req, res) {
        var uri = url.parse(req.url);

        var env = makeEnv({
            protocol: protocol,
            protocolVersion: req.httpVersion,
            requestMethod: req.method,
            requestTime: new Date,
            serverName: serverName,
            serverPort: serverPort,
            pathInfo: uri.pathname,
            queryString: uri.query,
            headers: req.headers,
            input: req,
            error: process.stderr
        });

        // Call the app.
        app(env, function handleResponse(status, headers, body) {
            var isEmpty = env.requestMethod == "HEAD" || utils.emptyBody(status);
            var isStream = (body instanceof EventEmitter);

            if (isEmpty) {
                headers["Content-Length"] = "0";
            } else if (isStream && !headers["Content-Length"]) {
                headers["Transfer-Encoding"] = "chunked";
            }

            res.writeHead(status, headers);

            if (isEmpty) {
                res.end();
            } else if (isStream) {
                if (typeof body.resume == "function") {
                    body.resume();
                }

                util.pump(body, res);
            } else {
                res.end(body);
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
    env.error.write("Unhandled error!\n" + err.fullStack);

    var content = "Internal Server Error";

    callback(500, {
        "Content-Type": "text/plain",
        "Content-Length": Buffer.byteLength(content).toString()
    }, content);

    return true;
}

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

// Setup dynamic loading of constructors and middleware, accessible by
// property name.

var propPaths = {
    // Constructors
    "BufferedStream": "bufferedstream",
    "Builder": "builder",
    "Mapper": "mapper",
    "Request": "request",
    "Response": "response",
    "Router": "router",
    // Middleware
    "authBasic": "auth/basic",
    "cascade": "cascade",
    "commonLogger": "commonlogger",
    "contentLength": "contentlength",
    "contentType": "contenttype",
    "directory": "directory",
    "gzip": "gzip",
    "jsonp": "jsonp",
    "lint": "lint",
    "methodOverride": "methodoverride",
    "rewrite": "rewrite",
    "sessionCookie": "session/cookie",
    "static": "static",
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
