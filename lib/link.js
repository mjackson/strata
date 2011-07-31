var util = require("util"),
    http = require("http"),
    https = require("https"),
    url = require("url"),
    EventEmitter = require("events").EventEmitter,
    utils = require("./link/utils"),
    Input = require("./link/input");

/**
 * The current version of Link as [major, minor, patch].
 */
exports.version = [0, 1, 0];

exports.createServer = createServer;
exports.envFor = envFor;

/**
 * Creates an HTTP server for the given +app+. If +opts+ are supplied, they are
 * used as the options for an HTTPS server. The +app+ should be a valid Link app
 * (see the SPEC), or an object that has a #toApp function that returns an app.
 */
function createServer(app, opts) {
    var server;

    if (typeof opts == "object") {
        server = https.createServer(opts);
    } else {
        server = http.createServer();
    }

    // The app may be any object that has a toApp method (e.g. a Builder).
    if (typeof app.toApp == "function") {
        app = app.toApp();
    }

    if (typeof app != "function") {
        throw new Error("App must be a function");
    }

    server.on("request", function handleRequest(req, res) {
        var addr = server.address();
        var uri = url.parse(req.url);

        uri.protocol = (server instanceof https.Server) ? "https:" : "http:";
        uri.hostname = process.env.SERVER_NAME || addr.address;
        uri.port = (parseInt(process.env.SERVER_PORT, 10) || addr.port).toString(10);

        var env = envFor(uri, {
            protocolVersion: req.httpVersion,
            method: req.method,
            headers: req.headers,
            input: req,
            error: process.stderr
        });

        // Call the app.
        app(env, function handleResponse(status, headers, body) {
            res.writeHead(status, headers);

            if (body instanceof EventEmitter) {
                util.pump(body, res);
            } else {
                res.end(body);
            }
        });
    });

    return server;
}

/**
 * Creates an environment object for the given +uri+, which should be an object
 * with any of the following properties:
 *
 *   - protocol
 *   - hostname
 *   - port
 *   - pathname
 *   - query
 *
 * The +opts+ parameter should be an object with any of the following
 * properties:
 *
 *   - protocolVersion      The HTTP protocol version
 *   - method               The request method (e.g. "GET" or "POST")
 *   - headers              An object of HTTP headers
 *   - input                The input stream of the request body
 *   - error                The error stream
 */
function envFor(uri, opts) {
    uri = uri || {};
    opts = opts || {};

    if (!(opts.input instanceof EventEmitter)) {
        throw new Error("Input must be an EventEmitter");
    }

    var env = {};

    env.protocolVersion = opts.protocolVersion || "1.0";
    env.requestMethod = (opts.method || "GET").toUpperCase();

    env.protocol = uri.protocol || "http:";
    env.serverName = uri.hostname || "";
    env.serverPort = uri.port || (env.protocol == "https:" ? "443": "80");
    env.scriptName = "";
    env.pathInfo = uri.pathname || "";
    env.queryString = uri.query || "";

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

    env["link.version"] = exports.version;
    env["link.input"] = new Input(opts.input);
    env["link.error"] = opts.error || process.stderr;

    return env;
}

// Setup dynamic loading of package contents, accessible by property name.

var propPaths = {
    // Constructors
    "Builder": "link/builder",
    "Input": "link/input",
    "Request": "link/request",
    "Response": "link/response",
    "UploadedFile": "link/uploadedfile",
    // Other
    "commonLogger": "link/commonlogger",
    "contentLength": "link/contentlength",
    "contentType": "link/contenttype",
    "lint": "link/lint",
    "methodOverride": "link/methodoverride",
    "mime": "link/mime",
    "mock": "link/mock",
    "multipart": "link/multipart",
    "querystring": "link/querystring",
    "sessionCookie": "link/session/cookie",
    "static": "link/static",
    "urlMap": "link/urlmap",
    "utils": "link/utils"
};

for (var propertyName in propPaths) {
    exports.__defineGetter__(propertyName, (function (path) {
        return function () {
            return require("./" + path);
        }
    })(propPaths[propertyName]));
}
