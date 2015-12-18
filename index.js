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
		
	var onListy = function(stdout){
		socket.emit('sessionlist', stdout.split('\n').filter(function(n){ return n != "" }));
	};

	var req = url.parse(socket.request.headers.referer, true);
	if(req.query.s){

		var tmux_session_id = req.query.s;

		tmux.connect(tmux_session_id,{
			onConnected:function(){

				//connected
				socket.emit('status', 'connected to "'+tmux_session_id+'" as "'+socket.id+'"');

				//socket listener
				socket.on('keypress', function(msg){

					//https.checkExpired();
					tmux.send(tmux_session_id,msg);

				});
				
				//socket listener
				socket.on('destroy', function(){
					tmux.kill(tmux_session_id, {
						onList: onListy,
						onKilled: function(){										
							socket.emit('status', 'killed '+tmux_session_id);
							socket.emit('transcript', '\n\nkilled '+tmux_session_id);
						}
					});
				});
			},
			onData:function(data){
				// find sockets that want this session
				for(var key in io.sockets.connected){
					
					// if socket's tmux id matches this tmux id 
					if(socket.tmux_session_id === io.sockets.connected[key].tmux_session_id){

						// send data through socket(s)
						io.sockets.connected[key].emit('transcript', data.toString());
					}
				}
			},
			onList: onListy
		});
		
	} else {

		//status
		socket.emit('status', 'no session selected');
		
		// send sessions
		tmux.execTmuxLs(onListy);
	}

});

