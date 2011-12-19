var http = require('http'),
    httpProxy = require('http-proxy'),
    config = require('./config');


// Initialize portStatus with ports from the hostnames object
var portStatus = {};
for (var host in config.hostnames) {
    portStatus[parseInt(config.hostnames[host])] = 0;
}

// Populate the status of each port; update every five minutes
checkPorts();
setInterval(checkPorts, 5*60*1000);

function checkPorts() {
    for (var port in portStatus) {
        checkPort(port);
    }
}

// Check the specified port and update the portStatus object with the HTTP staus code obtained
function checkPort(port, callback) {
    var handle = (function(port) { return function (res) {
        var code = res.statusCode || res.code;
        portStatus[port] = code;
        if (typeof callback == "function")
            callback(port, code);
    };})(port);

    http.get({ host: 'localhost', port: port, path: '/' }, handle).on('error', handle);
};

// Check if a port is alive
function isAlive(port) {
    if (port && portStatus[port] != 'ECONNREFUSED')
        return true;
}

httpProxy.createServer(function (req, res, proxy) {
    
    // Function definitions ("define shit"):

    function route(port) {
        proxy.proxyRequest(req, res, { host: 'localhost', port: port });
    }

    function send404() {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.write("The page you're looking for isn't here.");
        res.end();
    }
    
    function redirect(domain) {
        // todo: Should check for https
        res.writeHead(301, { 'Location': "http://" + domain + req.url });
        res.end();
    }


    // Process the request ("do shit"):

    var port = config.hostnames[req.headers.host];
    var domain = config.redirects[req.headers.host];

    if (domain) {
        console.log("Redirecting " + req.headers.host + " to " + domain);
        redirect(domain);
    } else if (!port) {
        console.log(req.headers.host + " does not have a port defined - sending 404");
        send404();
    } else if (!isAlive(port)) {
        console.log(req.headers.host + " appears to be down - verifying");
        checkPort(port, function(port, code) {
            if (code != 'ECONNREFUSED') { 
                console.log(req.headers.host + " is up - routing to :" + port);
                route(port);
            } else {
                console.log(req.headers.host + " verified down - sending 404");
                send404();
            }
        });
    } else {
        route(port);
    }
    
}).listen(80);

// Output config info on launch
console.log("Routing requests");
console.log("hostnames: ");
console.log(config.hostnames);
console.log("redirects: ");
console.log(config.redirects);
