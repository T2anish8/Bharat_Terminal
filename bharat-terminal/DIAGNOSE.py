"""
Run this FIRST to diagnose all issues:
    python DIAGNOSE.py
"""
import sys, subprocess, importlib, urllib.request, os

OK  = "  ✅"
ERR = "  ❌"
WARN= "  ⚠️ "

print("\n🇮🇳  BHARAT TERMINAL — DIAGNOSTIC\n" + "="*50)

# 1. Python version
v = sys.version_info
print(f"\n[1] Python {v.major}.{v.minor}.{v.micro}", OK if v.major==3 and v.minor>=9 else ERR+" Need Python 3.9+")

# 2. Required packages
print("\n[2] Packages:")
REQUIRED = [
    ("fastapi",      "fastapi"),
    ("uvicorn",      "uvicorn"),
    ("yfinance",     "yfinance"),
    ("pandas",       "pandas"),
    ("numpy",        "numpy"),
    ("feedparser",   "feedparser"),
    ("cachetools",   "cachetools"),
    ("pytz",         "pytz"),
    ("sklearn",      "scikit-learn"),
    ("textblob",     "textblob"),
    ("vaderSentiment","vaderSentiment"),
    ("pydantic",     "pydantic"),
    ("websockets",   "websockets"),
]
missing = []
for mod, pkg in REQUIRED:
    try:
        importlib.import_module(mod)
        print(f"    {pkg}", OK)
    except ImportError:
        print(f"    {pkg}", ERR, "MISSING")
        missing.append(pkg)

if missing:
    print(f"\n{ERR} Install missing packages:")
    print(f"    pip install {' '.join(missing)}")
else:
    print(f"\n{OK} All packages installed!")

# 3. Test yfinance can fetch data
print("\n[3] yfinance data fetch test:")
try:
    import yfinance as yf
    t = yf.Ticker("RELIANCE.NS")
    hist = t.history(period="2d", interval="1d")
    if hist.empty:
        print("  RELIANCE.NS", WARN, "Empty data (market may be closed)")
    else:
        price = float(hist["Close"].iloc[-1])
        print(f"  RELIANCE.NS  ₹{price:.2f}", OK)
except Exception as e:
    print("  RELIANCE.NS", ERR, str(e))

# 4. Test internet
print("\n[4] Internet connectivity:")
try:
    urllib.request.urlopen("https://query1.finance.yahoo.com", timeout=5)
    print("  Yahoo Finance", OK)
except Exception as e:
    print("  Yahoo Finance", ERR, "No internet — yfinance needs internet!")

# 5. Check if backend port 8000 is already running
print("\n[5] Backend port 8000:")
try:
    urllib.request.urlopen("http://localhost:8000/health", timeout=2)
    print("  Port 8000", OK, "Backend is already running!")
except Exception:
    print("  Port 8000", WARN, "Backend NOT running (start it!)")

# 6. Node / npm
print("\n[6] Node.js / npm:")
try:
    r = subprocess.run(["node","--version"], capture_output=True, text=True)
    print("  node", r.stdout.strip(), OK)
except:
    print("  node", ERR, "Not found")
try:
    r = subprocess.run(["npm","--version"], capture_output=True, text=True)
    print("  npm", r.stdout.strip(), OK)
except:
    print("  npm", ERR, "Not found")

print("\n" + "="*50)
print("📋 NEXT STEPS:")
print()
if missing:
    print(f"  1. pip install {' '.join(missing)}")
    print(f"     (or: pip install -r backend/requirements.txt)")
    print()
print("  2. START BACKEND  (Terminal 1):")
print("     cd bharat-terminal/backend")
print("     uvicorn main:app --reload --port 8000")
print()
print("  3. START FRONTEND  (Terminal 2):")
print("     cd bharat-terminal/frontend")
print("     npm install")
print("     npm run dev")
print()
print("  4. Open browser: http://localhost:5173")
print()
print("  💡 The terminal shows '● API Offline' in top-right when backend is down.")
print("     It should show '● API Online' in green when working.")
print("="*50 + "\n")
