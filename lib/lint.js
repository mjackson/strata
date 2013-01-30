var Stream = require('stream');
var utils = require('./utils');

/**
 * A middleware that checks the arguments from upstream and downstream apps
 * for conformance with the Strata specification. See SPEC for more information.
 */
module.exports = function (app) {
  function lint(env, callback) {
    assert(arguments.length === 2, 'App must be called with exactly two arguments: environment and callback');

    checkEnv(env);
    checkCallback(callback);

    app(env, function (status, headers, body) {
      assert(arguments.length === 3, 'Callback must be called with exactly three arguments: status, headers, and body');

      checkStatus(status);
      checkHeaders(headers);
      checkBody(body);

      checkContentType(status, headers);
      checkContentLength(status, headers, body);

      callback(status, headers, body);
    });
  }

  return lint;
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function checkEnv(env) {
  assert(typeof env === 'object', 'Environment must be an object');

  [ 'protocol',
    'protocolVersion',
    'requestMethod',
    'remoteAddr',
    'serverName',
    'scriptName',
    'pathInfo',
    'queryString'
  ].forEach(function (p) {
    assert(p in env, 'Environment missing required property "' + p + '"');
    assert(typeof env[p] === 'string', p + ' must be a string');
  });

  [ 'requestTime',
    'remotePort',
    'serverPort',
    'headers',
    'input',
    'error',
    'strataVersion'
  ].forEach(function (p) {
    assert(p in env, 'Environment missing required property "' + p + '"');
  });

  // - protocol          The request protocol. Must be "http:" or "https:"
  assert(['http:', 'https:'].indexOf(env.protocol) !== -1, 'protocol must be either "http:" or "https:"');

  // - requestTime       A Date that indicates the time the request was received
  assert(env.requestTime instanceof Date, 'requestTime must be a Date');

  // - remotePort        The number of the port on the client that is being used.
  //                     May be 0 if unknown
  assert(typeof env.remotePort === 'number', 'remotePort must be a number');

  // - serverPort        The number of the TCP port the server is bound to. May be
  //                     0 when using Unix domain sockets
  assert(typeof env.serverPort === 'number', 'serverPort must be a number');

  // - headers           An object of client-supplied HTTP headers and their values.
  assert(typeof env.headers === 'object', 'headers must be an object');

  // All header names must be lower-cased.
  for (var headerName in env.headers) {
    assert(headerName.toLowerCase() === headerName, headerName + ' header must be lower-cased');
  }

  // - input             A readable Stream of data contained in the request body
  assert(env.input instanceof Stream, 'input must be a Stream');
  assert(env.input.readable, 'input must be readable');

  // - error             A writable Stream for error output
  assert(env.error instanceof Stream, 'error must be a Stream');
  assert(env.error.writable, 'error must be writable');

  // - strataVersion     A string that indicates the current version of strata
  assert(typeof env.strataVersion === 'string', 'strataVersion must be a string');

  // - flash        A string containing the flash message
  var flash = env.flash;
  if (flash) {
    assert(typeof flash === 'string', 'flash must be a string');
  }

  // - remoteUser   A string containing the name of the authorized user when
  var remoteUser = env.remoteUser;
  if (remoteUser) {
    assert(typeof remoteUser === 'string', 'remoteUser must be a string');
  }

  // - route        An object containing information about the route that was
  var route = env.route;
  if (route) {
    assert(typeof route === 'object', 'route must be an object');
  }

  // - session      An object containing session data
  var session = env.session;
  if (session) {
    assert(typeof session === 'object', 'session must be an object');
  }

  // - timeout      The numerical id of the timeout
  var timeout = env.timeout;
  if (timeout) {
    assert(typeof timeout === 'number', 'timeout must be a number');
  }

  // - requestMethod must be a valid HTTP verb as an uppercase String
  assert((/^[A-Z]+$/).test(env.requestMethod), 'requestMethod must be a valid HTTP verb');

  // - scriptName, if not empty, should start with a "/"
  // - pathInfo should be "/" if scriptName is empty
  // - scriptName should never be "/" but instead be empty
  if (env.scriptName !== '') {
    assert(env.scriptName.charAt(0) == '/', 'scriptName must start with "/"');
    assert(env.scriptName !== '/', 'scriptName must not be "/", make it empty and pathInfo "/"');
  }

  // - pathInfo, if not empty, should start with a "/"
  if (env.pathInfo !== '') {
    assert(env.pathInfo.charAt(0) === '/', 'pathInfo must start with "/"');
  }

  // - headers['content-length'], if given, must consist of only digits
  if (env.headers['content-length']) {
    assert(typeof env.headers['content-length'] === 'string', 'content-length header must be a string');
    assert((/^\d+$/).test(env.headers['content-length']), 'content-length header must consist of only digits');
  }

  // - input must be paused
  assert(env.input.paused, 'input must be paused');
}

function checkCallback(callback) {
  // The callback is used to issue a response to the client and must be called with
  // exactly three arguments: the response *status*, the HTTP *headers*, and the
  // *body*.
  assert(typeof callback === 'function', 'Callback must be a function');
  assert(callback.length == 3, 'Callback must accept three arguments');
}

function checkStatus(status) {
  // The status must be an HTTP status code as a Number.
  assert(typeof status === 'number', 'Status must be a number');
  assert(status >= 100 && status < 600, 'Status must be a valid HTTP status code');
}

function checkHeaders(headers) {
  // The headers must be a JavaScript object whose properties are the names of HTTP
  // headers in their canonical form (i.e. "Content-Type" instead of "content-type").
  // Header names may contain only letters, digits, -, and _ and must start with a
  // letter and must not end with a - or _. If more than one value for a header is
  // required, the value for that property must be an array.
  assert(typeof headers === 'object', 'Headers must be an object');

  var value;
  for (var headerName in headers) {
    value = headers[headerName];
    assert(typeof value === 'string' || typeof value === 'number' || Array.isArray(value), 'Header value must be a string, number, or array');
    assert((/^[0-9A-Za-z_-]+$/).test(headerName), 'Invalid header name "' + headerName + '"');
    assert((/^[A-Za-z]/).test(headerName), 'Header name must start with a letter');
    assert(!(/[_-]$/).test(headerName), 'Header name must not end with a "_" or "-"');
  }
}

function checkBody(body) {
  // The body must be either a string or a readable Stream. If it is a Stream, the
  // response will be pumped through to the client.
  assert(typeof body === 'string' || body instanceof Stream, 'Body must be a string or Stream');
}

function checkContentType(status, headers) {
  // There must be a Content-Type header, except for when the status is 1xx, 204, or
  // 304, in which case there must be none given.
  if (utils.isEmptyBodyStatus(status)) {
    assert(!('Content-Type' in headers), 'Content-Type header given for response with no entity body');
  } else {
    assert('Content-Type' in headers, 'Missing Content-Type header');
  }
}

function checkContentLength(status, headers, body) {
  // There must not be a Content-Length header when the status is 1xx, 204, or 304,
  // or it must be "0".
  if (utils.isEmptyBodyStatus(status) && 'Content-Length' in headers) {
    assert(headers['Content-Length'] == '0', 'Non-zero Content-Length header given for response with no entity body');
  }
}
