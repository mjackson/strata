var util = require('util');
var http = require('http');
var https = require('https');
var url = require('url');
var EventEmitter = require('events').EventEmitter;
var Stream = require('stream');
var BufferedStream = require('bufferedstream');
var utils = require('./utils');
var strata = module.exports;

// The current version of Strata.
strata.version = '0.20.1';

// The default port that Strata servers run on.
strata.defaultPort = 1982;

/**
 * The maximum amount of data that is buffered from incoming requests before
 * pausing the underlying connection stream. This is necessary to prevent
 * buffering indefinitely which would leave us open to DOS attacks.
 *
 * This value should be fairly small. In almost all cases where the server is
 * expecting a large request body it will start reading from the input stream
 * very soon after the request is received and the buffer will be emptied.
 */
strata.maxBufferSize = 1024 * 2; // 2K

// Setup methods that can be called directly on this module that will delegate
// to the default build. This is the high-level sugar API.
var build = require('./build');
var _defaultApp;

function defaultApp() {
  if (_defaultApp == null) {
    _defaultApp = build();
  }

  return _defaultApp;
}

['use', 'map', 'route', 'get', 'post', 'put', 'delete', 'head', 'options'].forEach(function (method) {
  strata[method] = function () {
    var app = defaultApp();
    return app[method].apply(app, arguments);
  };
});

strata.__defineGetter__('app', function () {
  return _defaultApp;
});

/**
 * Creates and starts a server for the given app. If an opts object is
 * given it may contain any properties used to create and start the server
 * (see createServer and startServer).
 */
strata.run = run;
function run(app, opts, listeningListener) {
  if (typeof app === 'function') {
    // If the user supplies an app here and we already have a _defaultApp
    // configured, then delegate to the _defaultApp.
    if (_defaultApp && _defaultApp !== app) {
      _defaultApp.run(app);
      app = _defaultApp;
    }
  } else {
    listeningListener = opts;
    opts = app;
    app = defaultApp(); // Run the _defaultApp.
  }

  if (typeof opts === 'function') {
    listeningListener = opts;
    opts = null;
  }

  opts = opts || {};

  var server = createServer(opts);
  bind(app, server);
  startServer(server, opts, listeningListener);

  return server;
}

/**
 * Creates an HTTP server. If an opts object is given, it may contain any of
 * the following properties:
 *
 *   - key    Private key to use for SSL (HTTPS only)
 *   - cert   Public X509 certificate to use (HTTPS only)
 *
 * If given, the requestListener callback is bound to the "request" event
 * of the server.
 */
strata.createServer = createServer;
function createServer(opts, requestListener) {
  if (typeof opts === 'function') {
    requestListener = opts;
    opts = null;
  }

  opts = opts || {};

  var server;
  if (opts.key && opts.cert) {
    server = https.createServer({ key: opts.key, cert: opts.cert });
  } else {
    server = http.createServer();
  }

  if (typeof requestListener === 'function') {
    server.on('request', requestListener);
  }

  return server;
}

/**
 * Starts the given server. The given opts object may contain any of the
 * following properties:
 *
 *   - host   The host name to accept connections on (defaults to INADDR_ANY)
 *   - port   The port to listen on (defaults to strata.defaultPort)
 *   - socket Unix socket file to listen on (trumps host/port)
 *   - quiet  Set true to prevent the server from writing a startup message
 *        to the console after it starts
 *
 * If given, the listeningListener callback is bound to the "listening" event
 * of the server.
 */
strata.startServer = startServer;
function startServer(server, opts, listeningListener) {
  if (typeof opts === 'function') {
    listeningListener = opts;
    opts = null;
  }

  opts = opts || {};

  if (!opts.quiet) {
    server.on('listening', function () {
      var addr = server.address();

      var msg = '>> Strata web server version ' + strata.version;
      msg += ' running on node ' + process.versions.node + '\n';
      msg += '>> Listening on ' + addr.address;

      if (addr.port) {
        msg += ':' + addr.port;
      }

      msg += ', CTRL+C to stop';

      console.log(msg);
    });
  }

  if (typeof listeningListener === 'function') {
    server.on('listening', listeningListener);
  }

  if (opts.socket) {
    server.listen(opts.socket);
  } else {
    server.listen(opts.port || strata.defaultPort, opts.host);
  }
}

/**
 * Binds the given app to be called whenever the given server receives a
 * new request.
 */
strata.bind = bind;
function bind(app, server) {
  var protocol;
  if (server instanceof https.Server) {
    protocol = 'https:';
  } else {
    protocol = 'http:';
  }

  var serverName, serverPort;
  server.on('listening', function () {
    var addr = server.address();
    serverName = process.env.SERVER_NAME || addr.address;
    serverPort = String(addr.port || '');
  });

  server.on('request', function (req, res) {
    var uri = url.parse(req.url);
    var env = makeEnv({
      protocol: protocol,
      protocolVersion: req.httpVersion,
      requestMethod: req.method,
      requestTime: new Date,
      remoteAddr: req.connection.remoteAddress,
      remotePort: req.connection.remotePort,
      serverName: serverName,
      serverPort: serverPort,
      pathInfo: uri.pathname,
      queryString: uri.query,
      headers: req.headers,
      input: req,
      error: process.stderr
    });

    call(app, env, function (status, headers, body) {
      res.writeHead(status, headers);

      if (body instanceof Stream) {
        body.pipe(res);
      } else {
        if (body === '') {
          res.end();
        } else {
          res.end(body);
        }
      }

      // Since we pause the input stream on the way in we need to make sure it
      // has a chance to emit all its data. Otherwise, when backed by a node
      // http.ServerRequest, node's event loop will wait indefinitely for it to
      // finish emitting data.
      // See https://github.com/mjijackson/bufferedstream/pull/3#issuecomment-9203538
      env.input.removeAllListeners();
      env.input.resume();
    });
  });
}

