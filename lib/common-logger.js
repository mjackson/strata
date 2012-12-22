var strftime = require('strftime').strftime;
var Request = require('./request');

/**
 * A middleware that logs the request to the given stream on its way out,
 * similar to Apache's Common Log Format
 * (see http://httpd.apache.org/docs/1.3/logs.html#common).
 */
module.exports = function (app, stream) {
  stream = stream || process.stderr;

  // LogFormat "%h %l %u %t \"%r\" %>s %b" common
  // 127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326

  function commonLogger(env, callback) {
    app(env, function (status, headers, body) {
      var req = new Request(env);

      var addr = req.remoteAddr || '-';
      var id = '-'; // RFC 1413 identity of the client determined by identd on the client's machine
      var user = env.remoteUser || '-';
      var timestamp = '[' + strftime('%d/%b/%Y:%H:%M:%S %z', env.requestTime) + ']';
      var info = '"' + req.method + ' ' + req.fullPath + ' HTTP/' + env.protocolVersion  + '"';

      var length;
      if ('Content-Length' in headers) {
        length = headers['Content-Length'];
      } else if (typeof body === 'string') {
        length = Buffer.byteLength(body);
      } else if (typeof body.length === 'number') {
        length = body.length;
      } else {
        length = '-';
      }

      var entry = [addr, id, user, timestamp, info, status, length].join(' ');
      stream.write(entry + '\n');

      callback(status, headers, body);
    });
  }

  return commonLogger;
};
