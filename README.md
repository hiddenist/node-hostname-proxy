# Node Hostname Proxy

Runs a master node process to redirect hostnames to the correct node process
port using http-proxy. Think something like Apache virtual hosts.

## Requirements
Node.js version 0.5.0
http-proxy version 0.7.6

## Running
All you need to do is run app.js as root, like so!

```
sudo node app.js
```

## Configuration 

The data is populated from the config.js file, which expects a "hostnames"
object with keys as the hostname, and data as the port.  The config file can
also provide a "redirects" object to define which hostnames should redirect
other hostnames (for example, www to non-www).

See the config.sample.js file for a concrete example of the config file.
