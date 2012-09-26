require('./helper');
var Accept = strata.Accept;

describe('Accept', function () {
  it('may be instantiated without using new', function () {
    assert.ok(Accept() instanceof Accept);
  });

  it('knows its qvalues', function () {
    var header = new Accept('text/html, text/*;q=0.3, */*;q=0.5');
    assert.equal(header.qvalue('image/png'), 0.5);
    assert.equal(header.qvalue('text/plain'), 0.3);
    assert.equal(header.qvalue('text/html'), 1);

    header = new Accept('text/html');
    assert.equal(header.qvalue('image/png'), 0);

    header = new Accept('');
    assert.equal(header.qvalue('text/html'), 1);
  });

  it('matches properly', function () {
    var header = new Accept('text/*, text/html, text/html;level=1, */*')
    assert.deepEqual(header.matches(''), ['*/*']);
    assert.deepEqual(header.matches('image/jpeg'), ['*/*']);
    assert.deepEqual(header.matches('text/plain'), ['text/*', '*/*']);
    assert.deepEqual(header.matches('text/html'), ['text/html', 'text/*', '*/*']);
    assert.deepEqual(header.matches('text/html;level=1'), ['text/html;level=1', 'text/html', 'text/*', '*/*']);
    assert.deepEqual(header.matches('text/html;level=1;answer=42'), ['text/html;level=1', 'text/html', 'text/*', '*/*']);
  });
});
