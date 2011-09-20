var path = require("path"),
    fs = require("fs"),
    Chapter = require("./manual/chapter");

var manual = {};
var manualDir = path.resolve(__dirname, "../doc");
var chapterFiles = fs.readdirSync(manualDir).filter(function (file) {
    return (/\.js$/).test(file);
}).map(function (file) {
    return path.join(manualDir, file);
});

var chapter;
chapterFiles.forEach(function (file) {
    chapter = new Chapter(file);
    manual[chapter.number] = chapter;
});

module.exports = manual;
