var utils = require("./utils");

exports.clearCache = clearCache;
exports.parse = parse;
exports.compile = compile;
exports.render = render;
exports.renderFile = renderFile;

exports.tags = ["<%", "%>"];

var cache = {};

/**
 * Clears the cache of pre-compiled templating functions.
 */
function clearCache() {
    cache = {};
}

/**
 * Parses the given `template` and returns a string that should be the body of
 * the compiled function to render it. The `options` may contain any of the
 * following properties:
 *
 *   - tags         An array of the [start, close] tags used in the template
 */
function parse(template, options) {
    options = options || {};

    var tags = options.tags || exports.tags;
    var open = tags[0];
    var close = tags[1];

    var code = ["with (locals) {", "\n__buffer.push('"];

    var line = 1, c;
    for (var i = 0, len = template.length; i < len; ++i) {
        if (template.slice(i, i + open.length) == open) {
            i += open.length

            var prefix, suffix, __line = "__line = " + line;
            switch (template.substr(i, 1)) {
            case "=":
                prefix = "', escape((" + __line + ", ";
                suffix = ")), '";
                ++i;
                break;
            case "-":
                prefix = "', String((" + __line + ", ";
                suffix = ")), '";
                ++i;
                break;
            default:
                prefix = "');\n" + __line + ";\n";
                suffix = "\n__buffer.push('";
            }

            var end = template.indexOf(close, i),
                js = template.substring(i, end),
                n = 0;

            while (~(n = js.indexOf("\n", n))) {
                n++;
                line++;
            }

            code.push(prefix, js, suffix);

            i += end - i + close.length - 1;
        } else {
            c = template.substr(i, 1);

            switch (c) {
            case "'":
                code.push("\\'");
                break;
            case "\\":
                code.push("\\\\");
                break;
            case "\n":
                code.push("\\n");
                line++;
                break;
            default:
                code.push(c);
            }
        }
    }

    code.push("');", "\n}");

    return code.join("");
}

/**
 * Returns a function renders the given `template`. The `options` may contain
 * any of the properties needed to parse the template (see view.parse) or any
 * of the following properties:
 *
 *   - filename     The name of the file the template comes from
 *   - cache        Set false to bypass the cache and force a re-compile
 *   - escape       A function for escaping template values
 *   - debug        Set true to print the body of the generated function to the
 *                  console
 */
function compile(template, options) {
    options = options || {};

    // Return a pre-compiled function from the cache if we have one.
    if (cache[template] && options.cache !== false) {
        return cache[template];
    }

    var code = parse(template, options);

    if (options.debug) {
        console.log(code);
    }

    // Wrap in a try/catch to catch any errors.
    code = [
        'var __template = ' + JSON.stringify(template) + ';',
        'var __file = ' + (options.filename ? JSON.stringify(options.filename) : 'undefined') + ';',
        'var __line = 1;',
        'var __buffer = [];',
        'try {',
        code,
        '} catch (err) {',
        '    var lines = __template.split("\\n");',
        '    var start = Math.max(__line - 3, 0);',
        '    var end = Math.min(lines.length, __line + 3);',
        '    var context = lines.slice(start, end).map(function (line, i) {',
        '        var c = i + start + 1;',
        '        return (c == __line ? " >> " : "    ") + c + "| " + line;',
        '    }).join("\\n");',
        '    err.path = __file;',
        '    err.message = (__file || "view") + ":" + __line + "\\n" + context + "\\n\\n" + err.message;',
        '    throw err;',
        '}',
        'return __buffer.join("");'
    ].join("\n");

    var escape = options.escape || utils.escapeHtml;
    var inner = new Function("locals, escape", code);
    var outer = function (locals) {
        return inner(locals || {}, escape);
    }

    // Update the cache.
    cache[template] = outer;

    return outer;
}

/**
 * Helper for rendering a `template` with the given `locals`.
 */
function render(template, locals) {
    return compile(template)(locals);
}

/**
 * Helper for rendering the contents of the given `file` with `locals`.
 */
function renderFile(file, locals, encoding) {
    return render(fs.readFileSync(file, encoding || "utf8"), locals);
}
