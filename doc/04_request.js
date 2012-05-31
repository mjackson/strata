/*
# Requests

The `strata.Request` module provides a convenient interface to retrieving
information about the incoming request. You instantiate a `Request` object with
one argument: the **environment**.

    var req = strata.Request(env);

A `Request` uses the environment to read information about the incoming request
and even cache the results of certain operations (e.g. parsing the request body)
to speed up execution later. It is able to reconstruct the original request URL,
which is useful when creating links to other locations in the same app, and it
is reverse-proxy aware.

## Parameters

One of the most common tasks in building a web app is retrieving request
parameters that were sent by the client in either the URL query string or the
request body. It includes support for parsing all of the following content
types:

  - `application/x-www-form-urlencoded`
  - `application/json`
  - `multipart/form-data`
  - `multipart/related`
  - `multipart/mixed`

Several methods are available for retrieving request parameters:

  - `Request#query` provides parameters that were sent in the URL query string
    (i.e. GET parameters)
  - `Request#body` provides parameters that were sent in the request body
    (i.e. POST parameters)
  - `Request#params` provides the *union* of both query and body parameters

Each of these functions requires a single callback that will be called with two
arguments: any error that occured when parsing and an object of parameters.

The sample app below demonstrates how to use `Request#params` to retrieve all
parameters in one call. After parsing out the parameters, they are simply
encoded as JSON and returned to the client in an `application/json` response.
*/

var strata = require("strata");

strata.run(function (env, callback) {
    var req = strata.Request(env);

    req.params(function (err, params) {
        // Ignoring the err argument for now. See the next chapter!

        var content = JSON.stringify(params);

        var res = strata.Response(content);
        res.contentType = "application/json";
        res.contentLength = Buffer.byteLength(content);

        res.send(callback);
    });
});

/*
As in the previous chapter, you can save the above code to a file named `app.js`
and run it with the `node` executable:

    $ node app.js

Then view the app at [http://localhost:1982/](http://localhost:1982/).

To fully test out Strata's request parameter parsing capabilities, try sending
various parameters to the app in the query string and request body. For example,
to send an `application/x-www-url-formencoded` POST, you can use [cURL](http://curl.haxx.se/):

    $ curl -v --data "a=b&c=d" http://localhost:1982/

To see how Strata handles `application/json` request bodies, you can try:

    $ curl -v -H "Content-Type: application/json" --data '{"a":"b"}' http://localhost:1982/

Strata natively supports `application/json`, `application/x-www-url-formencoded`,
and `multipart/form-data` parsing, as well as several other multipart subtypes.

## Precedence

I stated earlier that a call to `Request#params` returns the *union* of both
query string and request body parameters. In this case, body parameters with the
same name as query string parameters always take precedence.

For example, imagine the following request is issued to the sample app above:

    $ curl -v --data "a=z&c=d" http://localhost:1982/?a=b

In this case, the parameter `a` is present in both the query string *and* the
request body. Since it is present in both places, the value of the parameter
will be the value as it is specified in the body. Thus, the response from our
app will be `{"a":"z","c":"d"}`.

However, if we modify the app to use `Request#query` instead of `Request#params`
(i.e. we change `req.params` to `req.query`) and issued the same request we
would get a response of `{"a":"b"}` because only parameters from the query
string would be parsed into the `query` object.

You are encouraged to experiment for yourself with the example app above to get
a good feel for how Strata's request parameter parsing works before proceeding
to the next chapter.
*/
