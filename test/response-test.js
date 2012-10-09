require('./helper');
var Response = strata.Response;

describe('Response', function () {
  it('may be instantiated without using new', function () {
    assert.ok(Response() instanceof Response);
  });

  describe('when newly created', function () {
    var code = 200;
    var content = 'Hello world!';
    var contentType = 'text/plain';
    var contentLength = Buffer.byteLength(content);
    var headersMap = {
      'Content-Type': contentType,
      'Content-Length': contentLength
    };

    var res;
    beforeEach(function () {
      res = new Response(content, headersMap, code);
    });

    it('knows its status', function () {
      assert.equal(res.status, code);
    });

    it('knows its headers', function () {
      assert.deepEqual(res.headers, headersMap);
    });

    it('knows its body', function () {
      assert.equal(res.body, content);
    });

    it('knows its content type', function () {
      assert.equal(res.contentType, contentType);
    });

    it('knows its content length', function () {
      assert.equal(res.contentLength, contentLength);
    });
  });

  describe('with a redirect', function () {
    var code = 301;
    var location = 'http://www.example.com';

    var res;
    beforeEach(function () {
      res = new Response;
      res.redirect(location, code);
    });

    it('knows its status', function () {
      assert.equal(res.status, code);
    });

    it('knows its new location', function () {
      assert.equal(res.location, location);
    });
  });

  describe('with a cookie string', function () {
    var cookieName = 'the_cookie';
    var cookieValue = 'the value';

    var res;
    beforeEach(function () {
      res = new Response;
      res.setCookie(cookieName, cookieValue);
    });

    it('has the correct Set-Cookie header', function () {
      assert.ok(res.headers['Set-Cookie']);
      assert.equal(res.headers['Set-Cookie'], 'the_cookie=the%20value');
    });

    it('is able to remove the cookie', function () {
      res.removeCookie(cookieName, cookieValue);
      assert.equal(res.headers['Set-Cookie'], 'the_cookie=; expires=Thu, 01 Jan 1970 00:00:00 GMT');
    });
  });

  describe('with a cookie object', function () {
    var cookieName = 'the_cookie';
    var cookieValue = {
      value: 'the value',
      domain: 'example.org',
      path: '/account',
      expires: new Date(98765432100)
    };

    var res;
    beforeEach(function () {
      res = new Response;
      res.setCookie(cookieName, cookieValue);
    });

    it('has the correct Set-Cookie header', function () {
      assert.ok(res.headers['Set-Cookie']);
      assert.equal(res.headers['Set-Cookie'], 'the_cookie=the%20value; domain=example.org; path=/account; expires=Sat, 17 Feb 1973 02:50:32 GMT');
    });

    it('is able to remove the cookie', function () {
      res.removeCookie(cookieName, cookieValue);
      assert.equal(res.headers['Set-Cookie'], 'the_cookie=; domain=example.org; path=/account; expires=Thu, 01 Jan 1970 00:00:00 GMT');
    });
  });

  describe('with two cookies', function () {
    var firstName = 'cookie1';
    var firstValue = {
      value: 'value 1',
      domain: 'example.org',
      path: '/account',
      expires: new Date(98765432100)
    };

    var secondName = 'cookie2';
    var secondValue = {
      value: 'value 2',
      domain: 'example.net',
      path: '/users',
      expires: new Date(98765432100)
    };

    var res;
    beforeEach(function () {
      res = new Response;
      res.setCookie(firstName, firstValue);
      res.setCookie(secondName, secondValue);
    });

    it('has the correct Set-Cookie header', function () {
      assert.ok(res.headers['Set-Cookie']);
      assert.equal(res.headers['Set-Cookie'], 'cookie1=value%201; domain=example.org; path=/account; expires=Sat, 17 Feb 1973 02:50:32 GMT\ncookie2=value%202; domain=example.net; path=/users; expires=Sat, 17 Feb 1973 02:50:32 GMT');
    });

    it('is able to remove one of the cookies', function () {
      res.removeCookie(firstName, firstValue);
      assert.equal(res.headers['Set-Cookie'], 'cookie2=value%202; domain=example.net; path=/users; expires=Sat, 17 Feb 1973 02:50:32 GMT\ncookie1=; domain=example.org; path=/account; expires=Thu, 01 Jan 1970 00:00:00 GMT');
    });
  });

  describe('with two cookies from the same domain', function () {
    var firstName = 'cookie1';
    var firstValue = {
      value: 'value 1',
      domain: 'example.org'
    };

    var secondName = 'cookie2';
    var secondValue = {
      value: 'value 2',
      domain: 'example.org'
    };

    var res;
    beforeEach(function () {
      res = new Response;
      res.setCookie(firstName, firstValue);
      res.setCookie(secondName, secondValue);
    });

    it('has the correct Set-Cookie header', function () {
      assert.ok(res.headers['Set-Cookie']);
      assert.equal(res.headers['Set-Cookie'], 'cookie1=value%201; domain=example.org\ncookie2=value%202; domain=example.org');
    });

    it('is able to remove one of the cookies', function () {
      res.removeCookie(firstName, firstValue);
      assert.equal(res.headers['Set-Cookie'], 'cookie2=value%202; domain=example.org\ncookie1=; domain=example.org; expires=Thu, 01 Jan 1970 00:00:00 GMT');
    });
  });
});
