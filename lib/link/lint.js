var Stream = require("stream").Stream,
    EventEmitter = require("events").EventEmitter,
    utils = require("./utils");

/**
 * A middleware that checks the environment and callback from upstream and the
 * status, headers, and body from downstream for conformance with the Link
 * specification. See SPEC for more information.
 */
module.exports = function (app) {
    return function lint(env, callback) {
        assert(arguments.length === 2, "App must be called with exactly two arguments: environment and callback");

        checkEnv(env);
        checkCallback(callback);

        app(env, function (status, headers, body) {
            assert(arguments.length === 3, "Callback must be called with exactly three arguments: status, headers, and body");

            checkStatus(status);
            checkHeaders(headers);
            checkBody(body);

            checkContentType(status, headers);
            checkContentLength(status, headers, body);

            callback(status, headers, body);
        });
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function checkEnv(env) {
    assert(typeof env === "object", "Environment must be an object");

    var cgiProperties = [
        "protocolVersion",
        "requestMethod",
        "scriptName",
        "pathInfo",
        "queryString",
        "serverName",
        "serverPort"
    ];

    cgiProperties.forEach(function (property) {
        assert(property in env, 'Environment missing required property "' + property + '"');
        assert(typeof env[property] === "string", 'Property "' + property + '" must be a String');
    });

    // The environment must not contain the properties httpContentType or
    // httpContentLength (use contentType and contentLength instead).
    assert(typeof env["httpContentType"] === "undefined", 'Environment must not contain property "httpContentType", use "contentType" instead');
    assert(typeof env["httpContentLength"] === "undefined", 'Environment must not contain property "httpContentLength", use "contentLength" instead');

    var linkProperties = [
        "link.version",
        "link.urlScheme",
        "link.input",
        "link.error"
    ];

    linkProperties.forEach(function (property) {
        assert(property in env, 'Environment missing required property "' + property + '"');
    });

    // - link.input        An emitter of data contained in the request body.
    assert(env["link.input"] instanceof EventEmitter, "link.input must be an EventEmitter");

    // - link.error        A writable stream for error output.
    assert(env["link.error"] instanceof Stream, "link.error must be a Stream");
    assert(env["link.error"].writable, "link.error must be writable");

    // - link.session      A JavaScript object containing session data.
    var session = env["link.session"];
    if (session) {
        assert(typeof env === "object", "Session must be an object");
    }

    // - link.version must be an array of integers [major, minor, patch].
    assert(Array.isArray(env["link.version"]), "link.version must be an array");
    assert(env["link.version"].length === 3, "link.version must contain three values (major, minor, patch)");
    env["link.version"].forEach(function (n, i) {
        assert(typeof n === "number", "Index " + i + " of link.version must be a number");
    });

    // - link.urlScheme must be either "http" or "https".
    assert(["http", "https"].indexOf(env["link.urlScheme"]) !== -1, 'link.urlScheme must be either "http" or "https"');

    // - contentLength, if given, must consist of digits only.
    if (env.contentLength) {
        assert(typeof env.contentLength === "string", "contentLength must be a string");
        assert((/^\d+$/).test(env.contentLength), "contentLength must consist of digits only");
    }

    // - requestMethod must be a valid token.
    assert((/^[0-9A-Za-z!\#$%&'*+.^_`|~-]+$/).test(env.requestMethod), "Request method must be a valid token");

    // - scriptName, if not empty, should start with a "/".
    // - pathInfo, if not empty, should start with a "/".
    // - Both scriptName and pathInfo must be set. pathInfo should be "/" if
    //   scriptName is empty. scriptName should never be "/" but instead be empty.
    if (env.scriptName !== "") {
        assert(env.scriptName.charAt(0) === "/", 'scriptName must start with a "/"');
        assert(env.scriptName !== "/", 'scriptName cannot be "/", make it empty and pathInfo "/"');
    }
    if (env.pathInfo !== "") {
        assert(env.pathInfo.charAt(0) === "/", 'pathInfo must start with a "/"');
    }
}

function checkCallback(callback) {
    // The callback is used to issue a response to the client and must be called with
    // exactly three arguments: the response *status*, the HTTP *headers*, and the
    // *body*.
    assert(typeof callback === "function", "Callback must be a function");
    assert(callback.length === 3, "Callback must accept three arguments");
}

function checkStatus(status) {
    // The status must be an HTTP status code as a Number.
    assert(typeof status === "number", "Status must be a number");
}

function checkHeaders(headers) {
    // The headers must be a JavaScript object whose properties are the names of HTTP
    // headers in their canonical form (i.e. "Content-Type" instead of "content-type").
    // Header names may contain only letters, digits, -, and _ and must start with a
    // letter and must not end with a - or _. If more than one value for a header is
    // required, the value for that property must be an array.
    assert(typeof headers === "object", "Headers must be an object");

    for (var headerName in headers) {
        assert(typeof headers[headerName] === "string", 'Value for header "' + headerName + '" must be a string');
        assert((/^[0-9A-Za-z_-]+$/).test(headerName), 'Invalid HTTP header name "' + headerName + '"');
        assert((/^[A-Za-z]/).test(headerName), "Header name must start with a letter");
        assert(!(/[_-]$/).test(headerName), 'Header name must not end with a "_" or "-"');
    }
}

function checkBody(body) {
    // The body must be either a string or a readable Stream. If it is a Stream, the
    // response will be pumped through to the client.
    assert(typeof body === "string" || body instanceof Stream, "Body must be a String or Stream");

    if (body instanceof Stream) {
        assert(body.readable, "Stream body must be readable");
    }
}

function checkContentType(status, headers) {
    // There must be a Content-Type header, except for when the status is 1xx, 204, or
    // 304, in which case there must be none given.
    if (utils.STATUS_WITH_NO_ENTITY_BODY.indexOf(status) === -1) {
        assert("Content-Type" in headers, "Missing Content-Type header");
    } else {
        assert(!("Content-Type" in headers), "Content-Type header given for respons with no entity body");
    }
}

function checkContentLength(status, headers, body) {
    // There must not be a Content-Length header when the status is 1xx, 204, or 304.
    if (utils.STATUS_WITH_NO_ENTITY_BODY.indexOf(status) !== -1) {
        assert(!("Content-Length" in headers), "Content-Length header given for respons with no entity body");
    }
}
