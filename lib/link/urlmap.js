/**
 * A middleware for dispatching to different apps based on the current value
 * of the pathInfo environment variable. This middleware modifies scriptName
 * and pathInfo for all downstream apps such that the part relevant for dispatch
 * is in scriptName and the rest in pathInfo. This should be taken into account
 * in downstream apps that need to create links, for example.
 *
 * Dispatch is done in such a way that the longest paths are tried first, since
 * they are the most specific.
 */
module.exports = function (map) {
    map = map || {};
    var routes = [];

    for (var location in map) {
        var app = map[location],
            host = null,
            match = location.match(/^https?:\/\/(.*?)(\/.*)/);

        if (match) {
            host = match[1];
            location = match[2];
        }

        if (location.charAt(0) !== "/") {
            throw new Error('Path must start with "/" (was: ' + location + ")");
        }

        routes.push([host, location.replace(/\/+/, "/"), app]);
    }

    // Sort routes by most specific (longest first).
    routes.sort(function(a, b) {
        return (b[1].length - a[1].length) || ((b[0] || "").length - (a[0] || "").length);
    });

    return function urlMap(env, callback) {
        var pathInfo = env.pathInfo,
            scriptName = env.scriptName,
            httpHost = env.httpHost || null,
            serverName = env.serverName,
            serverPort = env.serverPort;

        var route, host, location, app, locationChar, hostMatch;
        for (var i = 0, len = routes.length; i < len; ++i) {
            route = routes[i];

            host = route[0];
            location = route[1];
            app = route[2];

            // console.log(httpHost == host);
            // console.log(serverName == host);
            // console.log(!host && (httpHost == serverName || httpHost == serverName + ":" + serverPort));
            //
            // // Continue unless the host/port matches. Check both the httpHost
            // // and serverName/Port variables.
            // if (!(httpHost == host || serverName == host ||
            //     (!host && (httpHost == serverName || httpHost == serverName + ":" + serverPort)))) {
            //         continue;
            // }

            // if (httpHost !== host &&
            //     serverName !== host &&
            //     (host || (httpHost !== serverName && httpHost !== serverName + ":" + serverPort))) {
            //         continue;
            // }

            console.log(pathInfo);

            // Continue unless the path matches.
            if (location !== pathInfo.substring(0, location.length)) {
                continue;
            }

            // Continue unless the new pathInfo would start with "/" or
            // would be empty.
            locationChar = pathInfo.charAt(location.length);
            if (locationChar !== "/" && locationChar !== "") {
                continue;
            }

            // Adjust scriptName and pathInfo for downstream apps.
            env.scriptName += location;
            env.pathInfo = pathInfo.substring(location.length);

            app(env, function (status, headers, body) {
                // Reset scriptName and pathInfo on the way back out.
                env.scriptName = scriptName;
                env.pathInfo = pathInfo;

                callback(status, headers, body);
            });

            return;
        }

        notFound(env, callback);
    }
}

function notFound(env, callback) {
    callback(404, {
        "Content-Type": "text/plain",
        "X-Cascade": "pass"
    }, "Not found: " + env.pathInfo);
}
