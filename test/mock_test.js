var assert = require("assert"),
    vows = require("vows"),
    link = require("./../lib/link"),
    mock = require("./../lib/link/mock");

vows.describe("mock").addBatch({
    "A mock Stream": {
        topic: function () {
            this.content = "hello world!";

            var stream = new mock.Stream(this.content),
                content = "",
                self = this;

            stream.on("data", function (buffer) {
                content += buffer.toString("utf8");
            });

            stream.on("end", function () {
                self.callback(null, content);
            });
        },
        "should emit its contents": function (content) {
            assert.equal(content, this.content);
        }
    },
    "A mock request to mock.empty": {
        topic: function () {
            var self = this;
            mock.request(null, null, mock.empty, function (status, headers, body) {
                self.callback(null, status, headers, body);
            });
        },
        "should return a correct status code": function (err, status, headers, body) {
            assert.equal(status, mock.empty.status);
        },
        "should return the correct headers": function (err, status, headers, body) {
            assert.deepEqual(headers, mock.empty.headers);
        },
        "should return an empty body": function (err, status, headers, body) {
            assert.equal(body, mock.empty.body);
        }
    }
}).export(module);
