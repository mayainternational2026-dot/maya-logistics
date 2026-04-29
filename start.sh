#!/bin/sh
echo "Starting Maya Logistics server on port $PORT..."
exec node --enable-source-maps ./artifacts/api-server/dist/index.mjs
