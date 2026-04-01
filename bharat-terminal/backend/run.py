"""
Safe launcher for Bharat Terminal Backend
Run: python run.py  (from inside the backend folder)
"""
import sys, os

LOG = os.path.join(os.path.dirname(__file__), "run_log.txt")

def log(msg):
    print(msg)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

with open(LOG, "w", encoding="utf-8") as f:
    f.write("=== Bharat Terminal Startup Log ===\n")

log(f"Python: {sys.version}")

try:
    import warnings; warnings.filterwarnings("ignore")

    import numpy as np; np.seterr(all='ignore')
    log(f"numpy  {np.__version__} OK")

    import pandas as pd
    log(f"pandas {pd.__version__} OK")

    import fastapi, uvicorn, yfinance, cachetools, pytz
    log(f"fastapi  {fastapi.__version__} OK")
    log(f"yfinance {yfinance.__version__} OK")

    sys.path.insert(0, os.path.dirname(__file__))

    log("Importing routes...")
    from api.routes_market import router as r1; log("  routes_market OK")
    from api.routes_stock  import router as r2; log("  routes_stock  OK")
    from api.routes_search import router as r3; log("  routes_search OK")
    from api.routes_news   import router as r4; log("  routes_news   OK")
    from api.routes_ml     import router as r5; log("  routes_ml     OK")
    from api.routes_map    import router as r6; log("  routes_map    OK")
    from api.routes_trades import router as r7; log("  routes_trades OK")

    log("")
    log("ALL IMPORTS OK")
    log("Starting server on http://127.0.0.1:8000")
    log("Frontend:  http://localhost:5173")
    log("")

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
        log_level="warning",
    )

except Exception as e:
    import traceback
    log(f"\nCRASH: {type(e).__name__}: {e}")
    log(traceback.format_exc())
    log("\nIf you see an import error, run:")
    log("  pip install fastapi uvicorn yfinance cachetools pytz feedparser textblob vaderSentiment scikit-learn requests --break-system-packages")
    input("\nPress Enter to close...")
