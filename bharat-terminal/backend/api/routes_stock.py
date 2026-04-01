import warnings; warnings.filterwarnings("ignore")
import numpy as np
from fastapi import APIRouter, Query
from core.data_fetcher import get_quote, get_historical, get_intraday, get_fundamentals, get_options
from core.indicators import compute_indicators
from ml.signals import get_signal

router = APIRouter()

def _df_to_candles(df):
    if df is None or df.empty: return []
    candles = []
    for ts, row in df.iterrows():
        try:
            t = int(ts.timestamp())
            o = float(row.get('Open', 0) or 0)
            h = float(row.get('High', 0) or 0)
            l = float(row.get('Low',  0) or 0)
            c = float(row.get('Close',0) or 0)
            v = int(row.get('Volume', 0) or 0)
            if c > 0:
                candles.append({'time':t,'open':round(o,2),'high':round(h,2),'low':round(l,2),'close':round(c,2),'volume':v})
        except: continue
    return candles

@router.get("/quote/{symbol}")
async def quote(symbol: str, exchange: str = Query("NSE")):
    return get_quote(symbol.upper(), exchange.upper())

@router.get("/history/{symbol}")
async def history(symbol: str, exchange: str = Query("NSE"),
                  period: str = Query("1mo"), interval: str = Query("1d")):
    df = get_historical(symbol.upper(), period, interval, exchange.upper())
    return _df_to_candles(df)

@router.get("/intraday/{symbol}")
async def intraday(symbol: str, exchange: str = Query("NSE"), interval: str = Query("5m")):
    df = get_intraday(symbol.upper(), interval, exchange.upper())
    return _df_to_candles(df)

@router.get("/fundamentals/{symbol}")
async def fundamentals(symbol: str, exchange: str = Query("NSE")):
    return get_fundamentals(symbol.upper(), exchange.upper())

@router.get("/options/{symbol}")
async def options(symbol: str, exchange: str = Query("NSE")):
    return get_options(symbol.upper(), exchange.upper())

@router.get("/signal/{symbol}")
async def signal(symbol: str, exchange: str = Query("NSE")):
    try:
        df = get_historical(symbol.upper(), "6mo", "1d", exchange.upper())
        if df.empty: return {"signal": "Neutral", "indicators": {}}
        df = compute_indicators(df)
        return get_signal(df)
    except Exception as e:
        return {"signal": "Neutral", "indicators": {}, "error": str(e)}

@router.get("/pivots/{symbol}")
async def pivots(symbol: str, exchange: str = Query("NSE")):
    try:
        df = get_historical(symbol.upper(), "1mo", "1d", exchange.upper())
        if df.empty: return {}
        last = df.iloc[-1]
        h, l, c = float(last['High']), float(last['Low']), float(last['Close'])
        p = (h + l + c) / 3
        return {
            "pivot": round(p, 2),
            "r1": round(2*p - l, 2), "r2": round(p + (h-l), 2), "r3": round(h + 2*(p-l), 2),
            "s1": round(2*p - h, 2), "s2": round(p - (h-l), 2), "s3": round(l - 2*(h-p), 2),
        }
    except: return {}