/**
 * Creates an environment object using the given opts, which should be an
 * object with any of the following properties:
 *
 *   - protocol         The protocol being used (i.e. "http:" or "https:")
 *   - protocolVersion  The protocol version
 *   - requestMethod    The request method (e.g. "GET" or "POST")
 *   - requestTime      A Date that indicates the time the request was received
 *   - remoteAddr       The IP address of the client
 *   - remotePort       The port number being used on the client machine
 *   - serverName       The host name of the server
 *   - serverPort       The port number the server is listening on
 *   - scriptName       The virtual location of the application
 *   - pathInfo         The path of the request
 *   - queryString      The query string
 *   - headers          An object of HTTP headers and values
 *   - input            The input stream of the request body
 *   - error            The error stream
 */
strata.env = makeEnv;
function makeEnv(opts) {
  opts = opts || {};

  var env = {};

  env.protocol = opts.protocol || 'http:';
  env.protocolVersion = opts.protocolVersion || '1.0';
  env.requestMethod = (opts.requestMethod || 'GET').toUpperCase();
  env.requestTime = opts.requestTime || new Date;
  env.remoteAddr = opts.remoteAddr || '';
  env.remotePort = parseInt(opts.remotePort, 10) || 0;
  env.serverName = opts.serverName || '';
  env.serverPort = parseInt(opts.serverPort, 10) || 0;
  env.scriptName = opts.scriptName || '';
  env.pathInfo = opts.pathInfo || '';

  if (env.pathInfo === '' && env.scriptName === '') {
    env.pathInfo = '/';
  }

  env.queryString = opts.queryString || '';
  env.headers = {};

  if (opts.headers) {
    for (var headerName in opts.headers) {
      env.headers[headerName.toLowerCase()] = opts.headers[headerName];
    }
  }

  // Buffer the input stream up to the size specified in strata.maxBufferSize.
  env.input = new BufferedStream(strata.maxBufferSize, opts.input || '');

  // The input stream is paused so that we don't miss any data events that
  // are registered on future ticks.
  env.input.pause();

  if (opts.error) {
    if (opts.error instanceof Stream) {
      env.error = opts.error;
    } else {
      throw new Error('Environment error must be a Stream');
    }
  } else {
    env.error = process.stderr;
  }

  env.strataVersion = strata.version;

  return env;
}

/**
 * Calls the given app (must be a valid strata app, see the SPEC) with the
 * given env and callback. If any error is thrown synchronously, it is
 * caught and passed to handleError.
 *
 * IMPORTANT: This does not handle errors that are thrown inside a callback. Any
 * error that occurs inside a callback should pass that object as the first
 * argument to the caller.
 */
strata.call = call;
function call(app, env, callback) {
  if (typeof app !== 'function') {
    throw new Error('App must be a function');
  }

  function handleResponse(status, headers, body) {
    var isEmptyBody = utils.isEmptyBodyStatus(status);

    // Automatically set Transfer-Encoding header for non-empty stream bodies.
    if (!isEmptyBody && typeof body !== 'string' && !headers['Content-Length']) {
      headers['Transfer-Encoding'] = 'chunked';
    }

    // HEAD requests should always return an empty body.
    if (env.requestMethod === 'HEAD') {
      body = '';
    }

    if (typeof body.resume === 'function') {
      body.resume();
    }

    callback(status, headers, body);
  }

  try {
    app(env, handleResponse);
  } catch (err) {
    handleError(err, env, handleResponse);
  }
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
strata.handleError = handleError;
function handleError(err, env, callback) {
  var stack = err.fullStack || err.stack;

  if (!stack) {
    // Provide as much information as we can, even though the error
    // doesn't have a proper stack trace.
    stack = (err.name || 'Error') + ': ' + err.message;
  }

  env.error.write('There was an unhandled error!\n' + stack + '\n');

  utils.serverError(env, callback);

  return true;
}

// Setup dynamic loading of modules, accessible by property name.

var modules = {
  // Constructors
  'Accept': 'header/accept',
  'AcceptCharset': 'header/accept-charset',
  'AcceptEncoding': 'header/accept-encoding',
  'AcceptLanguage': 'header/accept-language',
  'Header': 'header',
  'Request': 'request',
  'Response': 'response',
  // Middleware
  'authenticityToken': 'authenticity-token',
  'basicAuth': 'basic-auth',
  'build': 'build',
  'cascade': 'cascade',
  'commonLogger': 'common-logger',
  'contentLength': 'content-length',
  'contentType': 'content-type',
  'directory': 'directory',
  'file': 'file',
  'flash': 'flash',
  'gzip': 'gzip',
  'jsonp': 'jsonp',
  'lint': 'lint',
  'methodOverride': 'method-override',
  'rewrite': 'rewrite',
  'router': 'router',
  'sessionCookie': 'session-cookie',
  'timeout': 'timeout',
  'urlMap': 'urlmap',
  // Other
  'manual': 'manual',
  'mock': 'mock',
  'multipart': 'multipart',
  'redirect': 'redirect',
  'utils': 'utils'
};

for (var propertyName in modules) {
  (function (path) {
    strata.__defineGetter__(propertyName, function () {
      return require('./' + path);
    });
  })(modules[propertyName]);
}
