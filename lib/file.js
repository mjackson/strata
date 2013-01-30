var path = require('path');
var fs = require('fs');
var mime = require('mime');
var strata = require('./index');
var utils = require('./utils');

/**
 * A middleware for serving files efficiently from the given root directory
 * according to path contained in the pathInfo environment variable. The index
 * argument specifies what file will be served if the request targets a
 * directory. It may be a single filename (e.g. "index.html") or an array of
 * names to be tried in order (e.g. ["index.html", "index.htm"]).
 *
 * If a matching file cannot be found, the request is forwarded to the
 * downstream app. Otherwise, the file is streamed through to the callback.
 */
module.exports = function (app, root, index) {
  if (typeof root !== 'string') {
    throw new Error('Invalid root directory');
  }

  if (!fs.existsSync(root)) {
    throw new Error('Directory "' + root + '" does not exist');
  }

  if (!fs.statSync(root).isDirectory()) {
    throw new Error('"' + root + '" is not a directory');
  }

  if (index && typeof index === 'string') {
    index = [index];
  }

  function file(env, callback) {
    if (env.requestMethod !== 'GET') {
      app(env, callback);
      return;
    }

    var pathInfo = unescape(env.pathInfo);

    if (pathInfo.indexOf('..') !== -1) {
      utils.forbidden(env, callback);
      return;
    }

    var fullPath = path.join(root, pathInfo);

    fs.exists(fullPath, function (exists) {
      if (!exists) {
        app(env, callback);
        return;
      }

      fs.stat(fullPath, function (err, stats) {
        if (err && strata.handleError(err, env, callback)) {
          return;
        }

        if (stats.isFile()) {
          sendFile(callback, fullPath, stats);
        } else if (stats.isDirectory() && index) {
          // If the request targets a directory check all index
          // files to see if we can serve any of them.
          var indexExists = {};

          function sendFirstExisting() {
            var found = false,
              indexPath;

            for (var i = 0, len = index.length; !found && i < len; ++i) {
              indexPath = path.join(fullPath, index[i]);

              if (indexExists[indexPath]) {
                fs.stat(indexPath, function (err, stats) {
                  if (err && strata.handleError(err, env, callback)) {
                    return;
                  }

                  sendFile(callback, indexPath, stats);
                });

                found = true;
              }
            }

            if (!found) {
              app(env, callback);
            }
          }

          var checked = 0;

          for (var i = 0, len = index.length; i < len; ++i) {
            (function (indexPath) {
              fs.exists(indexPath, function (exists) {
                indexExists[indexPath] = exists;
                checked += 1;

                if (checked == len) {
                  sendFirstExisting();
                }
              });
            })(path.join(fullPath, index[i]));
          }
        } else {
          app(env, callback);
        }
      });
    });
  }

  return file;
};

function sendFile(callback, path, stats) {
  callback(200, {
    'Content-Type': mime.lookup(path),
    'Content-Length': stats.size.toString(),
    'Last-Modified': stats.mtime.toUTCString()
  }, fs.createReadStream(path));
}
