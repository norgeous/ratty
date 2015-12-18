var exec = require('child_process').exec;
var fs = require('fs');

module.exports = {
	pipes: {},
	connect: function(tmux_session_id, cbs){

		var pipefile = '/tmp/.tmux-session-'+tmux_session_id+'.pipe';
		var logfile = '/tmp/.tmux-session-'+tmux_session_id+'.log';

		//if pipe not exists (server.js does not know about the session - it may still exist in tmux)
		if(!module.exports.pipes[tmux_session_id]){
			
			//either the tmux session does not exist, or is not connected to node

			//try to create this session id
			//exec('tmux kill-session -t "'+tmux_session_id+'"; tmux new-session -s "'+tmux_session_id+'" -d', {cwd:'/'}, function(error, stdout, stderr){
			exec('tmux new-session -s "'+tmux_session_id+'" -d', {cwd:'/'}, function(error, stdout, stderr){

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
								module.exports.pipes[tmux_session_id] = fs.createReadStream(pipefile);

								// when fifo gets data
								module.exports.pipes[tmux_session_id].on('data', function(data){

									// save to log file
									fs.appendFileSync(logfile, data.toString());

									cbs.onData(data.toString());

								});

								// pipe tmux into fifo
								exec('tmux pipe-pane -t "'+tmux_session_id+'" -o "cat >> '+pipefile+'"');

								// send sessions
								module.exports.execTmuxLs(cbs.onList);
								cbs.onConnected();

							});

						});

					});

				});

			});

		} else {

			//tmux session exists and is piping into pipes[]
			
			// send log
			cbs.onData('fromlog:::\r\n'+fs.readFileSync('/tmp/.tmux-session-'+tmux_session_id+'.log').toString());

			// send sessions
			module.exports.execTmuxLs(cbs.onList);
			cbs.onConnected();
		}

	},
	execTmuxLs: function(cb){
		exec('tmux ls -F "#{session_name}"', function(error, stdout, stderr){
			cb(stdout);
		});
	},
	send: function(tmux_session_id,msg){
		exec('tmux send -t"'+tmux_session_id+'" "'+msg+'"');
	},
	kill: function(tmux_session_id, cbs){
		fs.unlink('/tmp/.tmux-session-'+tmux_session_id+'.pipe');
		fs.unlink('/tmp/.tmux-session-'+tmux_session_id+'.log');
		delete module.exports.pipes[tmux_session_id];
		exec('tmux kill-session -t "'+tmux_session_id+'"');
		cbs.onKilled();
		module.exports.execTmuxLs(cbs.onList);
	}
};