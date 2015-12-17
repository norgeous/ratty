#!/bin/bash

git clone https://github.com/norgeous/ratty.git
mv ratty /usr/local/ratty/
cd /usr/local/ratty/
npm install
mv ratty.service /etc/systemd/system/ratty.service
systemctl enable ratty
systemctl start ratty


