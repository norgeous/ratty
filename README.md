# ratty
Remote Access TTY (in browser) v0.0.1 (development version)
Get a realtime piped shell in your browser from your linux box, using node, socket.io and tmux.

## Features
* Secured with HTTPS/SSL/TLS (self-signed) and HTTP Basic Auth.
* Supports multiple users in the same shell.
* Supports normal shell tab completetion and colors.
* Alternative to SSH for IOT devices?

## Future Features - currently unsupported
* Support interactive applications such as ```nano```
* Optimised front-end to just draw new info - not redraw every char (maybe with angular?)
* Better interface
* Mobile support (maybe)
* self update system

## Node Install
you need nodejs 5 or higher:
https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions
you may also need to create an alias for  ```nodejs``` as ```node```:
```
sudo ln -s /usr/bin/nodejs /usr/bin/node
```



## Ratty Install
```
cd /usr/local/
git clone https://github.com/norgeous/ratty.git
cd ratty
npm install
```


## Test drive Ratty
```
clear && node /usr/local/ratty/index.js
```


## Systemd service
Create a systemd service for autostart and respawning on crash/exit
```
nano /etc/systemd/system/ratty.service
```

Inside the file, write:
```
[Service]
ExecStart=/usr/bin/node /usr/local/ratty/index.js
Restart=always
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=ratty
User=yourusername
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```
note: remember to replace ```yourusername``` with the user you want to run as.

Then use the following to test the systemd configuration:

```
systemctl enable ratty
systemctl status ratty
systemctl start ratty
systemctl restart ratty
journalctl -u ratty
```

If its not working you may need to change the permissions:

```
sudo chown -R yourusername /usr/local/ratty

```