require('./helper');
var AcceptEncoding = strata.AcceptEncoding;

describe('AcceptEncoding', function () {
  it('may be instantiated without using new', function () {
    assert.ok(AcceptEncoding() instanceof AcceptEncoding);
  });

  it('knows its qvalues', function () {
    var header = new AcceptEncoding('');
    assert.equal(header.qvalue('gzip'), 0);
    assert.equal(header.qvalue('identity'), 1);

    header = new AcceptEncoding('gzip, *;q=0.5');
    assert.equal(header.qvalue('gzip'), 1);
    assert.equal(header.qvalue('identity'), 0.5);
  });

  it('matches properly', function () {
    var header = new AcceptEncoding('gzip, identity, *');
    assert.deepEqual(header.matches(''), ['*']);
    assert.deepEqual(header.matches('gzip'), ['gzip', '*']);
    assert.deepEqual(header.matches('compress'), ['*']);
  });
});
