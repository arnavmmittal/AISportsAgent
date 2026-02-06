#!/bin/sh
set -e

# Use Railway's PORT or default to 8000
PORT=${PORT:-8000}

echo "Starting server on port $PORT"

exec gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:$PORT \
    --timeout 60 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
