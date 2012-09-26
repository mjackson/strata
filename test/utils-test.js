require('./helper');

describe('utils', function () {
  testHeaderConversion('Accept', 'Accept', 'Accept', 'accept');
  testHeaderConversion('accept', 'Accept', 'Accept', 'accept');
  testHeaderConversion('Content-Type', 'Content-Type', 'ContentType', 'contentType');
  testHeaderConversion('content-type', 'Content-Type', 'ContentType', 'contentType');
  testHeaderConversion('X-Forwarded-Ssl', 'X-Forwarded-Ssl', 'XForwardedSsl', 'xForwardedSsl');
  testHeaderConversion('x-forwarded-ssl', 'X-Forwarded-Ssl', 'XForwardedSsl', 'xForwardedSsl');

  describe('compileRoute', function () {
    it('should properly recognize valid identifiers', function () {
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
