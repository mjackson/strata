var assert = require("assert"),
    vows = require("vows"),
    Response = require("./../lib/response");

vows.describe("response").addBatch({
    "A Response": {
        topic: function () {
            this.status = 200;
            this.body = "hello world";
            this.contentType = "text/plain";
            this.contentLength = this.body.length.toString(10);
            this.headers = {
                "Content-Type": this.contentType,
                "Content-Length": this.contentLength
            };

            var res = new Response(this.body, this.headers, this.status);

            return res;
        },
        "should know its status": function (res) {
            assert.equal(res.status, this.status);
        },
        "should know its headers": function (res) {
            assert.deepEqual(res.headers, this.headers);
        },
        "should know its body": function (res) {
            assert.equal(res.body, this.body);
        },
        "should know its content type": function (res) {
            assert.equal(res.contentType, this.contentType);
        },
        "should know its content length": function (res) {
            assert.equal(res.contentLength, this.contentLength);
        },
        "with a redirect": {
            topic: function (res) {
                this.location = "http://www.example.com";
                this.status = 301;

                res.redirect(this.location, this.status);

                return res;
            },
            "should know its new location": function (res) {
                assert.equal(res.location, this.location);
            },
            "should know its new status": function (res) {
                assert.equal(res.status, this.status);
            }
        },
        "with a cookie string": {
            topic: function () {
                this.name = "the_cookie";
                this.value = "the value";

                var res = new Response;
                res.setCookie(this.name, this.value);

                return res;
            },
            "should have the correct Set-Cookie header": function (res) {
                assert.ok(res.headers["Set-Cookie"]);
                assert.equal(res.headers["Set-Cookie"], "the_cookie=the%20value");
                res.removeCookie(this.name, this.value);
                assert.equal(res.headers["Set-Cookie"], "the_cookie=; expires=Thu, 01 Jan 1970 00:00:00 GMT");
            }
        },
        "with a cookie object": {
            topic: function () {
                this.name = "the_cookie";
                this.value = {
                    value: "the value",
                    domain: "example.org",
                    path: "/account",
                    expires: new Date(98765432100)
                };

                var res = new Response;
                res.setCookie(this.name, this.value);

                return res;
            },
            "should have the correct Set-Cookie header": function (res) {
                assert.ok(res.headers["Set-Cookie"]);
                assert.equal(res.headers["Set-Cookie"], "the_cookie=the%20value; domain=example.org; path=/account; expires=Sat, 17 Feb 1973 02:50:32 GMT");
                res.removeCookie(this.name, this.value);
                assert.equal(res.headers["Set-Cookie"], "the_cookie=; domain=example.org; path=/account; expires=Thu, 01 Jan 1970 00:00:00 GMT");
            }
        },
        "with two cookies": {
            topic: function () {
                this.firstName = "cookie1";
                this.firstValue = {
                    value: "value 1",
                    domain: "example.org",
                    path: "/account",
                    expires: new Date(98765432100)
                };

                this.secondName = "cookie2";
                this.secondValue = {
                    value: "value 2",
                    domain: "example.net",
                    path: "/users",
                    expires: new Date(98765432100)
                };

                var res = new Response;
                res.setCookie(this.firstName, this.firstValue);
                res.setCookie(this.secondName, this.secondValue);

                return res;
            },
            "should have the correct Set-Cookie header": function (res) {
                assert.ok(res.headers["Set-Cookie"]);
                assert.equal(res.headers["Set-Cookie"], "cookie1=value%201; domain=example.org; path=/account; expires=Sat, 17 Feb 1973 02:50:32 GMT\ncookie2=value%202; domain=example.net; path=/users; expires=Sat, 17 Feb 1973 02:50:32 GMT");
                res.removeCookie(this.firstName, this.firstValue);
                assert.equal(res.headers["Set-Cookie"], "cookie2=value%202; domain=example.net; path=/users; expires=Sat, 17 Feb 1973 02:50:32 GMT\ncookie1=; domain=example.org; path=/account; expires=Thu, 01 Jan 1970 00:00:00 GMT");
            }
        },
        "with two cookies from the same domain": {
            topic: function () {
                this.firstName = "cookie1";
                this.firstValue = {
                    value: "value 1",
                    domain: "example.org"
                };

                this.secondName = "cookie2";
                this.secondValue = {
                    value: "value 2",
                    domain: "example.org"
                };

                var res = new Response;
                res.setCookie(this.firstName, this.firstValue);
                res.setCookie(this.secondName, this.secondValue);

                return res;
            },
            "should have the correct Set-Cookie header": function (res) {
                assert.ok(res.headers["Set-Cookie"]);
                assert.equal(res.headers["Set-Cookie"], "cookie1=value%201; domain=example.org\ncookie2=value%202; domain=example.org");
                res.removeCookie(this.firstName, this.firstValue);
                assert.equal(res.headers["Set-Cookie"], "cookie2=value%202; domain=example.org\ncookie1=; domain=example.org; expires=Thu, 01 Jan 1970 00:00:00 GMT");
            }
        }
    }
}).export(module);
