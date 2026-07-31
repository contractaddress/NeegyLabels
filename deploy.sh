#!/bin/bash
set -e

DIR="/root/NeegyLabels"

if [ ! -d "$DIR" ]; then
  echo "==> first time: cloning..."
  git clone git@192.168.2.103:fenghuang/NeegyLabels.git "$DIR"
fi

echo "==> pulling latest..."
cd "$DIR"
git pull origin main

echo "==> ensuring data directory..."
mkdir -p src/data

echo "==> installing dependencies..."
npm install

echo "==> building..."
npx astro build

echo "==> starting server..."
pkill -f "node dist/server/entry.mjs" 2>/dev/null || true
HOST=0.0.0.0 PORT=4321 nohup node dist/server/entry.mjs > /var/log/neegy.log 2>&1 &
echo "running on port 4321 (pid $!)"

echo "==> done"
