var path = require('path');
var fs = require('fs');
var mime = require('mime');
var when = require('when');
var strata = require('./index');
var utils = require('./utils');
module.exports = fileMiddleware;

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
function fileMiddleware(app, root, index) {
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
    index = [ index ];
  }

  return function (env, callback) {
    if (env.requestMethod !== 'GET') {
      return app(env, callback);
    }

    var pathInfo = env.pathInfo;
    if (pathInfo.indexOf('..') !== -1) {
      return utils.forbidden(env, callback);
    }

    var fullPath = path.join(root, pathInfo);

    getStat(fullPath).then(function (stat) {
      if (!stat) {
        return app(env, callback);
      }

      if (stat.isFile()) {
        return sendFile(callback, fullPath, stat);
      }

      // If the request targets a directory check all index
      // files to see if we can serve any of them.
      if (stat.isDirectory() && index) {
        var indexPaths = index.map(function (file) {
          return path.join(fullPath, file);
        });

        return when.all(indexPaths.map(getStat)).then(function (stats) {
          for (var i = 0, len = stats.length; i < len; ++i) {
            if (stats[i]) {
              return sendFile(callback, indexPaths[i], stats[i]);
            }
          }

          app(env, callback);
        });
      }

      app(env, callback);
    });
  };
}

var statFile = require('when/node/function').lift(fs.stat);

// Attempt to get a stat for the given file. Return null if it
// does not exist.
function getStat(file) {
  return statFile(file).then(null, function (error) {
    if (isMissingFileError(error)) {
      return null;
    }

    throw error;
  });
}

function isMissingFileError(error) {
  return error.code === 'ENOENT';
}

function sendFile(callback, path, stats) {
  callback(200, {
    'Content-Type': mime.lookup(path),
    'Content-Length': stats.size.toString(),
    'Last-Modified': stats.mtime.toUTCString()
  }, fs.createReadStream(path));
}
