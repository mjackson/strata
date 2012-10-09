var utils = require('./utils');

/**
 * A middleware that sets the Content-Length header if it is missing on string
 * bodies. Does not work for Stream bodies.
 */
module.exports = function (app) {
  function contentLength(env, callback) {
    app(env, function (status, headers, body) {
      if (!('Content-Length' in headers) && !headers['Transfer-Encoding'] && !utils.isEmptyBodyStatus(status)) {
        if (typeof body === 'string') {
          headers['Content-Length'] = Buffer.byteLength(body);
        } else if (typeof body.length === 'number') {
          headers['Content-Length'] = body.length;
        } else {
          env.error.write('Cannot set Content-Length for body with no length\n');
        }
      }

      callback(status, headers, body);
    });
  }

  return contentLength;
};
