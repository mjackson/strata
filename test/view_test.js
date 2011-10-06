var assert = require("assert"),
    vows = require("vows"),
    view = require("./../lib/view");

vows.describe("view").addBatch({
    "compile": {
        "should throw when the template contains an error": function () {
            var template = [
                '<% if (name) { %>',
                'Hi <%= name %>!',
                '<%  else { %>', // error!
                'Hi unknown!',
                '<% } %>'
            ].join("");

            assert.throws(function () {
                view.compile(template);
            }, SyntaxError);
        }
    },
    "render": {
        "without prefixed variables": renderContext(),
        "with prefixed variables": renderContext("locals")
    }
}).export(module);

function renderContext(prefix) {
    function varname(name) {
        if (prefix) {
            return prefix + "." + name;
        }

        return name;
    }

    return {
        "with an empty template": {
            topic: function () {
                return view.compile("");
            },
            "and no variables": {
                topic: function (render) {
                    return render();
                },
                "should render properly": function (output) {
                    assert.equal(output, "");
                }
            },
            "and a random variable": {
                topic: function (render) {
                    return render({name: "michael"});
                },
                "should render properly": function (output) {
                    assert.equal(output, "");
                }
            }
        },
        "with a template with no variables": {
            topic: function () {
                return view.compile("<p></p>");
            },
            "and no variables": {
                topic: function (render) {
                    return render();
                },
                "should render properly": function (output) {
                    assert.equal(output, "<p></p>");
                }
            },
            "and a random variable": {
                topic: function (render) {
                    return render({name: "michael"});
                },
                "should render properly": function (output) {
                    assert.equal(output, "<p></p>");
                }
            }
        },
        'with an escaping template with a single variable named "name"': {
            topic: function () {
                return view.compile("<p><%= " + varname("name") + " %></p>");
            },
            "and no variables": {
                "should throw": function (render) {
                    if (prefix) {
                        assert.doesNotThrow(render);
                    } else {
                        assert.throws(render, ReferenceError);
                    }
                }
            },
            "and a variable": {
                topic: function (render) {
                    return render({name: "michael"});
                },
                "should render properly": function (output) {
                    assert.equal(output, "<p>michael</p>");
                }
            },
            "and an unescaped variable": {
                topic: function (render) {
                    return render({name: "<michael>"});
                },
                "should render properly": function (output) {
                    assert.equal(output, "<p>&lt;michael&gt;</p>");
                }
            }
        },
        'with a non-escaping template with a single variable named "name"': {
            topic: function () {
                return view.compile("<p><%- " + varname("name") + " %></p>");
            },
            "and no variables": {
                "should throw": function (render) {
                    if (prefix) {
                        assert.doesNotThrow(render);
                    } else {
                        assert.throws(render, ReferenceError);
                    }
                }
            },
            "and a variable": {
                topic: function (render) {
                    return render({name: "michael"});
                },
                "should render properly": function (output) {
                    assert.equal(output, "<p>michael</p>");
                }
            },
            "and an unescaped variable": {
                topic: function (render) {
                    return render({name: "<michael>"});
                },
                "should render properly": function (output) {
                    assert.equal(output, "<p><michael></p>");
                }
            }
        },
        "with a template that contains some simple logic": {
            topic: function () {
                var template = [
                    '<% if (' + varname("name") + ') { %>',
                    'Hi <%= ' + varname("name") + ' %>!',
                    '<% } else { %>',
                    'Hi unknown!',
                    '<% } %>'
                ].join("");

                return view.compile(template);
            },
            "and no variables": {
                "should throw": function (render) {
                    if (prefix) {
                        assert.doesNotThrow(render);
                    } else {
                        assert.throws(render, ReferenceError);
                    }
                }
            },
            "and a variable": {
                topic: function (render) {
                    return render({name: "michael"});
                },
                "should render properly": function (output) {
                    assert.equal(output, "Hi michael!");
                }
            },
            "and an undefined variable": {
                topic: function (render) {
                    return render({name: undefined});
                },
                "should render properly": function (output) {
                    assert.equal(output, "Hi unknown!");
                }
            }
        },
        "with a template that contains a for loop": {
            topic: function () {
                var template = [
                    '<% for (var id in ' + varname("users") + ') { %>',
                    '<% var user = users[id]; %>',
                    'Hi <%= user.name %>!',
                    '<% } %>'
                ].join("");

                return view.compile(template);
            },
            "and no variables": {
                "should throw": function (render) {
                    if (prefix) {
                        assert.doesNotThrow(render);
                    } else {
                        assert.throws(render, ReferenceError);
                    }
                }
            },
            "and a variable": {
                topic: function (render) {
                    return render({users: {"1": {name: "michael"}, "2": {name: "jackson"}}});
                },
                "should render properly": function (output) {
                    assert.equal(output, "Hi michael!Hi jackson!");
                }
            }
        },
        "with a template that conditionally throws an error": {
            topic: function () {
                var template = [
                    '<% if (' + varname("name") + ') { %>',
                    '<%   throw new Error("Bang!"); %>',
                    '<% } %>'
                ].join("");

                return view.compile(template);
            },
            "should throw when the condition is satisfied": function (render) {
                assert.throws(function () {
                    render({name: "michael"});
                });
            },
            "should not throw when the condition is not satisfied": function (render) {
                assert.doesNotThrow(function () {
                    render({name: false});
                });
            }
        }
    };
}
