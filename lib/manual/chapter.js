var fs = require("fs"),
    path = require("path"),
    markdown = require("markdown");

module.exports = Chapter;

function Chapter(file) {
    this.file = file;

    var basename = path.basename(file, ".js");
    var parts = basename.split("_");

    // Extract chapter number from the file name.
    this.number = parts.shift();

    this._parts = parts;
}

Chapter.prototype.__defineGetter__("title", function () {
    if (!this._title) {
        // Try to get the title from the first <h1> in the file.
        var match = (this.code || "").match(/#\s+([^\n]+)/);
        if (match) {
            this._title = match[1];
        } else {
            // Guess title from the file name.
            this._title = this._parts.map(function (part) {
                return part[0].toUpperCase() + part.substring(1);
            }).join(" ");
        }
    }

    return this._title;
});

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

Chapter.prototype.__defineGetter__("html", function () {
    if (!this._html) {
        var html = markdown.parse(this.text);

        // Repair broken links whose href ends with a ")" (markdown parsing error)
        html = html.replace(/(<a.*?href=".*?)\)(".*?>.*?<\/a>)/g, "$1$2)");

        this._html = html;
    }

    return this._html;
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
