module.exports = {
	hostnames: {
		'foo.bar' : 8000,
		'mail.foo.bar' : 8001
	},
	// Don't define these in the hostnames object - it's redundant
	redirects: {
		'www.foo.bar' : 'foo.bar'
	}
}
