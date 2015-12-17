var exec = require('child_process').exec;
var fs = require('fs');

module.exports = {
	pipes = {},
	connect: function(socket){

		var pipefile = '/tmp/.tmux-session-'+socket.tmux_session_id+'.pipe';
		var logfile = '/tmp/.tmux-session-'+socket.tmux_session_id+'.log';

		//if pipe not exists (server.js does not know about the session - it may still exist in tmux)
		if(!pipes[socket.tmux_session_id]){
			
			//either the tmux session does not exist, or is not connected to node

			//try to create this session id
			//exec('tmux kill-session -t "'+socket.tmux_session_id+'"; tmux new-session -s "'+socket.tmux_session_id+'" -d', {cwd:'/'}, function(error, stdout, stderr){
			exec('tmux new-session -s "'+socket.tmux_session_id+'" -d', {cwd:'/'}, function(error, stdout, stderr){

				// new tmux session created

				// delete old log file
				fs.unlink(logfile, function(exception){

					// touch new log
					fs.writeFile(logfile, '', function(exception) {

						// delete old fifo
						fs.unlink(pipefile, function(exception){

							// create new fifo
							exec('mkfifo "'+pipefile+'"', function(error, stdout, stderr){

								// connect fifo to node (will skip creation next time)
								pipes[socket.tmux_session_id] = fs.createReadStream(pipefile);

								// when fifo gets data
								pipes[socket.tmux_session_id].on('data', function(data){

									// save to log file
									fs.appendFileSync(logfile, data.toString());

									// find sockets that want this session
									for(var key in io.sockets.connected){
										
										// if socket's tmux id matches this tmux id 
										if(socket.tmux_session_id === io.sockets.connected[key].tmux_session_id){

											// send data through socket(s)
											io.sockets.connected[key].emit('transcript', data.toString());
										}
									}

								});

								// pipe tmux into fifo
								exec('tmux pipe-pane -t "'+socket.tmux_session_id+'" -o "cat >> '+pipefile+'"');

								//
								connected(socket);

							});

						});

					});

				});

			});

		} else {

			//tmux session exists and is piping into pipes[]
			
			// send log
			socket.emit('transcript', fs.readFileSync('/tmp/.tmux-session-'+socket.tmux_session_id+'.log').toString());

			//
			//connected(socket);
			// send sessions
			exec('tmux ls -F "#{session_name}"', function(error, stdout, stderr){
				socket.emit('sessionlist', stdout.split('\n').filter(function(n){ return n != "" }));
			});

			//connected
			socket.emit('status', 'connected to "'+socket.tmux_session_id+'" as "'+socket.id+'"');

			//socket listener
			socket.on('keypress', function(msg){

				//https.checkExpired();
				exec('tmux send -t"'+socket.tmux_session_id+'" "'+msg+'"');

			});
			
			//socket listener
			socket.on('destroy', function(){
				fs.unlink('/tmp/.tmux-session-'+socket.tmux_session_id+'.pipe');
				fs.unlink('/tmp/.tmux-session-'+socket.tmux_session_id+'.log');
				delete pipes[socket.tmux_session_id];
				exec('tmux kill-session -t "'+socket.tmux_session_id+'"');

				socket.emit('status', 'killed '+socket.tmux_session_id);
				socket.emit('transcript', '\n\nkilled '+socket.tmux_session_id);
				
				// send sessions
				exec('tmux ls -F "#{session_name}"', function(error, stdout, stderr){
					socket.emit('sessionlist', stdout.split('\n').filter(function(n){ return n != "" }));
				});
			});
		}

	},
	execTmuxLs: function(cb){
		exec('tmux ls -F "#{session_name}"', function(error, stdout, stderr){
			cb(error, stdout, stderr);
		};
	}
};