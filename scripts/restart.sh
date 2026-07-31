#!/bin/sh

kill $(cat /tmp/neegy.pid 2>/dev/null) 2>/dev/null || true
sleep 1

cd "$(dirname "$0")/.."

npx astro build

HOST=0.0.0.0 PORT=4321 nohup node dist/server/entry.mjs > /var/log/neegy.log 2>&1 &
echo $! > /tmp/neegy.pid
echo "running on :4321 (pid $(cat /tmp/neegy.pid))"
