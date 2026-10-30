#!/usr/bin/env bash
set -e

if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
elif [ -f "backend/requirements.txt" ]; then
    pip install -r backend/requirements.txt
fi

if [ -d "backend/app" ]; then
    cd backend && python -m app.database.seed
else
    python -m app.database.seed
fi
