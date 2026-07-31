#!/bin/sh

kill $(cat /tmp/neegy.pid 2>/dev/null) 2>/dev/null || true
sleep 1

cd "$(dirname "$0")/.."
HOST=0.0.0.0 PORT=4321 node dist/server/entry.mjs
