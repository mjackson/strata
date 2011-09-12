var path = require("path"),
    fs = require("fs");

var examples = {};
examples.Example = Example;
examples.process = processExample;

module.exports = examples;

var exampleDir = path.resolve(__dirname, "../example");

var files = fs.readdirSync(exampleDir).filter(function (file) {
    return (/\.js$/).test(file);
}).map(function (file) {
    return path.join(exampleDir, file);
});

var example;
files.forEach(function (file) {
    example = new Example(file);
    examples[example.number] = example;
});

function Example(file) {
    this.file = file;

    var basename = path.basename(file, ".js");
    var parts = basename.split("_");

    this.number = parts.shift();
    this.name = parts.map(function (part) {
        return part[0].toUpperCase() + part.substring(1);
    }).join(" ");
}

Example.prototype.__defineGetter__("code", function () {
    if (!this._code) {
        this._code = fs.readFileSync(this.file, "utf8");
    }

    return this._code;
});

Example.prototype.__defineGetter__("text", function () {
    if (!this._text) {
        this._text = processExample(this.code);
    }

    return this._text;
});

function processExample(code) {
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
