var Request = require('./request');

/**
 * A middleware that sets the flash environment variable with one in the
 * session, if available.
 */
module.exports = function (app) {
  function flash(env, callback) {
    if (env.session && env.session['strata.flash']) {
      env.flash = env.session['strata.flash'];
      delete env.session['strata.flash'];
    }

    app(env, callback);
  }

  return flash;
};

/**
 * Stores the given message in the session for retrieval on the next request.
 */
module.exports.set = function (env, message) {
  if (!env.session) {
    env.session = {};
  }

  env.session['strata.flash'] = String(message);
};

/**
 * Stores the given message directly in the environment so that it may be
 * used on this request.
 */
module.exports.now = function (env, message) {
  env.flash = String(message);
};
