@echo off
title Bharat Terminal - Frontend (Port 5173)
color 0B
echo.
echo  ============================================
echo   IN  BHARAT TERMINAL - Frontend UI
echo  ============================================
echo.
cd /d "%~dp0frontend"

echo  Installing packages (first time only)...
call npm install --silent

echo.
echo  Starting UI...
echo  Open in browser: http://localhost:5173
echo  Keep this window OPEN!
echo.

npm run dev
pause
