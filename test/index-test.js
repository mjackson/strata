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
        input: new BufferedStream(content)
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
      var input;
      beforeEach(function (callback) {
        input = '';

        env.input.resume();

        env.input.on('data', function (chunk) {
          input += chunk.toString();
        });

        env.input.on('end', function () {
          callback(null);
        });
      });

      it('is a Stream', function () {
        assert.ok(env.input instanceof Stream);
      });

      it('contains the entire input stream', function () {
        assert.equal(input, content);
      });
    });

    describe('error', function () {
      it('is a Stream', function () {
        assert.ok(env.error instanceof Stream);
      });

      it('is writable', function () {
        assert.ok(env.error);
        assert.ok(env.error.writable);
      });
    });
  });

  describe('handleError', function () {
    var returnValue;
    var app = function (env, callback) {
      var err = new strata.Error('Bang!');
      returnValue = strata.handleError(err, env, callback);
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

  describe('Error', function () {
    it('may be instantiated without using new', function () {
      assert.ok(strata.Error() instanceof strata.Error);
    });

    it('is an instance of Error', function () {
      assert.ok(new strata.Error instanceof Error);
    });
  });
});
