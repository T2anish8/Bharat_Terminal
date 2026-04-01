"""
Run this to check if all imports work:
    python test_imports.py
"""
import sys
print(f"Python {sys.version}\n")

tests = [
    ("fastapi",          "FastAPI"),
    ("uvicorn",          "uvicorn"),
    ("yfinance",         "yfinance"),
    ("pandas",           "pandas"),
    ("numpy",            "numpy"),
    ("cachetools",       "cachetools TTLCache"),
    ("pytz",             "pytz"),
    ("feedparser",       "feedparser"),
    ("textblob",         "TextBlob"),
    ("vaderSentiment.vaderSentiment", "VADER Sentiment"),
    ("sklearn.linear_model", "scikit-learn"),
    ("bs4",              "beautifulsoup4"),
    ("pydantic",         "pydantic"),
    ("websockets",       "websockets"),
]

ok = 0
fail = 0
for mod, label in tests:
    try:
        __import__(mod)
        print(f"  ✅  {label}")
        ok += 1
    except ImportError as e:
        print(f"  ❌  {label}  →  pip install {mod.split('.')[0]}")
        fail += 1

print(f"\n{ok} OK, {fail} MISSING")

if fail == 0:
    print("\nAll imports OK! Now testing internal modules...")
    import warnings
    warnings.filterwarnings("ignore")
    sys.path.insert(0, ".")
    try:
        from core.data_fetcher import is_market_open, NIFTY50
        print(f"  ✅  core.data_fetcher  (Nifty50 has {len(NIFTY50)} stocks)")
    except Exception as e:
        print(f"  ❌  core.data_fetcher: {e}")
    try:
        from core.indicators import add_all
        print(f"  ✅  core.indicators")
    except Exception as e:
        print(f"  ❌  core.indicators: {e}")
    try:
        from ml.sentiment import fetch_news
        print(f"  ✅  ml.sentiment")
    except Exception as e:
        print(f"  ❌  ml.sentiment: {e}")
    try:
        from api.routes_market import router
        print(f"  ✅  api.routes_market")
    except Exception as e:
        print(f"  ❌  api.routes_market: {e}")

print("\n--- Done ---")
input("Press Enter to close...")
