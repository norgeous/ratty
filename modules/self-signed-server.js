var generate = require('self-signed');
var fs = require('fs-extra');
var https = require('https');
var auth = require('http-auth');



module.exports = {
	gen: function(cn,duration){
		var future = new Date(Date.now()+duration).toString();
		var pems = generate({
			name:cn,
			city:'international',
			state:'international',
			country:'WWW',
			organization:'self-signed',
			unit:'self-signed'
		},{
			keySize: 2048,
			serial: Math.floor(Math.random()*1000000).toString(),	//randomise serial
			expire: future,
			pkcs7: false,
			alt: ['*','localhost','127.0.0.1','0.0.0.0']
		});
		delete pems.public;
		pems.expires = future;
		return pems;
	},
	Configure: function(app,cn,duration){

		var basic = auth.basic({
			realm: "Login",
			file: __dirname + "/../config/users.htpasswd"
		});
		app.use(auth.connect(basic));

		var certsfile = __dirname+'/../config/certs.json';
		var pems = fs.readJsonSync(certsfile, {throws: false});
		if(!pems){
			console.log( 'No contents in '+certsfile+', generating...' );
			pems = this.gen(cn,duration);
			fs.writeJson(certsfile, pems);
		}

		https.options = {
			key: pems.private,
			cert: pems.cert,
			requestCert: false,
			rejectUnauthorized: false
		};


		var https_server = https.Server(https.options, app);

		https_server.checkExpired = function(){
			//run this on every request?
			var now = new Date().getTime();
			var expiry = new Date(pems.expires).getTime();
			var remaining = expiry-now;
			console.log('remaining',remaining);
			if( remaining<0 ){
				console.log('EXPIRED CERT');
				fs.writeJsonSync(certsfile, '');
				process.kill(process.pid, 'SIGHUP');
			}
		};

		https_server.listen(3000, function(){
			console.log('listening on *:'+3000);
		});

		return https_server;
	},
};



