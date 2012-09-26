var path = require('path');
var fs = require('fs');
var Chapter = require('./manual/chapter');

var manual = [];
var manualDir = path.resolve(__dirname, '../doc');
var chapterFiles = fs.readdirSync(manualDir).filter(function (file) {
  return (/\.js$/).test(file);
}).sort().map(function (file) {
  return path.join(manualDir, file);
});

chapterFiles.forEach(function (file) {
  manual.push(new Chapter(file));
});

module.exports = manual;
