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
exports.env = makeEnv;

/**
 * Creates an HTTP server for the given +app+. If +opts+ are supplied, they are
 * used as the options for an HTTPS server. The +app+ should be a valid Link app
 * (see the SPEC), or an object that has a #toApp function that returns an app.
 */
function createServer(app, opts) {
    // The app may be any object that has a toApp method (e.g. a Builder).
    if (typeof app.toApp == "function") {
        app = app.toApp();
    }

    if (typeof app != "function") {
        throw new Error("App must be a function");
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
 * Creates an environment object using the given +opts+, which should be an
 * object with any of the following properties:
 *
 *   - protocol             The protocol being used (i.e. "http:" or "https:")
 *   - protocolVersion      The protocol version
 *   - requestMethod        The request method (e.g. "GET" or "POST")
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

    if (!(opts.input instanceof EventEmitter)) {
        throw new Error("Input must be an EventEmitter");
    }

    var env = {};

    env.protocol = opts.protocol || "http:";
    env.protocolVersion = opts.protocolVersion || "1.0";
    env.requestMethod = (opts.requestMethod || "GET").toUpperCase();
    env.serverName = opts.serverName || "";
    env.serverPort = opts.serverPort || (env.protocol == "https:" ? "443": "80");
    env.scriptName = opts.scriptName || "";
    env.pathInfo = opts.pathInfo || "";
    env.queryString = opts.queryString || "";

    if (env.scriptName == "" && env.pathInfo == "") {
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
