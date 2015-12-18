# ratty
Remote Access TTY (in browser)

### in development

Get a realtime piped shell in browser, using node, socket.io and tmux.

Secured with HTTPS/SSL/TLS (self-signed) and HTTP Basic Auth.

Supports multiple users in the same shell.

Supports normal shell tab completetion and colors.

Alternative to ssh?


## Node Install

you need nodejs 5 or higher: https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions

create ```nodejs``` alias as ```node```

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

## Start Ratty

```
clear && node /usr/local/ratty/index.js
```


## Systemd service (for autostart and respawning on crash/exit)


```
sudo chown -R yourusername /usr/local/ratty

```
```
nano /etc/systemd/system/ratty.service
```

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

```
systemctl enable ratty
systemctl start ratty
```


## Useful

```
systemctl status ratty
systemctl restart ratty
journalctl -u ratty
```