var crypto = require('crypto');
var utils = require('./utils');

module.exports = function (app, headerName, sessionKey, byteLength) {
  headerName = (headerName || 'X-Authenticity-Token').toLowerCase();
  sessionKey = sessionKey || 'strata.csrf';
  byteLength = byteLength || 32;

  function authenticityToken(env, callback) {
    var session = env.session;

    if (!session) {
      env.error.write('You must use a session middleware in front of strata.authenticityToken!\n');
      session = {};
    }

    if (!(sessionKey in session)) {
      try {
        var buffer = crypto.randomBytes(byteLength);
        session[sessionKey] = buffer.toString('hex');
      } catch (err) {
        if (strata.handleError(err, env, callback)) {
          return;
        }
      }
    }

    if (utils.isSafeRequestMethod(env.requestMethod)) {
      app(env, callback);
    } else {
      var headers = env.headers;

      if (headers[headerName] && headers[headerName] === session[sessionKey]) {
        app(env, callback);
      } else {
        utils.forbidden(env, callback);
      }
    }
  }

  return authenticityToken;
};
