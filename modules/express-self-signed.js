module.exports = {
	do: function(config, express_app){

		//defaults
		if(!config.domain)			config.domain = '*';									// '192.168.0.8'
		if(!config.port_tls)		config.port_tls = '3001';
		if(!config.file_htpasswd)	config.file_htpasswd = '/../config/users.htpasswd';
		if(!config.file_certs)		config.file_certs = '/../config/certs.json';
		if(!config.cert_issuer)		config.cert_issuer = 'self-signed';
		if(!config.cert_bits)		config.cert_bits = 2048;
		if(!config.cert_algorithm)	config.cert_algorithm = 'sha256';						// 'sha512'
		if(!config.cert_duration)	config.cert_duration = 0;								// 1000*60*60*24*365

		// forge make keys
		var fs = require('fs-extra');
		var certsfile = __dirname + config.file_certs;
		var pems = fs.readJsonSync(certsfile, {throws: false});
		if(!pems){
			
			console.log( 'No contents in certsfile:'+certsfile+', generating...' );
			
			var forge = require('node-forge');
			var keys = forge.pki.rsa.generateKeyPair(config.cert_bits);
			var cert = forge.pki.createCertificate();
			cert.publicKey = keys.publicKey;
			cert.serialNumber = Math.floor(Math.random()*1000000).toString();
			var now = new Date();
			var future = new Date(now.getTime()+config.cert_duration);
			cert.validity.notBefore = now;
			cert.validity.notAfter = future;
			cert.setIssuer([{shortName:'CN',value:config.cert_issuer}]);
			cert.setSubject([{shortName:'CN',value:config.domain}]);
			cert.sign(keys.privateKey, forge.md[config.cert_algorithm].create());
			var pems = {
				privateKey: forge.pki.privateKeyToPem(keys.privateKey),
				//publicKey: forge.pki.publicKeyToPem(keys.publicKey),
				certificate: forge.pki.certificateToPem(cert)
			};
			
			fs.writeJson(certsfile, pems);
		}

		//console.log(typeof pems, pems);

		//express app use basic auth
		var auth = require('http-auth');
		var basic = auth.basic({
			realm: "Login",
			file: __dirname + config.file_htpasswd
		});
		express_app.use(auth.connect(basic));

		//serve app over tls
		var https = require('https');
		var https_server = https.Server({
			key: pems.privateKey,
			cert: pems.certificate,
			requestCert: false,
			rejectUnauthorized: false
		}, express_app);

		https_server.listen(config.port_tls, function(){
			console.log('listening on https://'+config.domain+':'+config.port_tls);
		});

		return https_server;

	}
};
