var Stream = require("stream").Stream,
    EventEmitter = require("events").EventEmitter,
    strata = require("./index"),
    utils = require("./utils");

/**
 * A middleware that checks the arguments from upstream and downstream apps
 * for conformance with the Strata specification. See SPEC for more information.
 */
module.exports = function (app) {
    return function lint(env, callback) {
        assert(arguments.length == 2, "App must be called with exactly two arguments: environment and callback");

        checkEnv(env);
        checkCallback(callback);

        app(env, function (status, headers, body) {
            assert(arguments.length == 3, "Callback must be called with exactly three arguments: status, headers, and body");

            checkStatus(status);
            checkHeaders(headers);
            checkBody(body);

            checkContentType(status, headers);
            checkContentLength(status, headers, body);

            callback(status, headers, body);
        });
    }
};

function assert(condition, message) {
    if (!condition) {
        throw new strata.Error(message);
    }
}

function checkEnv(env) {
    assert(typeof env === "object", "Environment must be an object");

    var requiredStringProperties = [
        "protocol",
        "protocolVersion",
        "requestMethod",
        "remoteAddr",
        "remotePort",
        "serverName",
        "serverPort",
        "scriptName",
        "pathInfo",
        "queryString"
    ];

    requiredStringProperties.forEach(function (p) {
        assert(p in env, 'Environment missing required property "' + p + '"');
        assert(typeof env[p] === "string", 'Property "' + p + '" must be a string');
    });

    assert("requestTime" in env, 'Environment missing required property "requestTime"');
    assert(env.requestTime instanceof Date, 'requestTime must be a Date');

    // The environment must not contain the properties httpContentType or
    // httpContentLength (use contentType and contentLength instead).
    assert(typeof env.httpContentType === "undefined", 'Environment must not contain property "httpContentType", use "contentType" instead');
    assert(typeof env.httpContentLength === "undefined", 'Environment must not contain property "httpContentLength", use "contentLength" instead');

    var requiredStrataProperties = [
        "input",
        "error",
        "strataVersion"
    ];

    requiredStrataProperties.forEach(function (p) {
        assert(p in env, 'Environment missing required property "' + p + '"');
    });

    // - protocol must be either "http:" or "https:"
    assert(["http:", "https:"].indexOf(env.protocol) != -1, 'protocol must be either "http:" or "https:"');

    // - requestMethod must be a valid HTTP verb as an uppercase String
    assert((/^[A-Z]+$/).test(env.requestMethod), "Request method must be a valid HTTP verb");

    // - requestTime must be a Date
    assert(env.requestTime instanceof Date, "Request time must be a Date");

    // - scriptName, if not empty, should start with a "/"
    // - pathInfo should be "/" if scriptName is empty
    // - scriptName should never be "/" but instead be empty
    if (env.scriptName !== "") {
        assert(env.scriptName.charAt(0) == "/", 'scriptName must start with "/"');
        assert(env.scriptName !== "/", 'scriptName must not be "/", make it empty and pathInfo "/"');
    }

    // - pathInfo, if not empty, should start with a "/"
    if (env.pathInfo !== "") {
        assert(env.pathInfo.charAt(0) === "/", 'pathInfo must start with "/"');
    }

    // - contentLength, if given, must consist of digits only
    if (env.contentLength) {
        assert(typeof env.contentLength === "string", "contentLength must be a string");
        assert((/^\d+$/).test(env.contentLength), "contentLength must consist of digits only");
    }

    // - input must be a readable Stream
    assert(env.input instanceof Stream, "input must be a Stream");
    assert(env.input.readable, "input must be readable");

    // - error must be a writable Stream
    // TODO: process.stderr is not a true Stream!
    assert(env.error instanceof EventEmitter, "error must be a Stream");
    assert(env.error.writable, "error must be writable");

    // - session      An object containing session data
    var session = env.session;
    if (session) {
        assert(typeof env === "object", "session must be an object");
    }

    // - strataVersion must be an array of integers
    assert(Array.isArray(env.strataVersion), "strataVersion must be an array");
    assert(env.strataVersion.length == 3, "strataVersion must contain three values [major, minor, patch]");
    env.strataVersion.forEach(function (n, i) {
        assert(typeof n === "number", "Index " + i + " of strataVersion must be a number");
    });
}

function checkCallback(callback) {
    // The callback is used to issue a response to the client and must be called with
    // exactly three arguments: the response *status*, the HTTP *headers*, and the
    // *body*.
    assert(typeof callback === "function", "Callback must be a function");
    assert(callback.length == 3, "Callback must accept three arguments");
}

function checkStatus(status) {
    // The status must be an HTTP status code as a Number.
    assert(typeof status === "number", "Status must be a number");
    assert(status >= 100 && status < 600, "Status must be a valid HTTP status code");
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
        assert((/^[0-9A-Za-z_-]+$/).test(headerName), 'Invalid header name "' + headerName + '"');
        assert((/^[A-Za-z]/).test(headerName), "Header name must start with a letter");
        assert(!(/[_-]$/).test(headerName), 'Header name must not end with a "_" or "-"');
    }
}

function checkBody(body) {
    // The body must be either a string or a readable Stream. If it is a Stream, the
    // response will be pumped through to the client.
    assert(typeof body === "string" || body instanceof EventEmitter, "Body must be a string or Stream");
}

function checkContentType(status, headers) {
    // There must be a Content-Type header, except for when the status is 1xx, 204, or
    // 304, in which case there must be none given.
    if (utils.STATUS_WITH_NO_ENTITY_BODY.indexOf(status) == -1) {
        assert("Content-Type" in headers, "Missing Content-Type header");
    } else {
        assert(!("Content-Type" in headers), "Content-Type header given for respons with no entity body");
    }
}

function checkContentLength(status, headers, body) {
    // There must not be a Content-Length header when the status is 1xx, 204, or 304,
    // or it must be "0".
    if (utils.STATUS_WITH_NO_ENTITY_BODY.indexOf(status) != -1 && "Content-Length" in headers) {
        assert(headers["Content-Length"] == "0", "Non-zero Content-Length header given for respons with no entity body");
    }
}
