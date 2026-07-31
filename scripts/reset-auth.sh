#!/bin/sh

DIR="$(dirname "$0")/.."

echo "==> stopping server..."
kill $(cat /tmp/neegy.pid 2>/dev/null) 2>/dev/null || true

echo "==> wiping auth database..."
rm -f "$DIR/src/data/auth.db" "$DIR/src/data/auth.db-wal" "$DIR/src/data/auth.db-shm"

echo "==> done — next visit will show account setup"
