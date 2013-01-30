var path = require('path');
var qs = require('querystring');
var multipart = require('./multipart');
var utils = require('./utils');
var Accept = require('./header/accept');
var AcceptCharset = require('./header/accept-charset');
var AcceptEncoding = require('./header/accept-encoding');
var AcceptLanguage = require('./header/accept-language');

module.exports = Request;

/**
 * Provides a convenient interface to the application environment and various
 * properties of the request. This class is stateless, and directly modifies
 * the env provided in the constructor.
 */
function Request(env) {
  if (!(this instanceof Request)) {
    return new Request(env);
  }

  this.env = env;
}

/**
 * The set of form-data media types. Requests that indicate one of these media
 * types were most likely made using an HTML form.
 */
Request.FORM_DATA_MEDIA_TYPES = [
  'application/x-www-form-urlencoded',
  'multipart/form-data'
];

/**
 * The set of parseable media types. Requests that indicate one of these media
 * types should be able to be parsed automatically.
 */
Request.PARSEABLE_DATA_MEDIA_TYPES = [
  'multipart/related',
  'multipart/mixed',
  'application/json'
];

/**
 * The protocol used in the request (i.e. "http:" or "https:").
 */
Request.prototype.__defineGetter__('protocol', function () {
  if (this.env.headers['x-forwarded-ssl'] === 'on') {
    return 'https:';
  } else if (this.env.headers['x-forwarded-proto']) {
    return this.env.headers['x-forwarded-proto'].split(',')[0] + ':';
  }

  return this.env.protocol;
});

/**
 * The version of the protocol used in the request.
 */
Request.prototype.__defineGetter__('protocolVersion', function () {
  return this.env.protocolVersion;
});

/**
 * The HTTP method used in the request.
 */
Request.prototype.__defineGetter__('method', function () {
  return this.env.requestMethod;
});

/**
 * The time the request was received by the server.
 */
Request.prototype.__defineGetter__('time', function () {
  return this.env.requestTime;
});

/**
 * The IP address of the client.
 */
Request.prototype.__defineGetter__('remoteAddr', function () {
  if (this.env.headers['x-forwarded-for']) {
    return this.env.headers['x-forwarded-for'];
  }

  return this.env.remoteAddr;
});

/**
 * The port number the client machine is using.
 */
Request.prototype.__defineGetter__('remotePort', function () {
  return this.env.remotePort;
});

/**
 * The name of the virtual location of the current request within the context of
 * the rest of the application.
 */
Object.defineProperty(Request.prototype, 'scriptName', {
  enumerable: true,
  set: function (value) {
    this.env.scriptName = value;
  },
  get: function () {
    return this.env.scriptName;
  }
});

/**
 * The remainder of the request URL's path.
 */
Object.defineProperty(Request.prototype, 'pathInfo', {
  enumerable: true,
  set: function (value) {
    this.env.pathInfo = value;
  },
  get: function () {
    return this.env.pathInfo;
  }
});

/**
 * The query string that was used in the URL.
 */
Object.defineProperty(Request.prototype, 'queryString', {
  enumerable: true,
  set: function (value) {
    this.env.queryString = value;
  },
  get: function () {
    return this.env.queryString;
  }
});

/**
 * The media type (type/subtype) portion of the Content-Type header without any
 * media type parameters. e.g., when Content-Type is "text/plain;charset=utf-8",
 * the mediaType is "text/plain".
 *
 * For more information on the use of media types in HTTP, see:
 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.7
 */
Request.prototype.__defineGetter__('mediaType', function () {
  var contentType = this.contentType;
  return contentType && contentType.split(/\s*[;,]\s*/)[0].toLowerCase();
});

/**
 * Returns true if this request was made over SSL, false otherwise.
 */
Request.prototype.__defineGetter__('ssl', function () {
  return this.protocol === 'https:';
});

/**
 * Returns true if this request was made via XMLHttpRequest as indicated by
 * the X-Requested-With header, false otherwise.
 */
Request.prototype.__defineGetter__('xhr', function () {
  return this.env.headers['x-requested-with'] === 'XMLHttpRequest';
});

Request.prototype.__defineGetter__('hostWithPort', function () {
  var forwarded = this.env.headers['x-forwarded-host'];

  if (forwarded) {
    var parts = forwarded.split(/,\s?/);
    return parts[parts.length - 1];
  } else if (this.env.headers['host']) {
    return this.env.headers['host'];
  } else if (this.env.serverPort) {
    return this.env.serverName + ':' + this.env.serverPort;
  }

  return this.env.serverName;
});

/**
 * Returns the name of the host used in this request.
 */
Request.prototype.__defineGetter__('host', function () {
  return this.hostWithPort.replace(/:\d+$/, '');
});

/**
 * Returns the port number used in this request.
 */
