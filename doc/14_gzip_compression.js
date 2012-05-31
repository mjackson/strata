/*
# Gzip Encoding

Strata ships with a gzip module similar to Apache's [mod_deflate](http://httpd.apache.org/docs/2.0/mod/mod_deflate.html)
that allows you to compress content that you send over the network on the fly.
The main benefit of compressing content before you send it over the network is
that it can be transferred more quickly since there is less data to send,
resulting in a significant drop in overall response time.

In Strata, gzip compression is implemented as a piece of middleware. You use it
like this:

    strata.gzip(app, /text|javascript/);

As with all other Strata middleware, the `app` argument is the downstream app
whose response will be compressed. The second argument is a regular expression
that will be used to match the value of the `Content-Type` header from the
downstream app. If the expression matches, the content is compressed. Otherwise
it is passed through untouched.

The default regular expression used in Strata's gzip middleware is
`/text|javascript|json/i`. This is designed to match all text types (i.e.
`text/html`, `text/css`, etc.) as well as responses that contain JavaScript or
[JSON](http://www.json.org/). You only need to use your own regular expression
if the default doesn't suit your needs.

Since `strata.gzip` depends on reading the value of the `Content-Type` header,
it is a good idea to insert it into the middleware pipeline *upstream* from
`strata.contentType` if it's being used.

It is important to note that, thanks to Strata's excellent content negotiation
abilities, compressed responses will never be sent to clients that are not able
to accept them.

The app below demonstrates how gzip compression should be configured in front
of an app that serves static files.
*/

var path = require("path"),
    strata = require("strata");

// For the sake of this example, the root directory where we store static files
// is the current working directory (i.e. $PWD).
var root = path.resolve(".");

strata.use(strata.commonLogger);
strata.use(strata.gzip);
strata.use(strata.file, root);

strata.run();

/*
As in previous chapters, you can save the above code to a file named `app.js`
and run it with the `node` executable:

    $ node app.js

The app will serve any static files that are in the current working directory.
To observe the gzip compression, use a client that is capable of accepting gzip
encoding (i.e. sends an "Accept-Encoding: gzip" header in the request) and
request a text or JavaScript file from the app.

For example, to request the app file itself you could use [http://localhost:1982/app.js](http://localhost:1982/app.js).
*/
