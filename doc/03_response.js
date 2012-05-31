/*
# Responses

Instead of calling the response callback directly, responses may be constructed
using a `strata.Response`. These objects let you construct an HTTP response
one piece at a time instead of passing the status, headers, and body parameters
to a callback function all at once.

The following code snippet shows how the "Hello World" example from the previous
chapter can be refactored to use a `strata.Response` object.
*/

var strata = require("strata");

strata.run(function (env, callback) {
  var content = "Hello world!";

  var res = strata.Response(content);
  res.contentLength = Buffer.byteLength(content);
  res.contentType = "text/plain";

  res.send(callback);
});

/*
Save the above code to a file named `app.js` and run it with the `node`
executable:

    $ node app.js

Then view the app at [http://localhost:1982/](http://localhost:1982/).

## Getting & Setting Headers

To get the value of a header on a `strata.Response` object use its `headers`
object.

    var res = strata.Response();
    res.contentLength = 12;
    res.headers["Content-Length"]; // "12"

To set the value of a header you can use `Response#setHeader` and
`Response#addHeader`. The former will set the value of the header outright and
the latter will append a value to an existing header value.

`strata.Response` objects have getter and setter properties for all HTTP
response headers as well. Inspect `strata.Response.headers` for a full list of
all known HTTP response headers.
*/
