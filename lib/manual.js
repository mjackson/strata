var path = require("path"),
    fs = require("fs");

var manual = {};
manual.Chapter = Chapter;
manual.processChapter = processChapter;

module.exports = manual;

var manualDir = path.resolve(__dirname, "../doc");
var files = fs.readdirSync(manualDir).filter(function (file) {
    return (/\.js$/).test(file);
}).map(function (file) {
    return path.join(manualDir, file);
});

var chapter;
files.forEach(function (file) {
    chapter = new Chapter(file);
    manual[chapter.number] = chapter;
});

function Chapter(file) {
    this.file = file;

    var basename = path.basename(file, ".js");
    var parts = basename.split("_");

    // Extract chapter number and title from the file name.
    this.number = parts.shift();
    this.title = parts.map(function (part) {
        return part[0].toUpperCase() + part.substring(1);
    }).join(" ");
}

Chapter.prototype.__defineGetter__("code", function () {
    if (!this._code) {
        this._code = fs.readFileSync(this.file, "utf8");
    }

    return this._code;
});

Chapter.prototype.__defineGetter__("text", function () {
    if (!this._text) {
        this._text = processChapter(this.code);
    }

    return this._text;
});

function processChapter(chapter) {
    var lines = chapter.split("\n"),
        inCode = true,
        output = [];

    // Doc sections start with a line containing only a /* and end
    // with a line containing only a */
    lines.forEach(function (line) {
        if (line == "/*") {
            inCode = false;
        } else if (line == "*/") {
            inCode = true;
        } else if (inCode) {
            output.push("    " + line);
        } else {
            output.push(line);
        }
    });

    return output.join("\n");
}
