var port = 3000;

var app = require('express')();
//var https_configuration
var https = require('./modules/self-signed-server').Configure(app, '192.158.0.5', 1000*60*10);
//var https = https_configuration.Server(https_configuration.options, app);

app.get('/', function(req, res){
	console.log('app.get /');
	//https.checkExpired();
	res.sendFile(__dirname+'/index.html');
});

var io = require('socket.io')(https);
var tmux = require('./modules/tmux');
var url = require('url');
io.on('connection', function(socket){

	var req = url.parse(socket.request.headers.referer, true);
	if(req.query.s){

		socket.tmux_session_id = req.query.s;
		
		tmux.connect(socket);
		
	} else {

		//status
		socket.emit('status', 'no session selected');
		
		// send sessions
		//exec('tmux ls -F "#{session_name}"', function(error, stdout, stderr){
		tmux.execTmuxLs(function(error, stdout, stderr){
			socket.emit('sessionlist', stdout.split('\n').filter(function(n){ return n != "" }));
		});
	}

});

