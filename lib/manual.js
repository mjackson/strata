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

function processChapter(code) {
    var lines = code.split("\n"),
        output = [],
        buffer = [];

    function addDocs(line) {
        output.push(line.substring(3));
    }

    function addCode(line) {
        output.push("    " + line);
    }

    var line, next;
    for (var i = 0, len = lines.length; i < len; ++i) {
        line = lines[i];

        if ((/^\/\//).test(line)) {
            // This line is a single-line JavaScript comment.
            next = lines[i + 1];

            if (!next) {
                // If the next line is empty this line is a doc.
                if (buffer.length) {
                    buffer.forEach(addDocs);
                    buffer = [];
                }
                addDocs(line);
            } else if ((/^\/\//).test(next)) {
                // If it's a comment we need to buffer to the end of the
                // comment block to determine if it's a doc or code.
                buffer.push(line);
            } else {
                // Otherwise it's code.
                if (buffer.length) {
                    buffer.forEach(addCode);
                    buffer = [];
                }
                addCode(line);
            }
        } else {
            // This line is code.
            if (buffer.length) {
                buffer.forEach(addCode);
                buffer = [];
            }
            addCode(line);
        }
    }

    if (buffer.length) {
        buffer.forEach(addDocs);
    }

    return output.join("\n");
}
