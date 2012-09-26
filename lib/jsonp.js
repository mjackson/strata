var util = require('util');
var BufferedStream = require('bufferedstream');
var strata = require('./index');
var Request = require('./request');

/**
 * A middleware that wraps the response body in a JavaScript callback function
 * if it is application/json.
 */
module.exports = function (app, callbackName) {
  callbackName = callbackName || 'callback';

  function jsonp(env, callback) {
    var req = new Request(env);

    req.params(function (err, params) {
      if (err && strata.handleError(err, env, callback)) {
        return;
      }

      var cbName = params.callback || callbackName;
      var header = cbName + '(';
      var footer = ')';
      var wrapperLength = Buffer.byteLength(header + footer);

      app(env, function (status, headers, body) {
        if (headers['Content-Type'] === 'application/json') {
          body = new Body(header, footer, body);

          // It's JavaScript now!
          headers['Content-Type'] = 'application/javascript';

          // Add on the wrapper length to Content-Length if it is set.
          if ('Content-Length' in headers) {
            var length = parseInt(headers['Content-Length'], 10) || 0;
            length += wrapperLength;

            headers['Content-Length'] = length.toString();
          }
        }

        callback(status, headers, body);
      });
    });
  }

  return jsonp;
};

/**
 * A small wrapper class for response bodies that wraps the data in the given
 * header and footer on the way through.
 */
function Body(header, footer, source, encoding) {
  this._header = header;
  this._footer = footer;
  this._headerSent = false;

  BufferedStream.call(this, source, encoding);
}

util.inherits(Body, BufferedStream);

Body.prototype.write = function (chunk) {
  if (!this._headerSent) {
    BufferedStream.prototype.write.call(this, this._header);
    this._headerSent = true;
  }

  return BufferedStream.prototype.write.call(this, chunk);
};

Body.prototype.end = function (chunk, encoding) {
  if (arguments.length > 0) {
    this.write(chunk, encoding);
  }

  BufferedStream.prototype.end.call(this, this._footer);
};
