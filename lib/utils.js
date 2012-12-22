var http = require('http');

exports.bufferStream = bufferStream;
function bufferStream(stream, callback) {
  var buffers = [];

  stream.on('data', function (chunk) {
    buffers.push(Buffer.isBuffer(chunk) ? chunk : new Buffer(chunk));
  });

  stream.on('end', function () {
    callback(null, Buffer.concat(buffers));
  });
}

// A map of HTTP status codes to their messages.
var STATUS_CODES = {};
exports.STATUS_CODES = STATUS_CODES;

// A map of HTTP status messages to their codes.
var STATUS_MESSAGES = {};
exports.STATUS_MESSAGES = STATUS_MESSAGES;

var message;
for (var status in http.STATUS_CODES) {
  message = http.STATUS_CODES[status];
  STATUS_CODES[status] = message;
  STATUS_MESSAGES[message] = parseInt(status, 10);
}

// An array of HTTP status codes that indicate no entity body.
var STATUS_WITH_NO_ENTITY_BODY = [100, 101, 204, 304];
exports.STATUS_WITH_NO_ENTITY_BODY = STATUS_WITH_NO_ENTITY_BODY;

/**
 * Returns true if the given status code indicates a response that MUST NOT
 * have any content in the body. See utils.STATUS_WITH_NO_ENTITY_BODY.
 */
exports.isEmptyBodyStatus = isEmptyBodyStatus;
function isEmptyBodyStatus(status) {
  return STATUS_WITH_NO_ENTITY_BODY.indexOf(status) !== -1;
}

// An array of HTTP request method names that indicate a request is read-only.
var SAFE_REQUEST_METHODS = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];
exports.SAFE_REQUEST_METHODS = SAFE_REQUEST_METHODS;

/**
 * Returns true if the given request method is "safe".
 * See utils.SAFE_REQUEST_METHODS.
 */
exports.isSafeRequestMethod = isSafeRequestMethod;
function isSafeRequestMethod(requestMethod) {
  return SAFE_REQUEST_METHODS.indexOf(requestMethod.toUpperCase()) !== -1;
}

/**
 * Converts the given header name to its canonical form.
 *
 * "accept" => "Accept"
 * "content-type" => "Content-Type"
 * "x-forwarded-ssl" => "X-Forwarded-Ssl"
 */
exports.canonicalHeaderName = canonicalHeaderName;
function canonicalHeaderName(name) {
  return name.toLowerCase().replace(/(^|-)([a-z])/g, function (s, a, b) {
    return a + b.toUpperCase();
  });
}

/**
 * Converts the given header name to a string of that name that is
 * capitalized, sans dashes.
 *
 * "accept" => "Accept"
 * "content-type" => "ContentType"
 * "x-forwarded-ssl" => "XForwardedSsl"
 */
exports.capitalizedHeaderName = capitalizedHeaderName;
function capitalizedHeaderName(name) {
  return canonicalHeaderName(name).replace(/-/g, '');
}

/**
 * Converts the given header name to a string that could be used as a
 * JavaScript object property name.
 *
 * "accept" => "accept"
 * "content-type" => "contentType"
 * "x-forwarded-ssl" => "xForwardedSsl"
 */
exports.propertyName = propertyName;
function propertyName(name) {
  var capitalName = capitalizedHeaderName(name)
  return capitalName.substring(0, 1).toLowerCase() + capitalName.substring(1);
}

/**
 * Returns a human-friendly string of the given byte size.
 */
exports.byteSizeFormat = byteSizeFormat;
function byteSizeFormat(size) {
  var tier = size > 0 ? Math.floor(Math.log(size) / Math.log(1024)) : 0;
  var n = size / Math.pow(1024, tier);

  if (tier > 0) {
    n = Math.floor(n * 10) / 10; // Preserve only 1 digit after decimal.
  }

  return String(n) + ['B', 'K', 'M', 'G', 'T'][tier];
}

var escapeMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * Escapes all special HTML characters in the given string.
 */
exports.escapeHtml = escapeHtml;
function escapeHtml(string) {
  return String(string).replace(/[&<>"']/g, function (c) {
    return escapeMap[c];
  });
}

/**
 * Escapes all special regular expression characters in the given string.
 */
exports.escapeRe = escapeRe;
function escapeRe(string) {
  return String(string).replace(/([.?*+^$[\]\\(){}-])/g, '\\$1');
}

/**
 * Compiles the given route string into a RegExp that can be used to match
 * it. The route may contain named keys in the form of a colon followed by a
 * valid JavaScript identifier (e.g. ":name", ":_name", or ":$name" are all
 * valid keys). If it does, these keys will be added to the given keys array.
 *
 * If the route contains the special "*" symbol, it will automatically create a
 * key named "splat" and will substituted with a "(.*?)" pattern in the
 * resulting RegExp.
 */
exports.compileRoute = compileRoute;
function compileRoute(route, keys) {
  var pattern = route.replace(/((:[a-z_$][a-z0-9_$]*)|[*.+()])/ig, function (match) {
    switch (match) {
    case '*':
      keys.push('splat');
      return '(.*?)';
    case '.':
    case '+':
    case '(':
    case ')':
      return escapeRe(match);
    }

    keys.push(match.substring(1));

    return '([^./?#]+)';
  });

  return new RegExp('^' + pattern + '$');
}

/**
 * Returns true if the given obj has no enumerable properties.
 */
exports.isEmptyObject = isEmptyObject;
function isEmptyObject(obj) {
  for (var key in obj) {
    return false;
  }

  return true;
}

/**
 * Compares the length property of a and b. Suitable for use as the
 * return value in an Array.prototype.sort callback.
 */
exports.compareLength = compareLength;
function compareLength(a, b) {
  return (a.length < b.length) ? -1 : (b.length < a.length ? 1 : 0);
}

/**
 * Sorts the given array by the length of its members.
 */
exports.sortByLength = sortByLength;
function sortByLength(array) {
  array.sort(compareLength);
}

function makeResponderForStatus(status) {
  return function (env, callback) {
    var content = STATUS_CODES[status];

    callback(status, {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(content)
    }, content);
  };
}

// A helper for returning a 401 Unauthorized response.
exports.unauthorized = unauthorized;
function unauthorized(env, callback, realm) {
  realm = realm || 'Authorization Required';
  var content = 'Unauthorized';

  callback(401, {
    'Content-Type': 'text/plain',
    'Content-Length': Buffer.byteLength(content),
    'WWW-Authenticate': 'Basic realm="' + realm + '"'
  }, content);
}

// A helper for returning a 404 Not Found response.
exports.notFound = notFound;
function notFound(env, callback) {
  var content = 'Not Found: ' + env.pathInfo;

  callback(404, {
    'Content-Type': 'text/plain',
    'Content-Length': Buffer.byteLength(content)
  }, content);
}

exports.ok = makeResponderForStatus(200);
exports.badRequest = makeResponderForStatus(400);
exports.forbidden = makeResponderForStatus(403);
exports.serverError = makeResponderForStatus(500);
