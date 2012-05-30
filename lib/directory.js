var path = require("path"),
    fs = require("fs"),
    mime = require("mime"),
    strata = require("./index"),
    utils = require("./utils");

/**
 * A middleware that responds to requests that target a directory with an HTML
 * page listing that directory's contents.
 */
module.exports = function (app, root) {
    if (typeof root !== "string") {
        throw new strata.Error("Invalid root directory");
    }

    if (!path.existsSync(root)) {
        throw new strata.Error('Directory "' + root + '" does not exist');
    }

    if (!fs.statSync(root).isDirectory()) {
        throw new strata.Error('"' + root + '" is not a directory');
    }

    return function directory(env, callback) {
        var scriptName = unescape(env.scriptName),
            pathInfo = unescape(env.pathInfo);

        if (pathInfo.indexOf("..") !== -1) {
            utils.forbidden(callback);
            return;
        }

        var dir = path.join(root, pathInfo);

        path.exists(dir, function (exists) {
            if (exists) {
                fs.stat(dir, function (err, stats) {
                    if (err && strata.handleError(err, env, callback)) {
                        return;
                    }

                    if (stats.isDirectory()) {
                        generateListing(env, callback, root, pathInfo, scriptName);
                    } else {
                        app(env, callback);
                    }
                });
            } else {
                app(env, callback);
            }
        });
    }
};

var page = [
    '<html>',
    '<head>',
    '<meta http-equiv="content-type" content="text/html; charset=utf-8" />',
    '<title>{0}</title>',
    '<style type="text/css">',
    '    body { font: 14px Helvetica, Arial, sans-serif; padding: 0 10px; }',
    '    address { text-align: right; font-style: italic; }',
    '    table { width: 100%; }',
    '    tr.even { background: #f3f3f3; }',
    '    .name { text-align: left; }',
    '    .size, .type, .mtime { text-align: right; }',
    '</style>',
    '</head>',
    '<body>',
    '<h1>{1}</h1>',
    '<hr />',
    '<table cellspacing="0" cellpadding="3">',
    '<tr>',
    '    <th class="name">Name</th>',
    '    <th class="size">Size</th>',
    '    <th class="type">Type</th>',
    '    <th class="mtime">Last Modified</th>',
    '</tr>',
    '{2}',
    '</table>',
    '<hr />',
    '<address>Strata/' + strata.version.join(".") + '</address>',
    '</body>',
    '</html>'
].join("\n");

var row = [
    '<tr class="{0}">',
    '    <td class="name"><a href="{1}">{2}</a></td>',
    '    <td class="size">{3}</td>',
    '    <td class="type">{4}</td>',
    '    <td class="mtime">{5}</td>',
    '</tr>'
].join("\n");

function generateListing(env, callback, root, pathInfo, scriptName) {
    var data = [["", "../", "Parent Directory", "", "", ""]];
    var dir = path.join(root, pathInfo);

    fs.readdir(dir, function (err, files) {
        if (err && strata.handleError(err, env, callback)) {
            return;
        }

        files.forEach(function (file, index) {
            if (!path.existsSync(path.join(dir, file))) {
                return; // Ignore broken symlinks!
            }

            var name = path.join(dir, file),
                url = path.join(scriptName, pathInfo, file),
                stats = fs.statSync(name),
                mtime = stats.mtime,
                size, type;

            if (stats.isDirectory()) {
                size = "-";
                type = "directory";
                url += "/";
                file += "/";
            } else {
                size = utils.byteSizeFormat(stats.size);
                type = mime.lookup(file);
            }

            var className = index % 2 == 0 ? "even" : "odd";

            data.push([className, url, file, size, type, mtime]);
        });

        var rows = data.map(function (fileData) {
            return formatString(row, fileData);
        }).join("\n");

        var title = "Index of " + pathInfo;
        var content = formatString(page, [title, title, rows]);

        callback(200, {
            "Content-Type": "text/html",
            "Content-Length": String(Buffer.byteLength(content))
        }, content);
    });
}

function formatString(format, replace) {
    for (var i = 0, len = replace.length; i < len; ++i) {
        format = format.replace("{" + i + "}", replace[i]);
    }

    return format;
}
