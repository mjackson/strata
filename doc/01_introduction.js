/*
# Welcome to Strata!

[Strata](http://stratajs.org) is a fast, streaming web framework for [node.js](http://nodejs.org)
that is patterned after time-honored and battle tested web application design
principles pioneered in the [Python](http://python.org/) and [Ruby](http://ruby-lang.org)
communities (see [WSGI](http://wsgi.org/wsgi/) and [Rack](http://rack.rubyforge.org/)).
Using Strata, developers can build highly performant web servers in a
powerful, modular style that is easy to maintain and takes full advantage of
the streaming capabilities and excellent I/O handling of node.js.

The goal of this manual is to introduce you to the Strata web framework in a
way that will help you get started quickly by providing clear, concise
explanations and example code. The manual is designed to be read linearly.
Earlier chapters cover the basic principles you should understand before
proceeding to later chapters, so you should start with them if you're having
trouble understanding more advanced concepts.

## Installation

To install Strata, follow the instructions in the [README](https://github.com/mjijackson/strata/blob/master/README).

This entire manual is actually written in JavaScript, so you can interact
with the examples as you work your way through the code. After installing,
you can run any of the chapters in this manual with the `strata` executable,
e.g.:

    $ strata 01_introduction.js

## Application

According to the Strata [SPEC](https://github.com/mjijackson/strata/blob/master/SPEC),
a Strata application (app) is simply a function that takes two arguments: the
environment and a callback.

The environment is simply a plain object with several CGI-like properties that
pertain to the environment the app is operating in. This object is not the same
as `process.env`. Whereas `process.env` contains information about the machine
environment the node process is running in, the Strata environment includes
information about the request, HTTP headers, the server, etc. This object is
unique to the current request.

The callback is a function that is used to send the response when the app is
ready to do so. It must be called with three arguments: the HTTP status code,
an object containing HTTP headers and their values, and the response body.

The body may be a string or a readable Stream. In the case of a Stream it is
pumped through to the client as data becomes available.

Both the environment and the callback are described in much greater detail in
the Strata [SPEC](https://github.com/mjijackson/strata/blob/master/SPEC).

## Hello World

The following example demonstrates the simplest app possible. It does not
make use of the environment because it doesn't need to. It simply sends a
string of text in an HTTP 200 response.
*/

module.exports = function (env, callback) {
    callback(200, {
        "Content-Type": "text/plain",
        "Content-Length": "12"
    }, "Hello world!");
}

/*
Remember that this file is runnable, so you can run this example if you have
a local clone of [the code](https://github.com/mjijackson/strata) using:

    $ strata 01_introduction.js
*/
