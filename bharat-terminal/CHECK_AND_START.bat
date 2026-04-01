@echo off
title Bharat Terminal - Check + Start
color 0E
echo.
echo  ================================================
echo   BHARAT TERMINAL - Checking + Starting Backend
echo  ================================================
echo.

cd /d "%~dp0backend"

echo  [Step 1] Testing Python imports...
python test_imports.py
echo.

echo  [Step 2] If all imports OK above, starting server...
echo  If you see errors above, run INSTALL_DEPENDENCIES.bat first
echo.
pause

echo  Starting uvicorn on port 8000...
python -m uvicorn main:app --reload --port 8000 --host 127.0.0.1 --log-level info
pause
