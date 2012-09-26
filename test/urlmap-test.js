require('./helper');
var urlMap = strata.urlMap;

describe('urlMap', function () {
  describe('by default', function () {
    beforeEach(function (callback) {
      call(urlMap(), '/', callback);
    });

    it('returns 404', function () {
      assert.equal(status, 404);
    });
  });

  describe('with path-based definitions', function () {
    var innerApp = function (env, callback) {
      callback(200, {
        'X-Script-Name': env.scriptName,
        'X-Path-Info': env.pathInfo,
        'Content-Type': 'text/plain'
      }, '');
    };

    var app = makeMap({
      'http://example.org/static': innerApp,
      '/path': innerApp,
      '/some/path': innerApp
    });

    describe('GET /', function () {
      beforeEach(function (callback) {
        call(app, '/', callback);
      });

      checkStatus(404);
    });

    describe('GET /miss', function () {
      beforeEach(function (callback) {
        call(app, '/miss', callback);
      });

      checkStatus(404);
    });

    describe('GET /path', function () {
      beforeEach(function (callback) {
        call(app, '/path', callback);
      });

      checkLocation(200, '/path', '');
    });

    describe('GET /path/', function () {
      beforeEach(function (callback) {
        call(app, '/path/', callback);
      });

      checkLocation(200, '/path', '/');
    });

    describe('GET /some/path', function () {
      beforeEach(function (callback) {
        call(app, '/some/path', callback);
      });

      checkLocation(200, '/some/path', '');
    });

    describe('GET /some/path/', function () {
      beforeEach(function (callback) {
        call(app, '/some/path/', callback);
      });

      checkLocation(200, '/some/path', '/');
    });

    describe('GET /some///path//name', function () {
      beforeEach(function (callback) {
        call(app, '/some///path//name', callback);
      });

      checkLocation(200, '/some/path', '//name');
    });

    describe('when scriptName is /elsewhere and pathInfo is /path/name', function () {
      beforeEach(function (callback) {
        call(app, mock.env({
          scriptName: '/elsewhere',
          pathInfo: '/path/name'
        }), callback);
      });

      checkLocation(200, '/elsewhere/path', '/name');
    });

    describe('when pathInfo is /static and Host is example.org', function () {
      beforeEach(function (callback) {
        call(app, mock.env({
          pathInfo: '/static',
          headers: {
            'Host': 'example.org'
          }
        }), callback);
      });

      checkLocation(200, '/static', '');
    });

    describe('when pathInfo is /static/ and Host is example.org', function () {
      beforeEach(function (callback) {
        call(app, mock.env({
          pathInfo: '/static/',
          headers: {
            'Host': 'example.org'
          }
        }), callback);
      });

      checkLocation(200, '/static', '/');
    });
  });

  describe('with host-based definitions', function () {
    var app = makeMap({
      '/': function (env, callback) {
        callback(200, {
          'Content-Type': 'text/plain',
          'X-Position': 'example.com',
          'X-Host': env.headers['host'] || env.serverName
        }, '');
      },
      'http://example.org/': function (env, callback) {
        callback(200, {
          'Content-Type': 'text/plain',
          'X-Position': 'example.org',
          'X-Host': env.headers['host'] || env.serverName
        }, '');
      },
      'http://subdomain.example.org/': function (env, callback) {
        callback(200, {
          'Content-Type': 'text/plain',
          'X-Position': 'subdomain.example.org',
          'X-Host': env.headers['host'] || env.serverName
        }, '');
      },
      'http://example.net/': function (env, callback) {
        callback(200, {
          'Content-Type': 'text/plain',
          'X-Position': 'example.net',
          'X-Host': env.headers['host'] || env.serverName
        }, '');
      }
    });

    describe('GET /', function () {
      beforeEach(function (callback) {
        call(app, '/', callback);
      });

      checkPosition(200, 'example.com');
    });

    describe('when pathInfo is / and Host is example.org', function () {
      beforeEach(function (callback) {
        call(app, mock.env({
          pathInfo: '/',
          headers: {
            'Host': 'example.org'
          }
        }), callback);
      });

      checkPosition(200, 'example.org');
    });

    describe('when pathInfo is / and Host is example.net', function () {
      beforeEach(function (callback) {
        call(app, mock.env({
          pathInfo: '/',
          headers: {
            'Host': 'example.net'
          }
        }), callback);
      });

      checkPosition(200, 'example.net');
    });

    describe('when serverName is example.org, pathInfo is /, and Host is subdomain.example.org', function () {
      beforeEach(function (callback) {
        call(app, mock.env({
          serverName: 'example.org',
          pathInfo: '/',
          headers: {
            'Host': 'subdomain.example.org'
          }
        }), callback);
      });

      checkPosition(200, 'subdomain.example.org');
    });

    describe('GET / on Host example.org', function () {
      beforeEach(function (callback) {
        call(app, 'http://example.org/', callback);
      });

      checkPosition(200, 'example.org');
    });

    describe('when serverName is example.info, pathInfo is /, and Host is example.info', function () {
      beforeEach(function (callback) {
        call(app, mock.env({
          serverName: 'example.info',
          pathInfo: '/',
          headers: {
            'Host': 'example.info'
          }
        }), callback);
      });

      checkPosition(200, 'example.com');
    });

    describe('when serverName is example.info, serverPort is 9292, pathInfo is /, and Host is example.info:9292', function () {
      beforeEach(function (callback) {
        call(app, mock.env({
          serverName: 'example.info',
          serverPort: '9292',
          pathInfo: '/',
          headers: {
            'Host': 'example.info:9292'
          }
        }), callback);
      });

      checkPosition(200, 'example.com');
    });
  });

  describe('with nested urlMaps', function () {
    var app = makeMap({
      '/some': makeMap({
        '/path': makeMap({
          '/name': function (env, callback) {
            callback(200, {
              'Content-Type': 'text/plain',
              'X-Position': '/some/path/name',
              'X-Script-Name': env.scriptName,
              'X-Path-Info': env.pathInfo
            }, '');
          }
        })
      })
    });

    describe('GET /some/path', function () {
      beforeEach(function (callback) {
        call(app, '/some/path', callback);
      });

      checkStatus(404);
    });

    describe('GET /some/path/name', function () {
      beforeEach(function (callback) {
        call(app, '/some/path/name', callback);
      });

      checkPosition(200, '/some/path/name');
      checkLocation(200, '/some/path/name', '');
    });
  });

  describe('with multiple root apps', function () {
    var app = makeMap({
      '/': function (env, callback) {
        callback(200, {
          'Content-Type': 'text/plain',
          'X-Position': 'root',
          'X-Script-Name': env.scriptName,
          'X-Path-Info': env.pathInfo
        }, '');
      },
      '/path': function (env, callback) {
        callback(200, {
          'Content-Type': 'text/plain',
          'X-Position': 'path',
          'X-Script-Name': env.scriptName,
          'X-Path-Info': env.pathInfo
        }, '');
      }
    });

    describe('GET /path', function () {
      beforeEach(function (callback) {
        call(app, '/path', callback);
      });

      checkPosition(200, 'path');
      checkLocation(200, '/path', '');
    });

    describe('GET /path/name', function () {
      beforeEach(function (callback) {
        call(app, '/path/name', callback);
      });

      checkPosition(200, 'path');
      checkLocation(200, '/path', '/name');
    });

    describe('GET /', function () {
      beforeEach(function (callback) {
        call(app, '/', callback);
      });

      checkPosition(200, 'root');
      checkLocation(200, '', '/');
    });

    describe('GET /name', function () {
      beforeEach(function (callback) {
        call(app, '/name', callback);
      });

      checkPosition(200, 'root');
      checkLocation(200, '', '/name');
    });

    describe('GET /http://example.org/another', function () {
      beforeEach(function (callback) {
        call(app, '/http://example.org/another', callback);
      });

      checkPosition(200, 'root');
      checkLocation(200, '', '/http://example.org/another');
    });
  });
});

// Creates a new urlMap from the location/app pairs in locationsMap.
function makeMap(locationsMap) {
  var map = urlMap();

  for (var location in locationsMap) {
    map.map(location, locationsMap[location]);
  }

  return map;
}

// Checks the last response for the given variables.
function checkLocation(code, scriptName, pathInfo) {
  checkStatus(code);
  checkHeader('X-Script-Name', scriptName);
  checkHeader('X-Path-Info', pathInfo);
}

// Checks the last response for the given variables.
function checkPosition(code, position) {
  checkStatus(code);
  checkHeader('X-Position', position);
}
