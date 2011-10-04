Strata is a fast, streaming web framework for node.js that is patterned after
time-honored and battle tested web application design principles pioneered in
the Python and Ruby communities (see WSGI and Rack). Using Strata, developers
can build highly performant web servers in a powerful, modular style that is
easy to maintain and takes full advantage of the streaming capabilities and
excellent I/O handling of node.js.

The core Strata distribution consists of three things:

  - A specification (see SPEC) for building applications and middleware
  - A library (see lib) with many useful utilities and middleware to aid
    developers in the common tasks of building applications that conform to
    the specification
  - An executable (see bin/strata) for running Strata applications from the
    command line

# Rationale

Strata was created to provide a stable platform for the development of complex,
modular web applications on node.js. At the time it was created, there already
existed two major alternatives for building web applications on node.js:
Connect/Express and JSGI. This section of this document explains why Strata was
written despite the existence of these libraries.

First, it is beneficial to provide a basic overview of how Strata works. The
Strata [SPEC](https://github.com/mjijackson/strata/blob/master/SPEC) defines
two interfaces: 1) an interface for the HTTP server to communicate the request
to the application and 2) an interface for the application to communicate the
response back to the server.

A Strata application is a JavaScript function. The server communicates with the
application by calling it with two arguments: the **environment** and a
**callback**. The environment is an object that has CGI-like properties
(`requestMethod`, `serverName`, `scriptName`, `pathInfo`, etc.), some
Strata-specific properties, and may also include application-specific extension
properties. The callback is a function the application uses to send the response.

The application communicates with the server by calling the callback with three
arguments: the response **status** code, an object containing HTTP **headers**,
and the response **body**. The body may be a string or a Stream. The server then
returns the appropriate response to the client. If the response body is a
Stream, it is streamed to the client as data becomes available.

The main advantage that Strata has over the Connect/Express library is that it
provides a CGI-like abstraction (the environment) to web applications that gives
them a greater degree of power and modularity, and which allows them to operate
with other applications and middleware more easily. Nearly every major web
server and/or framework in use today employs a similar technique (see Apache,
nginx, PHP, Rails, Sinatra, Pylons, etc.) and the various benefits of doing so
are outside the scope of this document.

Connect/Express provides no such abstraction and instead gives the user the
basic request and response objects [as they were received](http://nodejs.org/api/http.html#event_request_)
from node's HTTP server and a callback. Thus, Connect/Express does little more
for the user than setup a callback chain. While this may be an acceptable
approach for building applications with a small amount of logic, the lack of a
common server environment does not scale well.

Strata also comes bundled with several modules that are commonly used in modern
web applications but are missing in the Connect/Express distribution at the time
of this writing. These include a fast, well-tested multipart parser, a gzip
middleware for gzip-encoding response bodies, and a mocking module for building
test cases. Also, Strata includes a comprehensive test suite and a user manual
that contains well-documented examples for many common use cases.

The main difference between Strata and JSGI (which is only a specification, NOT
an implementation) is that Strata uses a callback to serve responses
asynchronously whereas JSGI uses [promises](http://en.wikipedia.org/wiki/Futures_and_promises).
Since there is no promises module in the node core distribution, this requires
any JSGI implementation for node to depend on a separate promises module, of
which there are many, each with a slightly different implementation. Also, since
promises have failed to gain very wide adoption in the node community many users
are not familiar with using promises at all. This dependence on promises and a
general lack of familiarity with the promises interface within the node
community make JSGI a poor choice for a node-specific web framework that aims to
gain wide adoption.

# Installation

The easiest way to install Strata is by using [npm](http://npmjs.org/):

``` bash
$ npm install strata
```

You are also free to [browse or download the source](https://github.com/mjijackson/strata).

# Manual

The doc directory contains files that make up the Strata user manual. Each file
is a chapter of the manual written in JavaScript that contains documentation
about a certain feature of the framework and a code example.

The manual is written in such a way that the topics and examples discussed in
higher numbered chapters build upon previous ones. Thus, it is recommended to
start with lower numbered chapters when getting started with Strata and work
your way up to higher ones.

You can [read the manual online](http://stratajs.org/manual).

# Tests

The test directory contains a comprehensive suite of unit tests for all of
Strata's core modules. To run the tests, first install vows:

``` bash
$ npm install -g vows
```

Run all tests with:

``` bash
$ vows test/*_test.js
```

Otherwise, run the tests for a specific module with:

``` bash
$ vows test/utils_test.js
```

# License

Copyright 2011 Michael Jackson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

The software is provided "as is", without warranty of any kind, express or
implied, including but not limited to the warranties of merchantability,
fitness for a particular purpose and non-infringement. In no event shall the
authors or copyright holders be liable for any claim, damages or other
liability, whether in an action of contract, tort or otherwise, arising from,
out of or in connection with the software or the use or other dealings in
the software.

# Acknowledgements

Strata was inspired by similar efforts in the Python and Ruby communities,
namely [WSGI](http://www.wsgi.org/) and [Rack](http://rack.rubyforge.org/). It
borrows many code patterns from these libraries, as well as the [JSGI](http://jackjs.org/jsgi-spec.html)
project.

Strata's multipart parser is based on the fast parser in the node-formidable
project written by Felix Geisendörfer. It is included in Strata under the terms
of the MIT license.

My sincere thanks to the authors of each of these libraries for the excellent
work they've done and graciously shared.
