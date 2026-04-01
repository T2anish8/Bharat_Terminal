@echo off
title Bharat Terminal - Fix + Start Backend
color 0A
echo.
echo  ============================================
echo   BHARAT TERMINAL - Fixing Dependencies
echo  ============================================
echo.

cd /d "%~dp0backend"

echo  Step 1: Upgrading pip...
python -m pip install --upgrade pip

echo.
echo  Step 2: Installing pre-built wheels (no compilation needed)...
echo  This avoids the Visual Studio / Meson build error.
echo.

pip install --only-binary :all: pandas numpy
if errorlevel 1 (
    echo  Trying alternative pandas install...
    pip install "pandas==2.2.3" --prefer-binary
)

echo.
echo  Step 3: Installing remaining packages...
pip install --prefer-binary ^
    fastapi==0.115.5 ^
    "uvicorn[standard]==0.32.1" ^
    websockets==13.1 ^
    pydantic==2.10.3 ^
    yfinance==0.2.50 ^
    requests==2.32.3 ^
    feedparser==6.0.11 ^
    beautifulsoup4==4.12.3 ^
    cachetools==5.5.0 ^
    pytz==2024.2 ^
    scikit-learn==1.5.2 ^
    textblob==0.18.0 ^
    vaderSentiment==3.3.2

echo.
echo  ============================================
echo   All packages installed! Starting server...
echo   API running at: http://localhost:8000
echo   Keep this window OPEN!
echo  ============================================
echo.

uvicorn main:app --reload --port 8000 --host 0.0.0.0
pause
