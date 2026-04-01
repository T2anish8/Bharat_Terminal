@echo off
title Bharat Terminal - Backend
color 0A
echo.
echo  ================================================
echo   BHARAT TERMINAL - Backend Server
echo  ================================================
echo.
cd /d "%~dp0backend"
echo  Starting with python run.py (shows all errors)...
echo  Keep this window OPEN!
echo.
python run.py
pause
