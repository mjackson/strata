/*
# Content Negotiation

Strata supports [content negotiation](http://httpd.apache.org/docs/2.0/content-negotiation.html)
for resources with various representations through the `strata.Request` module.
There are currently four methods on a `strata.Request` object that can help with
content negotiation:

  - `accept`            Determines if the request headers indicate that the
                        client accepts a given media type
  - `acceptCharset`     Determines if the request headers indicate that the
                        client accepts a given character set
  - `acceptEncoding`    Determines if the request headers indicate that the
                        client accepts a given encoding
  - `acceptLanguage`    Determines if the request headers indicate that the
                        client accepts a given language

The app below does some simple content negotiation to determine whether the
client accepts `text/html` responses, and sets the `Content-Type` accordingly.
*/

var strata = require("strata");
var app = new strata.Builder;

app.use(strata.commonLogger);
app.use(strata.contentLength);

app.get("/", function (env, callback) {
    var req = new strata.Request(env);

    if (req.accept("text/html")) {
        callback(200, {"Content-Type": "text/html"}, "<p>You accept HTML!</p>");
    } else {
        callback(200, {"Content-Type": "text/plain"}, "You don't accept HTML. :(");
    }
});

strata.run(app);

/*
As in previous chapters, you can save the above code to a file named `app.js`
and run it with the `node` executable:

    $ node app.js

Then visit the app with a web browser at [http://localhost:1982/](http://localhost:1982/)
to get a `text/html` response. To see the `text/plain` response, you need to set
the `Accept` header accordingly. You can easily use curl for this:

    $ curl -i -H "Accept: text/plain" http://localhost:1982/
*/
