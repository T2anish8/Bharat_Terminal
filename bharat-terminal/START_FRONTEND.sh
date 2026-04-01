#!/bin/bash
echo "🇮🇳 Bharat Terminal — Frontend"
echo "================================="
cd "$(dirname "$0")/frontend"
npm install
echo ""
echo "Starting UI on http://localhost:5173"
npm run dev
