var path = require("path"),
    fs = require("fs"),
    strata = require("./index"),
    mime = require("./mime");

/**
 * A middleware for serving files efficiently from the given +root+ directory
 * according to path contained in the pathInfo environment variable. The +index+
 * argument specifies what file will be served if the request targets a
 * directory. It may be a single filename (e.g. "index.html") or an array of
 * names to be tried in order (e.g. ["index.html", "index.htm"]).
 *
 * If a matching file cannot be found, the request is forwarded to the
 * downstream app. Otherwise, the file is streamed through to the callback.
 */
module.exports = function (app, root, index) {
    if (typeof root != "string") {
        throw new strata.Error("Invalid root directory");
    }

    if (path.existsSync(root)) {
        var stats = fs.statSync(root);
        if (!stats.isDirectory()) {
            throw new strata.Error('"' + root + '" is not a directory')
        }
    } else {
        throw new strata.Error('Directory "' + root + '" does not exist');
    }

    if (index && typeof index == "string") {
        index = [index];
    }

    return function stat(env, callback) {
        var fullPath = path.join(root, env.pathInfo);

        if (!path.existsSync(fullPath)) {
            app(env, callback);
            return;
        }

        var stats = fs.statSync(fullPath);

        // Serve an index file if a directory was requested.
        if (stats.isDirectory() && index) {
            var indexPath;
            for (var i = 0, len = index.length; i < len; ++i) {
                indexPath = path.join(fullPath, index[i]);
                if (path.existsSync(indexPath)) {
                    fullPath = indexPath;
                    stats = fs.statSync(fullPath);
                    break;
                }
            }
        }

        if (!stats.isFile()) {
            app(env, callback);
            return;
        }

        callback(200, {
            "Content-Type": mime.type(path.extname(fullPath)),
            "Content-Length": stats.size,
            "Last-Modified": stats.mtime.toUTCString()
        }, fs.createReadStream(fullPath));
    }
}
