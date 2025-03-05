#!/bin/sh

# Run migrations
echo "Running database migrations..."
node run-migrations.js

# Start the server
echo "Starting server..."
node server.js
