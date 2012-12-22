var crypto = require('crypto');
var Request = require('./request');
var Response = require('./response');

/**
 * A middleware for storing and retrieving session data using HTTP cookies.
 * The options may be any of the following:
 *
 *   - secret       A secret string to use to verify the cookie's contents,
 *                  defaults to null. If this is set the session's contents
 *                  will be cleared if the cookie has been tampered with
 *   - name         The name of the cookie, defaults to "strata.session"
 *   - path         The path of the cookie, defaults to "/"
 *   - domain       The cookie's domain, defaults to null
 *   - expireAfter  A number of seconds after which this cookie will expire,
 *                  defaults to null
 *   - secure       True to only send this cookie over HTTPS, defaults to false
 *   - httpOnly     True to restrict access to this cookie to HTTP(S) APIs,
 *                  defaults to true
 */
module.exports = function (app, options) {
  var readSession = sessionCookieReader(options);
  var writeSession = sessionCookieWriter(options);

  function sessionCookie(env, callback) {
    if (env.session) {
      app(env, callback);
      return;
    }

    readSession(env, function (err, session) {
      if (err) {
        env.session = {};
      } else {
        env.session = session;
      }

      app(env, function (status, headers, body) {
        var res = new Response(body, headers, status);
        writeSession(env, res);
        res.send(callback);
      });
    });
  }

  return sessionCookie;
};

function sessionCookieReader(options) {
  options = sessionCookieOptions(options);

  return function readSessionCookie(env, callback) {
    var req = new Request(env);

    req.cookies(function (err, cookies) {
      if (err) {
        callback(err, cookies);
        return;
      }

      var cookie = cookies[options.name];

      if (cookie) {
        cookie = new Buffer(cookie, 'base64').toString('utf8');

        var index = cookie.lastIndexOf('--');
        var data = cookie.substring(0, index);
        var digest = cookie.substring(index + 2);

        if (digest === sessionDigest(data, options.secret)) {
          try {
            callback(null, JSON.parse(data));
            return;
          } catch (e) {
            // The cookie does not contain valid JSON.
            callback(e, {});
            return;
          }
        }
      }

      callback(null, {});
    });
  }
}

function sessionCookieWriter(options) {
  options = sessionCookieOptions(options);

  return function writeSessionCookie(env, res) {
    var session = env.session;

    if (session) {
      var data = JSON.stringify(session);
      var digest = sessionDigest(data, options.secret);
      var cookie = new Buffer(data + '--' + digest, 'utf8').toString('base64');

      if (cookie.length > 4096) {
        env.error.write('Session cookie data size exceeds 4k; content dropped\n');
        return;
      }

      var cookieOptions = {
        value: cookie,
        path: options.path,
        domain: options.domain,
        secure: options.secure,
        httpOnly: options.httpOnly
      };

      if (options.expireAfter) {
        // expireAfter is given in seconds.
        var expires = new Date().getTime() + (options.expireAfter * 1000);
        cookieOptions.expires = new Date(expires);
      }

      res.setCookie(options.name, cookieOptions);
    }
  }
}

function sessionDigest(data, secret) {
  var shasum = crypto.createHash('sha1');
  shasum.update(data);

  if (secret) {
    shasum.update(secret);
  }

  return shasum.digest('hex');
}

/**
 * Creates a new options object from the given session cookie options with
 * sane defaults.
 */
function sessionCookieOptions(options) {
  options = options || {};

  var opts = {
    secret: options.secret || null,
    name: options.name || 'strata.session',
    path: options.path || '/',
    domain: options.domain || null,
    expireAfter: options.expireAfter || null,
    secure: options.secure || false
  };

  if ('httpOnly' in options) {
    opts.httpOnly = options.httpOnly || false;
  } else {
    opts.httpOnly = true;
  }

  return opts;
}
