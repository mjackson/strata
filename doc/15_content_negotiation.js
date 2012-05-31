/*
# Content Negotiation

Strata supports [content negotiation](http://httpd.apache.org/docs/2.0/content-negotiation.html)
for resources with various representations through the `strata.Request` module.
There are four methods on a `strata.Request` object that can help with content
negotiation:

  - `accepts`           Determines if the request headers indicate that the
                        client accepts a given media type
  - `acceptsCharset`    Determines if the request headers indicate that the
                        client accepts a given character set
  - `acceptsEncoding`   Determines if the request headers indicate that the
                        client accepts a given encoding
  - `acceptsLanguage`   Determines if the request headers indicate that the
                        client accepts a given language

The app below does some simple content negotiation to determine whether the
client accepts `text/html` responses, and sets the `Content-Type` accordingly.
*/

var strata = require("strata");

strata.use(strata.commonLogger);
strata.use(strata.contentType, "text/html")
strata.use(strata.contentLength);

strata.run(function (env, callback) {
    var req = strata.Request(env);

    if (req.accepts("text/html")) {
        callback(200, {}, "<p>You accept HTML!</p>");
    } else {
        var headers = {"Content-Type": "text/plain"};
        callback(200, headers, "You don't accept HTML. :(");
    }
});

/*
As in previous chapters, you can save the above code to a file named `app.js`
and run it with the `node` executable:

    $ node app.js

Then visit the app with a web browser at [http://localhost:1982/](http://localhost:1982/)
to get a `text/html` response. To see the `text/plain` response, you need to set
the `Accept` header accordingly. You can easily use curl for this:

    $ curl -i -H "Accept: text/plain" http://localhost:1982/
*/
