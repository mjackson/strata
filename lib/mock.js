var url = require('url');
var qs = require('querystring');
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var BufferedStream = require('bufferedstream');
var strata = require('./index');
var lint = require('./lint');

exports.env = makeEnv;
exports.call = call;
exports.stream = stream;

/**
 * A wrapper for `strata.env` that allows a URL string to be given as opts
 * instead of a traditional object. This string will be used for the protocol,
 * serverName, serverPort, pathInfo, and queryString environment variables.
 */
function makeEnv(opts) {
  // If opts is a string it specifies a URL.
  if (typeof opts === 'string') {
    var uri = url.parse(opts);

    opts = {
      protocol: uri.protocol,
      serverName: uri.hostname,
      serverPort: uri.port,
      pathInfo: uri.pathname,
      queryString: uri.query
    };
  }

  opts = opts || {};

  if (opts.params) {
    opts.requestMethod = (opts.requestMethod || 'GET').toUpperCase();

    if (opts.requestMethod === 'POST' || opts.requestMethod === 'PUT') {
      opts.headers = opts.headers || {};
      opts.headers['content-type'] = 'application/x-www-form-urlencoded';
      opts.input = new BufferedStream(qs.stringify(opts.params));
    } else {
      opts.queryString = qs.stringify(opts.params);
    }
  }

  return strata.env(opts);
}

/**
 * Calls the given callback with the result (i.e. any error + status, headers,
 * and body) of sending a mock request to the given app. Creates the
 * environment to use from the given opts (see mock.env). Set `opts.lint` to
 * true to wrap the app in a lint middleware. If the return body is a
 * stream, it is buffered before being passed to the callback.
 */
function call(app, env, callback) {
  if (env.lint) {
    app = lint(app);
    delete env.lint;
  }

  if (typeof env === 'string') {
    env = makeEnv(env);
  }

  strata.call(app, env, function (status, headers, body) {
    if (typeof body === 'string') {
      callback(null, status, headers, body);
      return;
    }

    // Buffer the body of the response for easy async testing.
    var contents = '';

    if (typeof body.resume === 'function') {
      body.resume();
    }

    body.on('data', function (chunk) {
      contents += chunk.toString();
    });

    body.on('end', function () {
      callback(null, status, headers, contents);
    });
  });
}

/**
 * Returns a new FlushingStream that simply appends all data received to the
 * data property of the given object. Useful for collecting the contents of
 * streams when testing.
 */
function stream(obj) {
  obj.data = '';

  var stream = new FlushingStream;

  stream.on('data', function (chunk) {
    obj.data += chunk.toString();
  });

  return stream;
}

/**
 * A subclass of BufferedStream that immediately flushes all writes.
 */
function FlushingStream() {
  BufferedStream.apply(this, arguments);
}

util.inherits(FlushingStream, BufferedStream);

FlushingStream.prototype.write = function () {
  BufferedStream.prototype.write.apply(this, arguments);
  this.flush();
};