Request.prototype.__defineGetter__('port', function () {
  var port = this.hostWithPort.split(':')[1] || this.env.headers['x-forwarded-port'];

  if (port) {
    return parseInt(port, 10);
  } else if (this.ssl) {
    return 443;
  } else if (this.env.headers['x-forwarded-host']) {
    return 80;
  }

  return this.env.serverPort;
});

/**
 * Returns a URL containing the protocol, hostname, and port of the original
 * request.
 */
Request.prototype.__defineGetter__('baseUrl', function () {
  var protocol = this.protocol;
  var url = protocol + '//' + this.host;
  var port = this.port;

  if ((protocol === 'https:' && port !== 443) || (protocol === 'http:' && port !== 80)) {
    url += ':' + port;
  }

  return url;
});

/**
 * The path of this request, without the query string.
 */
Request.prototype.__defineGetter__('path', function () {
  return this.scriptName + this.pathInfo;
});

/**
 * The path of this request, including the query string.
 */
Request.prototype.__defineGetter__('fullPath', function () {
  var queryString = this.queryString;

  if (queryString == '') {
    return this.path;
  }

  return this.path + '?' + queryString;
});

/**
 * Attempts to reconstruct the original URL of this request.
 */
Request.prototype.__defineGetter__('url', function () {
  return this.baseUrl + this.fullPath;
});

/**
 * Returns true if this request indicates the client accepts the given
 * mediaType.
 */
Request.prototype.accepts = function (mediaType) {
  if (!this.env.strataAccept) {
    this.env.strataAccept = new Accept(this.env.headers['accept']);
  }

  return this.env.strataAccept.accept(mediaType);
};

/**
 * Returns true if this request indicates the client accepts the given
 * charset.
 */
Request.prototype.acceptsCharset = function (charset) {
  if (!this.env.strataAcceptCharset) {
    this.env.strataAcceptCharset = new AcceptCharset(this.env.headers['accept-charset']);
  }

  return this.env.strataAcceptCharset.accept(charset);
};

/**
 * Returns true if this request indicates the client accepts the given
 * encoding.
 */
Request.prototype.acceptsEncoding = function (encoding) {
  if (!this.env.strataAcceptEncoding) {
    this.env.strataAcceptEncoding = new AcceptEncoding(this.env.headers['accept-encoding']);
  }

  return this.env.strataAcceptEncoding.accept(encoding);
};

/**
 * Returns true if this request indicates the client accepts the given
 * language.
 */
Request.prototype.acceptsLanguage = function (language) {
  if (!this.env.strataAcceptLanguage) {
    this.env.strataAcceptLanguage = new AcceptLanguage(this.env.headers['accept-language']);
  }

  return this.env.strataAcceptLanguage.accept(language);
};

/**
 * Returns the prefix that is used for the names of file uploads.
 */
Request.prototype.__defineGetter__('uploadPrefix', function () {
  return this.env.strataUploadPrefix || 'StrataUpload-';
});

/**
 * Sets the prefix that is used for the names of file uploads.
 */
Request.prototype.__defineSetter__('uploadPrefix', function (value) {
  this.env.strataUploadPrefix = value;
});

/**
 * Returns the directory where file uploads are stored.
 */
Request.prototype.__defineGetter__('uploadDir', function () {
  return this.env.strataUploadDir || '/tmp';
});

/**
 * Sets the directory where file uploads are stored.
 */
Request.prototype.__defineSetter__('uploadDir', function (value) {
  this.env.strataUploadDir = value;
});

/**
 * Is true if this request was most likely made using an HTML form.
 */
Request.prototype.__defineGetter__('formData', function () {
  var type = this.mediaType;

  if (Request.FORM_DATA_MEDIA_TYPES.indexOf(type) !== -1) {
    return true;
  }

  var method = this.env.strataOriginalMethod || this.method;

  return (!type && method === 'POST');
});

/**
 * Is true if this request contains data that is able to be parsed.
 */
Request.prototype.__defineGetter__('parseableData', function () {
  if (Request.PARSEABLE_DATA_MEDIA_TYPES.indexOf(this.mediaType) !== -1) {
    return true;
  }

  return this.formData;
});

/**
 * Calls the given callback with an object of cookies received in the HTTP
 * Cookie header.
 */
Request.prototype.cookies = function (callback) {
  var env = this.env;
  var cookieString = env.headers['cookie'];

  if (!cookieString) {
    callback(null, {});
    return;
  }

  if (env.strataCookieString !== cookieString) {
    env.strataCookieString = cookieString;
    delete env.strataCookies;
  }

  if (env.strataCookies) {
    callback(null, env.strataCookies);
    return;
  }

  var cookies = qs.parse(cookieString, /[;,] */);

  // From RFC 2109:
  // If multiple cookies satisfy the criteria above, they are ordered in
  // the Cookie header such that those with more specific Path attributes
  // precede those with less specific. Ordering with respect to other
  // attributes (e.g., Domain) is unspecified.
  for (var cookieName in cookies) {
    if (Array.isArray(cookies[cookieName])) {
      cookies[cookieName] = cookies[cookieName][0] || '';
    }
  }

  env.strataCookies = cookies;
  callback(null, cookies);
};

