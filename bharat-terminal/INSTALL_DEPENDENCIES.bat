@echo off
title Fixing Python Dependencies for Python 3.13
color 0E
echo.
echo  ================================================
echo   BHARAT TERMINAL - Dependency Fix for Python 3.13
echo  ================================================
echo.
echo  This will install compatible pre-built packages.
echo  No Visual Studio or compilation required.
echo.
pause

echo.
echo [1/6] Upgrading pip...
python -m pip install --upgrade pip --quiet

echo.
echo [2/6] Uninstalling bad numpy build...
pip uninstall numpy -y --quiet 2>nul

echo.
echo [3/6] Installing numpy (official pre-built wheel)...
pip install "numpy>=1.26,<2.0" --prefer-binary --only-binary :all: --quiet
if errorlevel 1 (
    pip install numpy==1.26.4 --prefer-binary --quiet
)

echo.
echo [4/6] Installing pandas (pre-built wheel, no Meson/VS needed)...
pip install "pandas>=2.1,<2.3" --prefer-binary --only-binary :all: --quiet
if errorlevel 1 (
    pip install pandas==2.1.4 --prefer-binary --quiet
)

echo.
echo [5/6] Installing all other backend packages...
pip install --prefer-binary --quiet ^
    "fastapi>=0.111" ^
    "uvicorn[standard]>=0.30" ^
    "websockets>=12.0" ^
    "pydantic>=2.7" ^
    "yfinance>=0.2.40" ^
    "requests>=2.32" ^
    "feedparser>=6.0" ^
    "beautifulsoup4>=4.12" ^
    "lxml>=5.0" ^
    "scikit-learn>=1.4" ^
    "textblob>=0.18" ^
    "vaderSentiment>=3.3" ^
    "cachetools>=5.3" ^
    "pytz>=2024.1" ^
    "python-multipart>=0.0.9"

echo.
echo [6/6] Verifying installation...
python -c "import fastapi, uvicorn, yfinance, pandas, numpy, sklearn; print('  All packages OK!')"
if errorlevel 1 (
    echo   Some packages may have issues - check above output
) else (
    color 0A
    echo.
    echo  ================================================
    echo   SUCCESS! All packages installed correctly.
    echo  ================================================
)

echo.
echo  Now starting the backend server...
echo  Keep this window open!
echo.
cd /d "%~dp0backend"
uvicorn main:app --reload --port 8000 --host 127.0.0.1

pause
