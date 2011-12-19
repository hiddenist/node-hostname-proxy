/*
 * Runs a master node process to redirect hostnames to the correct node process
 * port using http-proxy. Think something like Apache virtual hosts.
 *
 * The data is populated from the config.js file, which expects a "hostnames" 
 * object with keys as the hostname, and data as the port.  The config file can
 * also provide a "redirects" object to define which hostnames should redirect
 * other hostnames (for example, www to non-www).
 *
 * See the config.sample.js file for a concrete example.
 *
 */

var http = require('http'),
	httpProxy = require('http-proxy'),
	config = require('./config');


// Initialize portStatus with ports from the hostnames object
var portStatus = {};
for (var host in config.hostnames) {
	portStatus[parseInt(config.hostnames[host])] = 0;
}

// Populate the status of each port; update every file seconds
checkPorts();
setInterval(checkPorts, 5000);

function checkPorts() {
	for (var port in portStatus) {
		checkPort(port);
	}
}

function checkPort(port, callback) {
	var handle = (function(port) { return function (res) {
		var code = res.statusCode || res.code;
		portStatus[port] = code;
		if (typeof callback == "function")
			callback(port, code);
	};})(port);

	http.get({ host: 'localhost', port: port, path: '/' }, handle).on('error', handle);
};

function isAlive(port) {
	if (port && portStatus[port] != 'ECONNREFUSED')
		return true;
}

httpProxy.createServer(function (req, res, proxy) {
	function route() {
		proxy.proxyRequest(req, res, port, 'localhost');
	}

	function send404() {
		res.writeHead(404, {'Content-Type': 'text/html'});
		res.write("The page you're looking for isn't here.");
		// res.write(JSON.stringify(req.headers, true, 2));
		res.end();
	}
	
	function redirect(domain) {
		res.writeHead(301, { 'Location': "http://" + domain + req.url });
		res.end();
	}

	var port = config.hostnames[req.headers.host];
	if (!port) {
		var domain = config.redirects[req.headers.host];
		if (domain)
			redirect(domain);
		else
			send404();
	}
	else if (!isAlive(port)) {
		checkPort(port, function(port, code) {
			if (code != 'ECONNREFUSED')
				route();
			else
				send404();
		});
	} else {
		route();
	}
	
}).listen(80);

console.log("Routing requests");
console.log("hostnames: ");
console.log(config.hostnames);
console.log("redirects: ");
console.log(config.redirects);
