var path = require('path');
var fs = require('fs');
var util = require('util');
var mime = require('mime');
var strata = require('./index');
var utils = require('./utils');

/**
 * A middleware that responds to requests that target a directory with an HTML
 * page listing that directory's contents.
 */
module.exports = function (app, root) {
  if (typeof root !== 'string') {
    throw new Error('Invalid root directory');
  }

  if (!fs.existsSync(root)) {
    throw new Error('Directory "' + root + '" does not exist');
  }

  if (!fs.statSync(root).isDirectory()) {
    throw new Error('"' + root + '" is not a directory');
  }

  function directory(env, callback) {
    var scriptName = unescape(env.scriptName);
    var pathInfo = unescape(env.pathInfo);

    if (pathInfo.indexOf('..') !== -1) {
      utils.forbidden(callback);
      return;
    }

    var dir = path.join(root, pathInfo);

    fs.exists(dir, function (exists) {
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

  return directory;
};

var page = [
  '<html>',
  '<head>',
  '<meta http-equiv="content-type" content="text/html; charset=utf-8" />',
  '<title>%s</title>',
  '<style type="text/css">',
  '  body { font: 14px Helvetica, Arial, sans-serif; padding: 0 10px; }',
  '  address { text-align: right; font-style: italic; }',
  '  table { width: 100%; }',
  '  tr.even { background: #f3f3f3; }',
  '  .name { text-align: left; }',
  '  .size, .type, .mtime { text-align: right; }',
  '</style>',
  '</head>',
  '<body>',
  '<h1>%s</h1>',
  '<hr />',
  '<table cellspacing="0" cellpadding="3">',
  '<tr>',
  '  <th class="name">Name</th>',
  '  <th class="size">Size</th>',
  '  <th class="type">Type</th>',
  '  <th class="mtime">Last Modified</th>',
  '</tr>',
  '%s',
  '</table>',
  '<hr />',
  '<address>%s/%s</address>',
  '</body>',
  '</html>'
].join('\n');

var row = [
  '<tr class="%s">',
  '  <td class="name"><a href="%s">%s</a></td>',
  '  <td class="size">%s</td>',
  '  <td class="type">%s</td>',
  '  <td class="mtime">%s</td>',
  '</tr>'
].join('\n');

function generateListing(env, callback, root, pathInfo, scriptName) {
  var dir = path.join(root, pathInfo);
  var rows = util.format(row, '', '../', 'Parent Directory', '', '', '');

  fs.readdir(dir, function (err, files) {
    if (err && strata.handleError(err, env, callback)) {
      return;
    }

    files.forEach(function (file, index) {
      if (!fs.existsSync(path.join(dir, file))) {
        return; // Ignore broken symlinks!
      }

      var name = path.join(dir, file);
      var url = path.join(scriptName, pathInfo, file);
      var stats = fs.statSync(name);
      var mtime = stats.mtime;
      var size, type;

      if (stats.isDirectory()) {
        size = '-';
        type = 'directory';
        url += '/';
        file += '/';
      } else {
        size = utils.byteSizeFormat(stats.size);
        type = mime.lookup(file);
      }

      var className = index % 2 === 0 ? 'even' : 'odd';

      rows += '\n';
      rows += util.format(row, className, url, file, size, type, mtime);
    });

    var title = 'Index of ' + pathInfo;
    var name = 'Strata';
    var version = strata.version;
    var content = util.format(page, title, title, rows, name, version);

    callback(200, {
      'Content-Type': 'text/html',
      'Content-Length': Buffer.byteLength(content)
    }, content);
  });
}
