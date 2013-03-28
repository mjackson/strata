var http = require('http');
var https = require('https');
var Stream = require('stream');
var utils = require('./utils');
var strata = module.exports;

/**
 * The current version of Strata.
 */
strata.version = '0.20.1';

/**
 * The default port that Strata binds to.
 */
strata.defaultPort = 1982;

/**
 * The timeout to use when gracefully shutting down servers that are started
 * using strata.serve. If a server doesn't close within this time (probably
 * because it has open persistent connections) the process exits.
 */
strata.shutdownTimeout = 30000;

/**
 * Binds the given app to the "request" event of the given server so that it
 * is called whenever the server receives a new request.
 */
strata.bind = bindAppToNodeServer;
function bindAppToNodeServer(app, nodeServer) {
  var address = nodeServer.address();

  if (!address) {
    throw new Error('Cannot bind to server that is not listening');
  }

  var protocol;
  if (nodeServer instanceof https.Server) {
    protocol = 'https:';
  } else {
    protocol = 'http:';
  }

  var serverName, serverPort;
  if (typeof address === 'string') {
    serverName = address;
    serverPort = 0;
  } else {
    serverName = address.address;
    serverPort = address.port;
  }

  nodeServer.on('request', function (nodeRequest, nodeResponse) {
    var env = makeEnv(nodeRequest, protocol, serverName, serverPort);

    strata.call(app, env, function (status, headers, body) {
      nodeResponse.writeHead(status, headers);

      if (body instanceof Stream) {
        body.pipe(nodeResponse);
      } else if (body) {
        nodeResponse.end(body);
      } else {
        nodeResponse.end();
      }
    });
  });
}

function makeEnv(nodeRequest, protocol, serverName, serverPort) {
  var url = utils.parseUrl(nodeRequest.url);
  return {
    protocol: protocol,
    protocolVersion: nodeRequest.httpVersion,
    requestMethod: nodeRequest.method,
    requestTime: new Date,
    remoteAddr: nodeRequest.connection.remoteAddress,
    remotePort: nodeRequest.connection.remotePort,
    serverName: serverName,
    serverPort: serverPort,
    scriptName: '',
    pathInfo: url.pathname || '/',
    queryString: url.query || '',
    headers: nodeRequest.headers,
    input: nodeRequest,
    error: process.stderr
  };
}

/**
 * Creates and starts a node HTTP server that serves the given app. Options may
 * be any of the following:
 *
 *   - host     The host name to accept connections on (defaults to INADDR_ANY)
 *   - port     The port to listen on (defaults to strata.defaultPort)
 *   - socket   Unix socket file to listen on (trumps host/port)
 *   - quiet    Set true to prevent the server from writing startup/shutdown
 *              messages to the console
 *   - key      Private key to use for SSL (HTTPS only)
 *   - cert     Public X509 certificate to use (HTTPS only)
 *
 * Returns the newly created HTTP server instance.
 */
strata.serve = serveApp;
function serveApp(app, options) {
  options = options || {};

  if (typeof options === 'number') {
    options = { port: options };
  } else if (typeof options === 'string') {
    options = { socket: options };
  }

  var nodeServer;
  if (options.key && options.cert) {
    nodeServer = https.createServer({ key: options.key, cert: options.cert });
  } else {
    nodeServer = http.createServer();
  }

  function shutdown() {
    process.removeListener('SIGINT', shutdown);
    process.removeListener('SIGTERM', shutdown);

    if (!options.quiet) console.log('>> Shutting down...');

    var timer = setTimeout(function () {
      if (!options.quiet) console.log('>> Exiting');
      process.exit(1);
    }, strata.shutdownTimeout);

    nodeServer.close(function () {
      clearTimeout(timer);
    });
  }

  nodeServer.on('listening', function () {
    strata.bind(app, nodeServer);

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    if (!options.quiet) {
      var address = nodeServer.address();
      var message = '>> strata web server version ' + strata.version + ' started on node ' + process.versions.node + '\n';

      if (typeof address === 'string') {
        message += '>> Listening on ' + address;
      } else {
        message += '>> Listening on ' + address.address;
        if (address.port) message += ':' + address.port;
      }

      message += ', use CTRL+C to stop';

      console.log(message);
    }
  });

  if (options.socket) {
    nodeServer.listen(options.socket);
  } else {
    nodeServer.listen(options.port || strata.defaultPort, options.host);
  }

  return nodeServer;
}

/**
 * Calls the given app with the given env and callback. If any error is thrown
 * synchronously, it is caught and passed to handleError.
 *
 * IMPORTANT: This does not handle errors that are thrown inside a callback.
 * Any error that occurs inside a callback should pass that object as the first
 * argument to the caller.
 */
strata.call = callApp;
function callApp(app, env, callback) {
  function responseHandler(status, headers, body) {
    var isHead = env.requestMethod === 'HEAD';
    var isEmpty = isHead || utils.isEmptyBodyStatus(status);

    if (isEmpty) {
      // Preserve the Content-Length header on HEAD requests.
      if (!isHead) {
        response.headers['Content-Length'] = 0;
      }

      // Cleanup open file descriptors.
      if (body && typeof body.destroy === 'function') {
        body.destroy();
      }

      body = '';
    }

    callback(status, headers, body);
  }

  try {
    app(env, responseHandler);
  } catch (err) {
    handleError(err, env, responseHandler);
  }
}

/**
 * The default global error handler. It simply logs the error to the `env.error`
 * stream and returns a 500 response to the client. Override this function for
 * custom error handling.
 *
 * IMPORTANT: The return value of this function is a boolean that indicates
 * whether or not a response was issued via the given callback. If no response
 * is issued the calling code may assume that the error was successfully
 * recovered and should continue processing the request.
 */
strata.handleError = handleError;
function handleError(err, env, callback) {
  var stack = err.fullStack || err.stack;

  if (!stack) {
    // Provide as much information as we can, even though the error
    // doesn't have a proper stack trace.
    stack = (err.name || 'Error') + ': ' + err.message;
  }

  env.error.write(stack + '\n');
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
