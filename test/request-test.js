require('./helper');
var qs = require('querystring');
var Request = strata.Request;

describe('Request', function () {
  it('may be instantiated without using new', function () {
    assert.ok(Request() instanceof Request);
  });

  var protocol = 'https:';
  var protocolVersion = '1.1';
  var requestMethod = 'POST';
  var serverName = 'example.org';
  var serverPort = 1234;
  var pathInfo = '/some/path';
  var queryString = 'a=1&b=hello%20world';
  var contentType = 'application/json; charset="utf-8"';
  var contentLength = '0';
  var userAgent = 'test';
  var referrer = 'http://example.com/phony';
  var headers = {
    'Content-Type': contentType,
    'Content-Length': contentLength,
    'User-Agent': userAgent,
    'Referer': referrer,
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'text/html, */*',
    'Accept-Charset': 'iso-8859-1, *',
    'Accept-Encoding': 'gzip, *',
    'Accept-Language': 'en'
  };

  describe('when newly created', function () {
    var env, req;
    beforeEach(function () {
      env = mock.env({
        protocol: protocol,
        protocolVersion: protocolVersion,
        requestMethod: requestMethod,
        serverName: serverName,
        serverPort: serverPort,
        pathInfo: pathInfo,
        queryString: queryString,
        headers: headers
      });

      req = new Request(env);
    });

    it('knows its protocol', function () {
      assert.equal(req.protocol, protocol);
    });

    it('knows its protocol version', function () {
      assert.equal(req.protocolVersion, protocolVersion);
    });

    it('knows its method', function () {
      assert.equal(req.method, requestMethod);
    });

    it('knows its script name', function () {
      assert.equal(req.scriptName, '');
    });

    it('is able to modify its script name', function () {
      var old = req.scriptName;
      req.scriptName = '/another/path';
      assert.equal(req.scriptName, '/another/path');
      req.scriptName = old;
      assert.equal(req.scriptName, old);
    });

    it('knows its path info', function () {
      assert.equal(req.pathInfo, pathInfo);
    });

    it('is able to modify its path info', function () {
      var old = req.pathInfo;
      req.pathInfo = '/another/path';
      assert.equal(req.pathInfo, '/another/path');
      req.pathInfo = old;
      assert.equal(req.pathInfo, old);
    });

    it('knows its query string', function () {
      assert.equal(req.queryString, queryString);
    });

    it('is able to modify its query string', function () {
      var old = req.queryString;
      req.queryString = 'a=2';
      assert.equal(req.queryString, 'a=2');
      req.queryString = old;
      assert.equal(req.queryString, old);
    });

    it('knows its content type', function () {
      assert.equal(req.contentType, contentType);
    });

    it('knows its content length', function () {
      assert.equal(req.contentLength, contentLength);
    });

    it('knows its media type', function () {
      assert.equal(req.mediaType, 'application/json');
    });

    it("knows if it's parseable", function () {
      assert.ok(req.parseableData);
    });

    it('knows its user agent', function () {
      assert.equal(req.userAgent, userAgent);
    });

    it('knows its referrer', function () {
      assert.equal(req.referrer, referrer);
    });

    it('knows what content types are acceptable', function () {
      assert.ok(req.accepts('text/html'));
      assert.ok(req.accepts('application/json'));
    });

    it('knows what character sets are acceptable', function () {
      assert.ok(req.acceptsCharset('iso-8859-1'));
      assert.ok(req.acceptsCharset('utf-8'));
    });

    it('knows what content encodings are acceptable', function () {
      assert.ok(req.acceptsEncoding('gzip'));
      assert.ok(req.acceptsEncoding('compress'));
    });

    it('knows what languages are acceptable', function () {
      assert.ok(req.acceptsLanguage('en'));
      assert.ok(!req.acceptsLanguage('jp'));
    });

    it('knows if it is secure', function () {
      assert.ok(req.ssl);
    });

    it('knows if it was made via XMLHttpRequest', function () {
      assert.ok(req.xhr);
    });

    it('knows its host and port', function () {
      assert.equal(req.hostWithPort, serverName + ':' + serverPort);
    });

    it('knows its host', function () {
      assert.equal(req.host, serverName);
    });

    it('knows its port', function () {
      assert.strictEqual(req.port, serverPort);
    });

    it('knows its base URL', function () {
      assert.equal(req.baseUrl, protocol + '//' + serverName + ':' + serverPort);
    });

    it('knows its path', function () {
      assert.equal(req.path, pathInfo);
    });

    it('knows its full path', function () {
      assert.equal(req.fullPath, pathInfo + '?' + queryString);
    });

    it('knows its URL', function () {
      assert.equal(req.url, protocol + '//' + serverName + ':' + serverPort + pathInfo + '?' + queryString);
    });
  });

  describe('behind a reverse HTTP proxy', function () {
    var headers = {
      'X-Forwarded-Ssl': 'on',
      'X-Forwarded-Host': serverName
    };

    var env, req;
    beforeEach(function () {
      env = mock.env({ headers: headers });
      req = new Request(env);
    });

    it('knows its protocol', function () {
      assert.equal(req.protocol, protocol);
    });

    it('knows its host', function () {
      assert.equal(req.host, serverName);
    });

    it('knows its port', function () {
      assert.equal(req.port, '443');
    });
  });

  describe('with cookies', function () {
    var cookieString = 'a=1, a=2,b=3';

    var cookies;
    beforeEach(function (callback) {
      var app = function (env, cb) {
        var req = new Request(env);
        req.cookies(function (err, c) {
          cookies = c;
          callback(err);
        });
      };

      call(app, mock.env({
        headers: {
          'Cookie': cookieString
        }
      }), noop);
    });

    it('parses them correctly', function () {
      assert.equal(cookies.a, '1');
      assert.equal(cookies.b, '3');
    });
  });

  describe('with a query string', function () {
    var queryString = 'a=1&a=2&b=3';

    var query;
    beforeEach(function (callback) {
      var app = function (env, cb) {
        var req = new Request(env);
        req.query(function (err, q) {
          query = q;
          callback(err);
        });
      };

      call(app, '/?' + queryString, noop);
    });

    it('parses it correctly', function () {
      assert.deepEqual(query, qs.parse(queryString));
    });
  });

  describe('with a text/plain body', function () {
    var content = 'This is some plain text.';

    var body;
    beforeEach(function (callback) {
      var app = function (env, cb) {
        new Request(env).body(function (err, b) {
          body = b;
          callback(err);
        });
      };

      call(app, mock.env({
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(content)
        },
        input: content
      }), noop);
    });

    it('passes through unparsed', function () {
      assert.equal(body, content);
    });
  });

  describe('with an application/json body', function () {
    var content = '{"a":1,"b":2}';

    var body;
    beforeEach(function (callback) {
      var app = function (env, cb) {
        var req = new Request(env);
        req.body(function (err, b) {
          body = b;
          callback(err);
        });
      };

      call(app, mock.env({
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(content)
        },
        input: content
      }), noop);
    });

    it('parses it correctly', function () {
      assert.deepEqual(body, JSON.parse(content));
    });
  });

  describe('with an application/x-www-form-urlencoded body', function () {
    var content = 'a=1&a=2';

    var body;
    beforeEach(function (callback) {
      var app = function (env, cb) {
        var req = new Request(env);
        req.body(function (err, b) {
          body = b;
          callback(err);
        });
      };

      call(app, mock.env({
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(content)
        },
        input: content
      }), noop);
    });

    it('parses it correctly', function () {
      assert.deepEqual(body, qs.parse(content));
    });
  });

  describe('with a multipart/form-data body', function () {
    var content = '--AaB03x\r\n\
Content-Disposition: form-data; name="a"\r\n\
\r\n\
Hello world!\r\n\
--AaB03x--\r';

    var body;
    beforeEach(function (callback) {
      var app = function (env, cb) {
        var req = new Request(env);
        req.body(function (err, b) {
          body = b;
          callback(err);
        });
      };

      call(app, mock.env({
        headers: {
          'Content-Type': 'multipart/form-data; boundary="AaB03x"',
          'Content-Length': Buffer.byteLength(content)
        },
        input: content
      }), noop);
    });

    it('parses it correctly', function () {
      assert.equal(body.a, 'Hello world!');
    });
  });

  describe('with a query string and a multipart/form-data body', function () {
    var queryString = 'a=1&a=2&b=3';
    var content = '--AaB03x\r\n\
Content-Disposition: form-data; name="a"\r\n\
\r\n\
Hello world!\r\n\
--AaB03x--\r';

    var params;
    beforeEach(function (callback) {
      var app = function (env, cb) {
        var req = new Request(env);
        req.params(function (err, p) {
          params = p;
          callback(err);
        });
      };

      call(app, mock.env({
        queryString: queryString,
        headers: {
          'Content-Type': 'multipart/form-data; boundary="AaB03x"',
          'Content-Length': Buffer.byteLength(content)
        },
        input: content
      }), noop);
    });

    it('parses all params correctly', function () {
      // The "a" parameter in the body should overwrite the value
      // of the parameter with the same name in the query string.
      assert.equal(params.a, 'Hello world!');
      assert.equal(params.b, '3');
    });
  });
});

function noop(status, headers, body) {}
