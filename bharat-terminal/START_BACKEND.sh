#!/bin/bash
echo "🇮🇳 Bharat Terminal — Backend"
echo "================================"
cd "$(dirname "$0")/backend"
pip install -r requirements.txt
echo ""
echo "Starting API on http://localhost:8000"
uvicorn main:app --reload --port 8000