/**
 * Calls the given callback with an object of parameters received in the
 * query string.
 */
Request.prototype.query = function (callback) {
  var env = this.env;
  var queryString = env.queryString;

  if (!queryString) {
    callback(null, {});
    return;
  }

  if (env.strataQueryString !== queryString) {
    env.strataQueryString = queryString;
    delete env.strataQuery;
  }

  if (env.strataQuery) {
    callback(null, env.strataQuery);
    return;
  }

  var query = qs.parse(queryString);

  env.strataQuery = query;
  callback(null, query);
};

/**
 * Calls the given callback with the contents of the request body. If the
 * body is parseable, this will be an object of data. Otherwise, it will be the
 * contents of the body as a string.
 */
Request.prototype.body = function (callback) {
  var env = this.env;

  if ('strataBody' in env) {
    callback(null, env.strataBody);
    return;
  }

  var input = env.input;

  if (this.mediaType === 'application/json') {
    utils.bufferStream(input, function (err, buffer) {
      try {
        env.strataBody = JSON.parse(buffer.toString());
      } catch (e) {
        callback(new Error('Invalid JSON', e), {});
        return;
      }

      callback(err, env.strataBody);
    });
  } else if (this.parseableData) {
    var contentType = this.contentType || '';
    var match = contentType.match(/^multipart\/.*boundary=(?:"([^"]+)"|([^;]+))/im);

    if (match) {
      var boundary = match[1] || match[2];
      var body = {};

      try {
        var parser = new multipart.Parser(boundary, this.uploadDir, this.uploadPrefix);
      } catch (e) {
        callback(new Error('Cannot create multipart parser', e), body);
        return;
      }

      parser.onParam = function (name, value) {
        body[name] = value;
      };

      parser.onEnd = function () {
        env.strataBody = body;
        callback(null, body);
      };

      // Throttle the input stream based on how quickly we can write to disk.
      parser.onFile = function (file) {
        file.on('write', function () {
          input.pause();
        });

        file.on('progress', function (size) {
          input.resume();
        });
      };

      input.on('data', function (buffer) {
        var length = parser.write(buffer);

        if (length !== buffer.length) {
          input.pause();
          callback(new Error('Error parsing multipart body: ' + length + ' of ' + buffer.length + ' bytes parsed'), body);
        }
      });

      input.on('end', function () {
        try {
          parser.end();
        } catch (e) {
          callback(new Error('Error parsing multipart body', e), body);
        }
      });
    } else {
      utils.bufferStream(input, function (err, buffer) {
        env.strataBody = qs.parse(buffer.toString());
        callback(err, env.strataBody);
      });
    }
  } else {
    utils.bufferStream(input, function (err, buffer) {
      env.strataBody = buffer.toString();
      callback(err, env.strataBody);
    });
  }

  input.resume();
};

/**
 * Calls the given callback with an object that is the union of query and
 * body parameters.
 */
Request.prototype.params = function (callback) {
  var env = this.env;

  if (env.strataParams) {
    callback(null, env.strataParams);
    return;
  }

  var params = {};
  var self = this;

  this.query(function (err, query) {
    if (err) {
      callback(err, params);
    } else {
      for (var param in query) {
        params[param] = query[param];
      }

      self.body(function (err, body) {
        if (err) {
          callback(err, params);
        } else {
          if (typeof body === 'object') {
            for (var param in body) {
              params[param] = body[param];
            }
          }

          env.strataParams = params;
          callback(null, params);
        }
      });
    }
  });
};

/**
 * An array of all HTTP request header names.
 */
Request.headers = [
  'Accept',
  'Accept-Charset',
  'Accept-Encoding',
  'Accept-Language',
  'Authorization',
  'Cache-Control',
  'Connection',
  'Cookie',
  'Content-Length',
  'Content-MD5',
  'Content-Type',
  'Date',
  'Expect',
  'From',
  'Host',
  'If-Match',
  'If-Modified-Since',
  'If-None-Match',
  'If-Range',
  'If-Unmodified-Since',
  'Max-Forwards',
  'Pragma',
  'Proxy-Authorization',
  'Range',
  'Referer',
  'TE',
  'Upgrade',
  'User-Agent',
  'Via',
  'Warning'
];

/**
 * Define convenient getters for all response headers using the camel-cased
 * version of the HTTP header name, e.g.:
 *
 * Accept => accept
 * Content-Type => contentType
 */
Request.headers.forEach(function (headerName) {
  var propertyName = utils.propertyName(headerName);

  if (propertyName in Request.prototype) {
    return;
  }

  Object.defineProperty(Request.prototype, propertyName, {
    enumerable: true,
    get: function () {
      return this.env.headers[headerName.toLowerCase()];
    }
  });
});

// Alias for referer.
Request.prototype.__defineGetter__('referrer', function () {
  return this.referer;
});
