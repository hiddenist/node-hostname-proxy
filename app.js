var http = require('http'),
	httpProxy = require('http-proxy'),
	config = require('./config');


var ports = [];

// Populate ports
for (var host in config.hostnames) {
	var found = false;
	for (var i in ports) {
		if (ports[i] == config.hostnames[host]) {
			found = true;
			break;
		}
	}
	
	if (!found)
		ports.push(config.hostnames[host]);
}

var portStatus = {};

function checkPorts() {
	for (var i in ports) {
		var port = ports[i];
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

checkPorts();
setInterval(checkPorts, 5000);

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
console.log("ports: ");
console.log(config.hostnames);
console.log("redirects: ");
console.log(config.redirects);
