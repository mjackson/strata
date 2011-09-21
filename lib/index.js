var util = require("util"),
    http = require("http"),
    https = require("https"),
    url = require("url"),
    EventEmitter = require("events").EventEmitter,
    utils = require("./utils"),
    mock = require("./mock");

/**
 * The current version of Strata as [major, minor, patch].
 */
exports.version = [0, 5, 6];

exports.run = run;
exports.createServer = createServer;
exports.env = makeEnv;
exports.Error = StrataError;
exports.handleError = handleError;

/**
 * Creates and runs a server for the given +app+ using +opts+ (see
 * createServer). Registers the given +callback+ on the "listening" event of the
 * server that is created. The +opts+ may contain any of the following
 * properties:
 *
 *   - host     The host name to accept connections to. Defaults to INADDR_ANY
 *   - port     The port to listen on. Defaults to 1982
 *   - socket   Unix socket file to listen on (trumps host/port)
 *   - key      Private key to use for SSL (HTTPS only)
 *   - cert     Public X509 certificate to use (HTTPS only)
 */
function run(app, opts, callback) {
    if (typeof opts == "function") {
        callback = opts;
        opts = null;
    }

    opts = opts || {};
    opts.port = opts.port || 1982;

    var server;
    if (opts.key && opts.cert) {
        server = createServer(app, {key: opts.key, cert: opts.cert});
    } else {
        server = createServer(app);
    }

    if (typeof callback == "function") {
        server.on("listening", callback);
    }

    if (opts.socket) {
        server.listen(opts.socket);
    } else {
        server.listen(opts.port, opts.host);
    }

    return server;
}

/**
 * Creates an HTTP server for the given +app+. If +opts+ are supplied, they are
 * used as the options for an HTTPS server. It may contain the following
 * properties:
 *
 *   - key      Private key to use for SSL (HTTPS only)
 *   - cert     Public X509 certificate to use (HTTPS only)
 *
 * The +app+ should be a valid Strata app (see the SPEC), or an object that has a
 * +toApp+ function that returns an app.
 */
function createServer(app, opts) {
    // The app may be any object that has a toApp method (e.g. a Builder).
    if (typeof app.toApp == "function") {
        app = app.toApp();
    }

    if (typeof app != "function") {
        throw new StrataError("App must be a function");
    }

    var server;
    if (typeof opts == "object") {
        server = https.createServer(opts);
    } else {
        server = http.createServer();
    }

    server.on("request", function handleRequest(req, res) {
        var protocol;
        if (["yes", "on", "1"].indexOf(process.env.HTTPS) != -1) {
            protocol = "https:";
        } else {
            protocol = (server instanceof https.Server) ? "https:" : "http:";
        }

        var addr = server.address();
        var serverName = process.env.SERVER_NAME || addr.address;
        var serverPort = (parseInt(process.env.SERVER_PORT, 10) || addr.port).toString(10);

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
            res.writeHead(status, headers);

            if (env.requestMethod == "HEAD") {
                res.end();
            } else if (body instanceof EventEmitter) {
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
 * Creates an environment object using the given +opts+, which should be an
 * object with any of the following properties:
 *
 *   - protocol             The protocol being used (i.e. "http:" or "https:")
 *   - protocolVersion      The protocol version
 *   - requestMethod        The request method (e.g. "GET" or "POST")
 *   - requestTime          A Date that indicates the time the request was received
 *   - serverName           The host name of the server
 *   - serverPort           The port number the request was made on
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
    env.serverPort = opts.serverPort || (env.protocol == "https:" ? "443" : "80");
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

    env.strataVersion = exports.version;
    env.input = new mock.Stream(opts.input || "");
    env.error = opts.error || process.stderr;

    return env;
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

Error.prototype.__defineGetter__("fullStack", function fullStack() {
    return this.stack;
});

StrataError.prototype.__defineGetter__("fullStack", function fullStack() {
    var stack = this.stack;

    if (this.cause) {
        stack += "\nCaused by " + this.cause.fullStack;
    }

    return stack;
});

/**
 * The default error handler simply logs the error stack to env.error and
 * returns a 500 response. Override this function for custom error handling.
 *
 * IMPORTANT: The return value of this function is a boolean that indicates
 * whether or not a response was issued via the given callback. If no response
 * is issued the calling code may assume that the error was successfully
 * recovered and should continue.
 */
function handleError(error, env, callback) {
    env.error.write("Unhandled error!\n" + error.fullStack);

    var message = "Internal Server Error";

    callback(500, {
        "Content-Type": "text/plain",
        "Content-Length": Buffer.byteLength(message).toString()
    }, message);

    return true;
}

// Setup dynamic loading of constructors and middleware, accessible by
// property name.

var propPaths = {
    // Constructors
    "Builder": "builder",
    "Mapper": "mapper",
    "Request": "request",
    "Response": "response",
    "Router": "router",
    // Middleware
    "authBasic": "auth/basic",
    "commonLogger": "commonlogger",
    "contentLength": "contentlength",
    "contentType": "contenttype",
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
