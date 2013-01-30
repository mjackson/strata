require('./helper');
var Stream = require('stream').Stream;
var BufferedStream = require('bufferedstream');

describe('strata', function () {
  describe('env', function () {
    var protocol = 'https:';
    var protocolVersion = '1.1';
    var requestMethod = 'POST';
    var requestTime = new Date;
    var remoteAddr = '127.0.0.1';
    var remotePort = '8888';
    var serverName = 'example.org';
    var serverPort = '443';
    var pathInfo = '/some/path';
    var queryString = 'a=1&b=2';
    var userAgent = 'test suite';
    var content = 'Hello world!';
    var contentLength = Buffer.byteLength(content);

    var env;
    beforeEach(function () {
      env = strata.env({
        protocol: protocol,
        protocolVersion: protocolVersion,
        requestMethod: requestMethod,
        requestTime: requestTime,
        remoteAddr: remoteAddr,
        remotePort: remotePort,
        serverName: serverName,
        serverPort: serverPort,
        pathInfo: pathInfo,
        queryString: queryString,
        headers: {
          'Host': serverName,
          'User-Agent': userAgent,
          'Content-Length': contentLength
        },
        input: content
      });
    });

    function check(name, value) {
      it('has the correct ' + name, function () {
        assert.deepEqual(env[name], value);
      });
    }

    check('protocol', protocol);
    check('protocolVersion', protocolVersion);
    check('requestMethod', requestMethod);
    check('requestTime', requestTime);
    check('remoteAddr', remoteAddr);
    check('remotePort', remotePort);
    check('serverName', serverName);
    check('serverPort', serverPort);
    check('scriptName', '');
    check('pathInfo', pathInfo);
    check('queryString', queryString);
    check('strataVersion', strata.version);

    it('has the correct headers', function () {
      assert.equal(env.headers['host'], serverName);
      assert.equal(env.headers['user-agent'], userAgent);
      assert.equal(env.headers['content-length'], contentLength);
    });

    describe('input', function () {
      it('is a Stream', function () {
        assert.ok(env.input instanceof Stream);
      });

      it('is readable', function () {
        assert.ok(env.input.readable);
      });

      it('is paused', function () {
        assert.ok(env.input.paused);
      });

      describe('when read', function () {
        var input;
        beforeEach(function (callback) {
          env.input.resume();

          utils.bufferStream(env.input, function (err, buffer) {
            input = buffer.toString();
            callback(err);
          });
        });

        it('contains the entire input stream', function () {
          assert.equal(input, content);
        });
      });
    });

    describe('error', function () {
      it('is a Stream', function () {
        assert.ok(env.error instanceof Stream);
      });

      it('is writable', function () {
        assert.ok(env.error.writable);
      });
    });
  });

  describe('a HEAD request to stream OK response with length', function () {
    var app = function (env, callback) {
      assert.equal(env.requestMethod, 'HEAD');
      callback(200, { 'Content-Length': 2 }, BufferedStream('OK'));
    };

    beforeEach(function (callback) {
      call(app, mock.env({
        requestMethod: 'HEAD'
      }), callback);
    });

    it('returns a Content-Length of 2', function () {
      assert.equal(headers['Content-Length'], '2');
    });

    it('returns an empty body', function () {
      assert.equal(body, '');
    });
  });

  describe('a HEAD request to stream OK response w/o length', function () {
    var app = function (env, callback) {
      assert.equal(env.requestMethod, 'HEAD');
      callback(200, {}, BufferedStream('OK'));
    };

    beforeEach(function (callback) {
      call(app, mock.env({
        requestMethod: 'HEAD'
      }), callback);
    });

    it('returns a Transfer-Encoding of chunked', function () {
      assert.equal(headers['Transfer-Encoding'], 'chunked');
    });

    it('returns an empty body', function () {
      assert.equal(body, '');
    });
  });

  describe('handleError', function () {
    var returnValue;
    var app = function (env, callback) {
      returnValue = strata.handleError(new Error('Boom!'), env, callback);
    };

    var stream, env;
    beforeEach(function (callback) {
      stream = {};
      env = mock.env({ error: mock.stream(stream) });
      call(app, env, callback);
    });

    it('returns 500', function () {
      assert.equal(status, 500);
    });

    it('returns a boolean', function () {
      assert.equal(typeof returnValue, 'boolean');
    });

    it('writes to the error stream', function () {
      assert.ok(stream.data);
      assert.ok(stream.data.match(/unhandled error/i));
    });
  });
});
