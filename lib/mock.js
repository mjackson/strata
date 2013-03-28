var qs = require('querystring');
var Stream = require('stream');
var BufferedStream = require('bufferedstream');
var utils = require('./utils');
var lint = require('./lint');
var mock = module.exports;

/**
 * Returns a mock stream that simply appends all data received to the data
 * property of the given object. Useful for synchronously collecting the
 * contents of streams when testing.
 */
mock.stream = makeStream;
function makeStream(target) {
  target.data = '';

  var stream = new Stream;
  stream.writable = true;
  stream.write = function (chunk, encoding) {
    if (typeof chunk === 'string') {
      target.data += chunk;
    } else if (encoding) {
      target.data += chunk.toString(encoding);
    } else {
      target.data += chunk.toString();
    }
  };

  return stream;
}

/**
 * Creates a mock environment from the given object.
 */
mock.env = makeEnv;
function makeEnv(env) {
  env = env || {};

  // If options is a string it specifies a URL.
  if (typeof env === 'string') {
    var url = utils.parseUrl(env);
    env = {
      protocol: url.protocol,
      serverName: url.hostname,
      serverPort: url.port,
      pathInfo: url.pathname,
      queryString: url.query
    };
  }

  // If params are given they specify GET/POST params.
  if (env.params) {
    if (env.requestMethod === 'POST' || env.requestMethod === 'PUT') {
      env.headers = env.headers || {};
      env.headers['content-type'] = 'application/x-www-form-urlencoded';
      env.input = qs.stringify(env.params);
    } else {
      env.queryString = qs.stringify(env.params);
    }

    delete env.params;
  }

  env.protocol = env.protocol || 'http:';
  env.protocolVersion = env.protocolVersion || '1.1';
  env.requestMethod = env.requestMethod || 'GET';
  env.requestTime = env.requestTime || new Date;
  env.remoteAddr = env.remoteAddr || '';
  env.remotePort = env.remotePort || 0;
  env.serverName = env.serverName || '';
  env.serverPort = env.serverPort || 0;
  env.scriptName = env.scriptName || '';
  env.pathInfo = env.pathInfo || '';
  env.queryString = env.queryString || '';
  env.strataVersion = require('./index').version;

  // Make sure pathInfo is at least "/".
  if (env.scriptName === '' && env.pathInfo === '') {
    env.pathInfo = '/';
  }

  // Normalize header names.
  env.headers = env.headers || {};
  for (var headerName in env.headers) {
    env.headers[headerName.toLowerCase()] = env.headers[headerName];
  }

  if (env.error) {
    if (!(env.error instanceof Stream)) {
      env.error = mock.stream(env.error);
    }
  } else {
    env.error = process.stderr;
  }

  if (env.input) {
    if (!(env.input instanceof Stream)) {
      env.input = new BufferedStream(env.input);
    }
  } else {
    env.input = new BufferedStream('');
  }

  env.input.pause();

  return env;
}

/**
 * Calls the given callback with the result (i.e. any error + status, headers,
 * and body) of sending a mock request to the given app. Automatically buffers
 * the response for convenience.
 */
mock.call = callApp;
function callApp(app, env, callback, returnBuffer) {
  if (env.lint) {
    app = lint(app);
    delete env.lint;
  }

  env = mock.env(env);

  strata.call(app, env, function (status, headers, body) {
    if (body instanceof Stream) {
      utils.bufferStream(body, function (err, buffer) {
        if (buffer && !returnBuffer) buffer = buffer.toString();
        callback(err, status, headers, buffer);
      });
    } else {
      callback(null, status, headers, body);
    }
  });
}
