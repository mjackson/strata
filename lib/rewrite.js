var util = require('util');

/**
 * Provides URL rewriting behavior similar to Apache's mod_rewrite. All requests
 * whose pathInfo matches the given pattern will have it overwritten with
 * the given replacement using a simple String.prototype.replace.
 */
module.exports = function (app, pattern, replacement) {
  if (typeof pattern === 'string') {
    pattern = new RegExp('^' + pattern + '$');
  }

  if (!util.isRegExp(pattern)) {
    throw new Error('Pattern must be a RegExp');
  }

  replacement = replacement || '';

  function rewrite(env, callback) {
    var pathInfo = env.pathInfo;

    if (pattern.test(pathInfo)) {
      // Modify env.pathInfo for downstream apps.
      env.pathInfo = pathInfo.replace(pattern, replacement);
    }

    app(env, function (status, headers, body) {
      // Reset env.pathInfo for upstream apps.
      env.pathInfo = pathInfo;

      callback(status, headers, body);
    });
  }

  return rewrite;
};
