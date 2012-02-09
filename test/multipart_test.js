var assert = require("assert"),
    vows = require("vows"),
    fs = require("fs"),
    path = require("path"),
    multipart = require("./../lib/multipart");

vows.describe("multipart").addBatch({
    "A Parser": {
        'with boundary of "abc"': {
            topic: new multipart.Parser("abc"),
            "should have the correct boundary": function (parser) {
                assert.deepEqual(Array.prototype.slice.call(parser.boundary), [13, 10, 45, 45, 97, 98, 99]);
                assert.deepEqual(parser.boundaryChars, {10: true, 13: true, 45: true, 97: true, 98: true, 99: true});
            },
            "should be in the START state": function (parser) {
                assert.equal(parser.state, multipart.START);
            }
        },
        "for a message with a content type and no filename": {
            topic: parseFixture("content_type_no_filename"),
            "should correctly parse the text contents": function (params) {
                assert.equal("contents", params.text);
            }
        },
        "for a webkit style message boundary": {
            topic: parseFixture("webkit", "----WebKitFormBoundaryWLHCs9qmcJJoyjKR"),
            "should correctly parse": function (params) {
                assert.equal(params._method, "put");
                assert.equal(params["profile[blog]"], "");
                assert.equal(params.media, "");
                assert.equal(params.commit, "Save");
            }
        },
        "for a text file upload": {
            topic: parseFixture("text"),
            "should correctly parse the text parameters": function (params) {
                assert.equal(params["submit-name"], "Larry");
                assert.equal(params["submit-name-with-content"], "Berry");
            },
            "should correctly parse the file name": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.equal(file.name, "file1.txt");
            },
            "should correctly parse the file content type": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.equal(file.type, "text/plain");
            },
            "should correctly parse the file's contents": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.equal(fs.readFileSync(file.path, "utf8"), "contents");
            }
        },
        "for a binary file upload": {
            topic: parseFixture("binary"),
            "should correctly parse the text parameters": function (params) {
                assert.equal("Larry", params["submit-name"]);
            },
            "should correctly parse the file name": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.equal("rack-logo.png", file.name);
            },
            "should correctly parse the file content type": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.equal(file.type, "image/png");
            },
            "should correctly parse the file's contents": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.equal(fs.readFileSync(file.path).length, 26473);
            }
        },
        "for a text file upload using IE-style filename": {
            topic: parseFixture("text_ie"),
            "should correctly parse and clean up the file name": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.equal(file.name, "file1.txt");
            },
            "should correctly parse the file content type": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.equal(file.type, "text/plain");
            },
            "should correctly parse the file's contents": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.equal(fs.readFileSync(file.path, "utf8"), "contents");
            }
        },
        "for a multipart/mixed message": {
            topic: parseFixture("mixed_files"),
            "should correctly part a text field": function (params) {
                assert.equal(params.foo, "bar");
            },
            "should correctly parse a nested multipart message": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.equal(252, file.length);
            }
        },
        "for a message with no file selected": {
            topic: parseFixture("none"),
            "should return the field as an empty string": function (params) {
                var file = params.files;
                assert.ok(typeof file !== "undefined");
                assert.equal(file, "");
            }
        },
        "for a message with a filename with escaped quotes": {
            topic: parseFixture("filename_with_escaped_quotes"),
            "should correctly parse the file name": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.ok(file.name);
                assert.equal(file.name, 'escape "quotes');
            },
            "should correctly parse the file content type": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.ok(file.type);
                assert.equal(file.type, "application/octet-stream");
            },
            "should correctly parse the file's contents": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.ok(file.path);
                assert.equal(fs.readFileSync(file.path, "utf8"), "contents");
            }
        },
        "for a message with a filename with unescaped quotes": {
            topic: parseFixture("filename_with_unescaped_quotes"),
            "should correctly parse the file name": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.ok(file.name);
                assert.equal(file.name, 'escape "quotes');
            },
            "should correctly parse the file content type": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.ok(file.type);
                assert.equal(file.type, "application/octet-stream");
            },
            "should correctly parse the file's contents": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.ok(file.path);
                assert.equal(fs.readFileSync(file.path, "utf8"), "contents");
            }
        },
        "for a message with a filename with percent escaped quotes": {
            topic: parseFixture("filename_with_percent_escaped_quotes"),
            "should correctly parse the file name": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.ok(file.name);
                assert.equal(file.name, 'escape "quotes');
            },
            "should correctly parse the file content type": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.ok(file.type);
                assert.equal(file.type, "application/octet-stream");
            },
            "should correctly parse the file's contents": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.ok(file.path);
                assert.equal(fs.readFileSync(file.path, "utf8"), "contents");
            }
        },
        "for a message with a filename and modification-date param": {
            topic: parseFixture("filename_and_modification_param"),
            "should correctly parse the file name": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.ok(file.name);
                assert.equal(file.name, "genome.jpeg");
            },
            "should correctly parse the file content type": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.ok(file.type);
                assert.equal(file.type, "image/jpeg");
            },
            "should correctly parse the file's contents": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.ok(file.path);
                assert.equal(fs.readFileSync(file.path, "utf8"), "contents");
            }
        },
        "for a message with a filename with unescaped quotes and modification-date param": {
            topic: parseFixture("filename_with_unescaped_quotes_and_modification_param"),
            "should correctly parse the file name": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.ok(file.name);
                assert.equal(file.name, '"human" genome.jpeg');
            },
            "should correctly parse the file content type": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.ok(file.type);
                assert.equal(file.type, "image/jpeg");
            },
            "should correctly parse the file's contents": function (params) {
                var file = params.files;
                assert.ok(file);
                assert.ok(file.path);
                assert.equal(fs.readFileSync(file.path, "utf8"), "contents");
            }
        }
    }
}).export(module);

var tmpdir = path.join(__dirname, "tmp");
var prefix = "multipart-";

if (!process.env.DIRTY) {
    process.on("exit", function () {
        var files = fs.readdirSync(tmpdir);
        for (var i = 0; i < files.length; ++i) {
            if (files[i].substring(0, prefix.length) === prefix) {
                fs.unlinkSync(path.join(tmpdir, files[i]));
            }
        }
    });
}

function makeParser(boundary, callback) {
    var parser = new multipart.Parser(boundary, tmpdir, prefix),
        params = {};

    parser.onParam = function (name, value) {
        params[name] = value;
    };

    var ended = false;

    parser.onEnd = function () {
        assert.ok(!ended); // onEnd should only be called once
        ended = true;
        callback(null, params);
    };

    return parser;
}

function parseFixture(filename, boundary) {
    boundary = boundary || "AaB03x";

    return function () {
        var buffer = fs.readFileSync(path.join(__dirname, "_files", filename));
        var parser = makeParser(boundary, this.callback);
        assert.equal(parser.write(buffer), buffer.length);
        assert.doesNotThrow(function () {
            parser.end();
        });
    }
}
