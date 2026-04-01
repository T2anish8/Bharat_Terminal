@echo off
title Nuclear Fix - Replace Bad Numpy
color 0C
echo.
echo  ================================================
echo   REMOVING BAD NUMPY AND REINSTALLING EVERYTHING
echo  ================================================
echo.

echo [1] Uninstalling problematic packages...
pip uninstall numpy pandas scikit-learn -y

echo.
echo [2] Installing numpy 1.26.4 (stable, no MINGW)...
pip install "numpy==1.26.4" --prefer-binary --only-binary :all:

echo.
echo [3] Installing pandas...
pip install "pandas==2.1.4" --prefer-binary --only-binary :all:

echo.
echo [4] Installing scikit-learn...
pip install "scikit-learn==1.4.2" --prefer-binary --only-binary :all:

echo.
echo [5] Installing remaining packages...
pip install --prefer-binary ^
    "fastapi>=0.111" ^
    "uvicorn[standard]>=0.30" ^
    "yfinance>=0.2.40" ^
    "cachetools>=5.3" ^
    "pytz>=2024.1" ^
    "feedparser>=6.0" ^
    "textblob>=0.18" ^
    "vaderSentiment>=3.3" ^
    "beautifulsoup4>=4.12" ^
    "pydantic>=2.7" ^
    "requests>=2.32"

echo.
echo [6] Verifying numpy is now fixed...
python -c "import numpy as np; print('numpy', np.__version__, 'OK'); import pandas as pd; print('pandas', pd.__version__, 'OK')"

echo.
echo [7] Starting backend...
cd /d "%~dp0backend"
python run.py
pause
