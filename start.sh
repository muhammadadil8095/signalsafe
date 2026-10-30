#!/usr/bin/env bash
set -e

if [ -d "backend/app" ]; then
    cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
else
    uvicorn app.main:app --host 0.0.0.0 --port $PORT
fi

