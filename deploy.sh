#!/usr/bin/env bash
set -e

APP_DIR="/root/trackwall"
REMOTE="root@192.168.1.118"
REMOTE_DIR="/opt/trackwall"

cd "$APP_DIR"

echo "🔨 Building..."
npm run build

echo "📦 Preparing standalone..."
mkdir -p .next/standalone/trackwall/.next/static
cp -r .next/static .next/standalone/trackwall/.next/static/
echo "🚀 Deploying to $REMOTE..."
tar czf - -C .next/standalone/trackwall --exclude .next/static .next server.js package.json | \
  ssh "$REMOTE" "cd $REMOTE_DIR && rm -rf .next/static server.js 2>/dev/null; tar xzf -"

tar czf - --transform 's,^,static/,' -C .next/static . | \
  ssh "$REMOTE" "cd $REMOTE_DIR/.next && rm -rf static && tar xzf -"

tar czf - -C public . | \
  ssh "$REMOTE" "cd $REMOTE_DIR/public && tar xzf -"

ssh "$REMOTE" "cd $REMOTE_DIR && npm install --production 2>/dev/null"

echo "🔄 Restarting service..."
ssh "$REMOTE" "systemctl restart trackwall && sleep 3"

echo "✅ Verifying..."
HTTP_CODE=$(ssh "$REMOTE" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/")
echo "  HTTP: $HTTP_CODE"
echo "  Done!"
