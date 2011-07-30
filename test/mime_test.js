var assert = require("assert"),
    vows = require("vows"),
    mime = require("./../lib/link/mime");

vows.describe("mime").addBatch({
    "A known mime type": {
        "without a default given": {
            topic: mime.type(".js"),
            "returns the correct type": function (topic) {
                assert.equal(topic, "application/javascript");
            }
        },
        "with a default given": {
            topic: mime.type(".js", "text/plain"),
            "returns the correct type": function (topic) {
                assert.equal(topic, "application/javascript");
            }
        }
    },
    "An unknown mime type": {
        "without a default given": {
            topic: mime.type(".unknown"),
            "returns application/octet-stream": function (topic) {
                assert.equal(topic, "application/octet-stream");
            }
        },
        "with a default given": {
            topic: mime.type(".unknown", "text/plain"),
            "returns the default type": function (topic) {
                assert.equal(topic, "text/plain");
            }
        }
    }
}).export(module);
