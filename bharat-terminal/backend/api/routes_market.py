from fastapi import APIRouter, Query
import pytz
from datetime import datetime
from core.data_fetcher import (
    get_all_indices, get_bulk_quotes, get_commodities, get_commodity_quote,
    get_currencies, get_historical, NIFTY50, NIFTY_NEXT50, NIFTY_MIDCAP,
    ALL_STOCKS, is_market_open, COMMODITIES
)

router = APIRouter()

@router.get("/indices")
async def indices():
    return get_all_indices()

@router.get("/overview")
async def overview():
    return {"quotes": get_bulk_quotes(NIFTY50[:20]), "market_open": is_market_open()}

@router.get("/commodities")
async def commodities(sector: str = Query("")):
    all_comms = get_commodities()
    if sector:
        return [c for c in all_comms if c.get("sector","").lower() == sector.lower()]
    return all_comms

@router.get("/commodity/{name}")
async def commodity_detail(name: str):
    """Get detailed quote for a specific commodity by display name."""
    decoded = name.replace("%20"," ").replace("+"," ")
    q = get_commodity_quote(decoded)
    if not q:
        # try partial match
        for cname in COMMODITIES:
            if decoded.upper() in cname.upper():
                q = get_commodity_quote(cname)
                break
    return q or {"error": "Not found"}

@router.get("/commodity-history/{name}")
async def commodity_history(name: str, period: str = Query("1y"), interval: str = Query("1d")):
    decoded = name.replace("%20"," ").replace("+"," ")
    info = COMMODITIES.get(decoded)
    if not info:
        for cname, cinfo in COMMODITIES.items():
            if decoded.upper() in cname.upper():
                info = cinfo; break
    if not info: return []
    try:
        import yfinance as yf, pandas as pd
        df = yf.Ticker(info["sym"]).history(period=period, interval=interval, auto_adjust=True)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = [c[0] for c in df.columns]
        candles = []
        for ts, row in df.iterrows():
            c = float(row.get("Close",0) or 0)
            if c > 0:
                candles.append({
                    "time": int(ts.timestamp()),
                    "open":  round(float(row.get("Open",c) or c),4),
                    "high":  round(float(row.get("High",c) or c),4),
                    "low":   round(float(row.get("Low",c)  or c),4),
                    "close": round(c,4),
                    "volume": int(row.get("Volume",0) or 0),
                })
        return candles
    except Exception as e:
        return []

@router.get("/currencies")
async def currencies():
    return get_currencies()

@router.get("/nifty50")
async def nifty50():
    return get_bulk_quotes(NIFTY50)

@router.get("/niftynext50")
async def nifty_next50():
    return get_bulk_quotes(NIFTY_NEXT50[:30])

@router.get("/midcap")
async def midcap():
    return get_bulk_quotes(NIFTY_MIDCAP[:30])

@router.get("/bse")
async def bse():
    # Top BSE stocks (same as NSE Nifty50 but with .BO suffix)
    return get_bulk_quotes(NIFTY50[:30], exchange="BSE")

@router.get("/status")
async def status():
    tz = pytz.timezone("Asia/Kolkata")
    now = datetime.now(tz)
    return {
        "market_open": is_market_open(),
        "time_ist": now.strftime("%H:%M:%S"),
        "date": now.strftime("%d %b %Y"),
        "day": now.strftime("%A"),
        "total_stocks": len(ALL_STOCKS),
    }

# ETF routes (appended)
from core.data_fetcher import get_all_etfs, get_etf_quote, ETFS
import yfinance as yf
import pandas as pd

@router.get("/etfs")
async def etfs(sector: str = ""):
    return get_all_etfs(sector)

@router.get("/etf/{name}")
async def etf_detail(name: str):
    decoded = name.replace("%20"," ").replace("+"," ")
    q = get_etf_quote(decoded)
    if not q:
        for n in ETFS:
            if decoded.upper() in n.upper():
                q = get_etf_quote(n)
                break
    return q or {"error":"Not found"}

@router.get("/etf-history/{name}")
async def etf_history(name: str, period: str = "1y", interval: str = "1d"):
    decoded = name.replace("%20"," ").replace("+"," ")
    info = ETFS.get(decoded)
    if not info:
        for n, i in ETFS.items():
            if decoded.upper() in n.upper():
                info = i; break
    if not info: return []
    try:
        df = yf.Ticker(info["sym"]).history(period=period, interval=interval, auto_adjust=True)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = [c[0] for c in df.columns]
        return [{"time":int(ts.timestamp()),"open":round(float(r.get("Open",0)),2),
                 "high":round(float(r.get("High",0)),2),"low":round(float(r.get("Low",0)),2),
                 "close":round(float(r.get("Close",0)),2),"volume":int(r.get("Volume",0) or 0)}
                for ts,r in df.iterrows() if float(r.get("Close",0))>0]
    except: return []
