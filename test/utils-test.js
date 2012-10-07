require('./helper');

describe('utils', function () {
  var statusCodes = {
    '100': 'Continue',
    '101': 'Switching Protocols',
    '102': 'Processing',
    '200': 'OK',
    '201': 'Created',
    '202': 'Accepted',
    '203': 'Non-Authoritative Information',
    '204': 'No Content',
    '205': 'Reset Content',
    '206': 'Partial Content',
    '207': 'Multi-Status',
    '300': 'Multiple Choices',
    '301': 'Moved Permanently',
    '302': 'Moved Temporarily',
    '303': 'See Other',
    '304': 'Not Modified',
    '305': 'Use Proxy',
    '307': 'Temporary Redirect',
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '402': 'Payment Required',
    '403': 'Forbidden',
    '404': 'Not Found',
    '405': 'Method Not Allowed',
    '406': 'Not Acceptable',
    '407': 'Proxy Authentication Required',
    '408': 'Request Time-out',
    '409': 'Conflict',
    '410': 'Gone',
    '411': 'Length Required',
    '412': 'Precondition Failed',
    '413': 'Request Entity Too Large',
    '414': 'Request-URI Too Large',
    '415': 'Unsupported Media Type',
    '416': 'Requested Range Not Satisfiable',
    '417': 'Expectation Failed',
    '418': 'I\'m a teapot',
    '422': 'Unprocessable Entity',
    '423': 'Locked',
    '424': 'Failed Dependency',
    '425': 'Unordered Collection',
    '426': 'Upgrade Required',
    '428': 'Precondition Required',
    '429': 'Too Many Requests',
    '431': 'Request Header Fields Too Large',
    '500': 'Internal Server Error',
    '501': 'Not Implemented',
    '502': 'Bad Gateway',
    '503': 'Service Unavailable',
    '504': 'Gateway Time-out',
    '505': 'HTTP Version not supported',
    '506': 'Variant Also Negotiates',
    '507': 'Insufficient Storage',
    '509': 'Bandwidth Limit Exceeded',
    '510': 'Not Extended',
    '511': 'Network Authentication Required'
  };

  describe('HTTP_STATUS_CODES', function () {
    it('contains the correct message for all status codes', function () {
      for (var statusCode in statusCodes) {
        assert.equal(utils.HTTP_STATUS_CODES[statusCode], statusCodes[statusCode]);
      }
    });
  });

  describe('HTTP_STATUS_MESSAGES', function () {
    it('contains the correct code for all messages', function () {
      for (var statusCode in statusCodes) {
        assert.equal(utils.HTTP_STATUS_MESSAGES[statusCodes[statusCode]], statusCode);
      }
    });
  });

  describe('STATUS_WITH_NO_ENTITY_BODY', function () {
    it('contains all codes for which there should be no entity in the body', function () {
      [100, 101, 204, 304].forEach(function (statusCode) {
        assert(utils.STATUS_WITH_NO_ENTITY_BODY.indexOf(statusCode) !== -1);
      });
    });
  });

  describe('isEmptyBodyStatus', function () {
    it('returns true for all status codes that indicates an empty body', function () {
      [100, 101, 204, 304].forEach(function (status) {
        assert(utils.isEmptyBodyStatus(status));
      });
    });

    it('returns false for a status code that does not indicate an empty body', function () {
      assert(!utils.isEmptyBodyStatus(200));
    });
  });

  testHeaderConversion('Accept', 'Accept', 'Accept', 'accept');
  testHeaderConversion('accept', 'Accept', 'Accept', 'accept');
  testHeaderConversion('Content-Type', 'Content-Type', 'ContentType', 'contentType');
  testHeaderConversion('content-type', 'Content-Type', 'ContentType', 'contentType');
  testHeaderConversion('X-Forwarded-Ssl', 'X-Forwarded-Ssl', 'XForwardedSsl', 'xForwardedSsl');
  testHeaderConversion('x-forwarded-ssl', 'X-Forwarded-Ssl', 'XForwardedSsl', 'xForwardedSsl');

  describe('byteSizeFormat', function () {
    testByteSizeConversion(1000, '1000B');
    testByteSizeConversion(1024, '1K');
    testByteSizeConversion(1025, '1K');
    testByteSizeConversion(1535, '1.4K');
    testByteSizeConversion(1536, '1.5K');
    testByteSizeConversion(2047, '1.9K');
    testByteSizeConversion(2048, '2K');
  });

  describe('compileRoute', function () {
    it('recognizes valid identifiers', function () {
      var keys, pattern;

      keys = [];
      pattern = utils.compileRoute('/users/:id', keys);

      assert.ok(pattern);
      assert.deepEqual(keys, ['id']);
      assert.match('/users/1', pattern);
      assert.match('/users/asdf1324_', pattern);

      keys = [];
      pattern = utils.compileRoute('/users/:$id/photos/:_photo_id', keys);

      assert.ok(pattern);
      assert.deepEqual(keys, ['$id', '_photo_id']);
      assert.match('/users/1/photos/1', pattern);

      keys = [];
      pattern = utils.compileRoute('/users/:id.:format', keys);

      assert.ok(pattern);
      assert.deepEqual(keys, ['id', 'format']);
      assert.match('/users/2.json', pattern);
    });

    it('recognizes the splat character', function () {
      var keys = [];
      var pattern = utils.compileRoute('/users/*', keys);

      assert.ok(pattern);
      assert.deepEqual(keys, ['splat']);
      assert.match('/users/1', pattern);
      assert.match('/users/1/photos/1', pattern);
    });

    it('ignores invalid identifiers', function () {
      var keys = [];
      var pattern = utils.compileRoute('/users/:1id');

      assert.ok(pattern);
      assert.empty(keys);
    });
  });
});

function testByteSizeConversion(n, expected) {
  it('converts ' + n + ' to the proper format', function () {
    assert.equal(utils.byteSizeFormat(n), expected);
  });
}

function testHeaderConversion(header, canonical, capitalized, property) {
  it('converts a ' + header + ' header to the proper canonical name', function () {
    assert.equal(utils.canonicalHeaderName(header), canonical);
  });

  it('converts a ' + header + ' header to the proper capitalized name', function () {
    assert.equal(utils.capitalizedHeaderName(header), capitalized);
  });

  it('converts a ' + header + ' header to the proper property name', function () {
    assert.equal(utils.propertyName(header), property);
  });
}
