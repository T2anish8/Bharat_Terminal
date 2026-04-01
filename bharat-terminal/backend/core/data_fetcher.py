"""
BHARAT TERMINAL — Core Data Fetcher
Full India coverage: NSE/BSE stocks + MCX/NCDEX commodities + currencies + indices
"""
import logging, threading, warnings
warnings.filterwarnings("ignore")
from datetime import datetime, time as dtime
from typing import Optional
import pytz, pandas as pd, numpy as np, yfinance as yf
from cachetools import TTLCache

log = logging.getLogger(__name__)
IST = pytz.timezone("Asia/Kolkata")
_LIVE = TTLCache(maxsize=2000, ttl=45)
_HIST = TTLCache(maxsize=1000, ttl=3600)
_FUND = TTLCache(maxsize=500,  ttl=86400)

# ══════════════════════════════════════════════════════════
# INDICES
# ══════════════════════════════════════════════════════════
INDICES = {
    "NIFTY 50":         "^NSEI",
    "SENSEX":           "^BSESN",
    "SENSEX":           "^BSESN",
    "NIFTY NEXT 50":    "^NSMIDCP",
    "NIFTY 100":        "^CNX100",
    "NIFTY 200":        "NIFTY200.NS",
    "NIFTY 500":        "NIFTY500.NS",
    "NIFTY MIDCAP 100": "NIFTYMIDCAP100.NS",
    "NIFTY SMALLCAP":   "NIFTYSMLCAP100.NS",
    "NIFTY BANK":       "^NSEBANK",
    "NIFTY IT":         "^CNXIT",
    "NIFTY PHARMA":     "NIFTYPHARMA.NS",
    "NIFTY AUTO":       "^CNXAUTO",
    "NIFTY FMCG":       "^CNXFMCG",
    "NIFTY METAL":      "^CNXMETAL",
    "NIFTY REALTY":     "NIFTYREALTY.NS",
    "NIFTY ENERGY":     "^CNXENERGY",
    "NIFTY INFRA":      "^CNXINFRA",
    "NIFTY PSU BANK":   "NIFTYPSUBNK.NS",
    "NIFTY MEDIA":      "NIFTYMEDIA.NS",
    "INDIA VIX":        "^INDIAVIX",
}

# ══════════════════════════════════════════════════════════
# MCX / NCDEX COMMODITIES — Full list with yfinance symbols
# ══════════════════════════════════════════════════════════
COMMODITIES = {
    # ── PRECIOUS METALS ──
    "Gold":           {"sym":"GC=F",  "exchange":"MCX",   "unit":"per 10g",   "sector":"Precious Metals"},
    "Silver":         {"sym":"SI=F",  "exchange":"MCX",   "unit":"per kg",    "sector":"Precious Metals"},
    "Platinum":       {"sym":"PL=F",  "exchange":"MCX",   "unit":"per oz",    "sector":"Precious Metals"},
    "Palladium":      {"sym":"PA=F",  "exchange":"MCX",   "unit":"per oz",    "sector":"Precious Metals"},
    # ── BASE METALS ──
    "Copper":         {"sym":"HG=F",  "exchange":"MCX",   "unit":"per kg",    "sector":"Base Metals"},
    "Aluminium":      {"sym":"ALI=F", "exchange":"MCX",   "unit":"per kg",    "sector":"Base Metals"},
    "Zinc":           {"sym":"ZC=F",  "exchange":"MCX",   "unit":"per kg",    "sector":"Base Metals"},
    "Lead":           {"sym":"LE=F",  "exchange":"MCX",   "unit":"per kg",    "sector":"Base Metals"},
    "Nickel":         {"sym":"NI=F",  "exchange":"MCX",   "unit":"per kg",    "sector":"Base Metals"},
    "Steel":          {"sym":"HRC=F", "exchange":"MCX",   "unit":"per tonne", "sector":"Base Metals"},
    "Iron Ore":       {"sym":"TIO=F", "exchange":"MCX",   "unit":"per tonne", "sector":"Base Metals"},
    # ── ENERGY ──
    "Crude Oil":      {"sym":"CL=F",  "exchange":"MCX",   "unit":"per bbl",   "sector":"Energy"},
    "Brent Crude":    {"sym":"BZ=F",  "exchange":"MCX",   "unit":"per bbl",   "sector":"Energy"},
    "Natural Gas":    {"sym":"NG=F",  "exchange":"MCX",   "unit":"per mmbtu", "sector":"Energy"},
    "Heating Oil":    {"sym":"HO=F",  "exchange":"MCX",   "unit":"per gal",   "sector":"Energy"},
    "Gasoline RBOB":  {"sym":"RB=F",  "exchange":"MCX",   "unit":"per gal",   "sector":"Energy"},
    # ── AGRI — NCDEX ──
    "Cotton":         {"sym":"CT=F",  "exchange":"NCDEX", "unit":"per bale",  "sector":"Agri"},
    "Soybean":        {"sym":"ZS=F",  "exchange":"NCDEX", "unit":"per quintal","sector":"Agri"},
    "Soybean Oil":    {"sym":"ZL=F",  "exchange":"NCDEX", "unit":"per 10kg",  "sector":"Agri"},
    "Soybean Meal":   {"sym":"ZM=F",  "exchange":"NCDEX", "unit":"per tonne", "sector":"Agri"},
    "Wheat":          {"sym":"ZW=F",  "exchange":"NCDEX", "unit":"per quintal","sector":"Agri"},
    "Corn/Maize":     {"sym":"ZC=F",  "exchange":"NCDEX", "unit":"per quintal","sector":"Agri"},
    "Sugar":          {"sym":"SB=F",  "exchange":"NCDEX", "unit":"per quintal","sector":"Agri"},
    "Coffee":         {"sym":"KC=F",  "exchange":"NCDEX", "unit":"per kg",    "sector":"Agri"},
    "Cocoa":          {"sym":"CC=F",  "exchange":"NCDEX", "unit":"per tonne", "sector":"Agri"},
    "Castor Seed":    {"sym":"ZC=F",  "exchange":"NCDEX", "unit":"per quintal","sector":"Agri"},
    "Turmeric":       {"sym":"ZC=F",  "exchange":"NCDEX", "unit":"per quintal","sector":"Agri"},
    "Chana (Gram)":   {"sym":"ZC=F",  "exchange":"NCDEX", "unit":"per quintal","sector":"Agri"},
    "Mustard Seed":   {"sym":"ZC=F",  "exchange":"NCDEX", "unit":"per quintal","sector":"Agri"},
    "Guar Seed":      {"sym":"ZC=F",  "exchange":"NCDEX", "unit":"per quintal","sector":"Agri"},
    # ── SOFTS ──
    "Orange Juice":   {"sym":"OJ=F",  "exchange":"NCDEX", "unit":"per lb",    "sector":"Softs"},
    "Lumber":         {"sym":"LBS=F", "exchange":"NCDEX", "unit":"per 1000bf","sector":"Softs"},
    "Oat":            {"sym":"ZO=F",  "exchange":"NCDEX", "unit":"per quintal","sector":"Softs"},
    "Rice":           {"sym":"ZR=F",  "exchange":"NCDEX", "unit":"per quintal","sector":"Softs"},
    "Live Cattle":    {"sym":"LE=F",  "exchange":"NCDEX", "unit":"per lb",    "sector":"Softs"},
}

# ══════════════════════════════════════════════════════════
# CURRENCIES
# ══════════════════════════════════════════════════════════
CURRENCIES = {
    "USD/INR": "USDINR=X", "EUR/INR": "EURINR=X", "GBP/INR": "GBPINR=X",
    "JPY/INR": "JPYINR=X", "AUD/INR": "AUDINR=X", "CHF/INR": "CHFINR=X",
    "SGD/INR": "SGDINR=X", "HKD/INR": "HKDINR=X", "CAD/INR": "CADINR=X",
    "CNY/INR": "CNYINR=X", "AED/INR": "AEDIINR=X","SAR/INR": "SARINR=X",
}

# ══════════════════════════════════════════════════════════
# STOCKS
# ══════════════════════════════════════════════════════════
NIFTY50 = [
    "RELIANCE","TCS","HDFCBANK","INFY","ICICIBANK","HINDUNILVR","ITC","SBIN",
    "BHARTIARTL","KOTAKBANK","LT","AXISBANK","ASIANPAINT","MARUTI","TITAN",
    "SUNPHARMA","ULTRACEMCO","BAJFINANCE","WIPRO","ONGC","NTPC","POWERGRID",
    "M&M","BAJAJFINSV","TECHM","HCLTECH","DIVISLAB","ADANIENT","ADANIPORTS",
    "JSWSTEEL","TATASTEEL","COALINDIA","BPCL","HEROMOTOCO","EICHERMOT",
    "CIPLA","DRREDDY","BRITANNIA","NESTLEIND","GRASIM","HINDALCO",
    "SBILIFE","HDFCLIFE","INDUSINDBK","APOLLOHOSP","TATACONSUM","LTIM",
    "BAJAJ-AUTO","UPL","VEDL",
]
NIFTY_NEXT50 = [
    "ADANIGREEN","AMBUJACEM","AUROPHARMA","BANDHANBNK","BERGEPAINT","BIOCON",
    "BOSCHLTD","CHOLAFIN","COLPAL","DABUR","DLF","GAIL","GODREJCP","HAVELLS",
    "ICICIGI","ICICIPRULI","IGL","IRCTC","LICI","LUPIN","MARICO","MCX",
    "MPHASIS","MRF","MUTHOOTFIN","NAUKRI","PAGEIND","PIDILITIND","RECLTD",
    "SAIL","SHREECEM","SIEMENS","SRF","TATACHEM","TORNTPHARM","TRENT","VOLTAS",
    "ZOMATO","PAYTM","FEDERALBNK","IDFCFIRSTB","AUBANK","PERSISTENT","COFORGE",
    "DIXON","POLYCAB","LTTS","SBICARD","INDIGO","APOLLOTYRE",
]
NIFTY_MIDCAP = [
    "AARTIIND","ABB","ALKEM","APLLTD","ATGL","BAJAJHLDNG","BALKRISIND",
    "BATAINDIA","BEL","BHARATFORG","BHEL","CANBK","CANFINHOME","CASTROLIND",
    "CEATLTD","CESC","CROMPTON","CYIENT","DEEPAKFERT","DEEPAKNTR","DELTACORP",
    "EMAMILTD","ESCORTS","EXIDEIND","FORTIS","GNFC","GODREJIND","GODREJPROP",
    "GRANULES","GRAPHITE","GUJGASLTD","HAPPSTMNDS","HAVELLS","HONAUT",
    "IDFCFIRSTB","IEX","INDHOTEL","JKCEMENT","JSWENERGY","JUBLFOOD",
    "KAJARIACER","KEC","KPITTECH","LAURUSLABS","LICHSGFIN","LALPATHLAB",
    "MANAPPURAM","MAXHEALTH","METROPOLIS","MINDTREE","MOTILALOFS","NAVINFLUOR",
    "NBCC","NCC","NHPC","NLCINDIA","NMDC","OBEROIRLTY","OIL","PETRONET",
    "PHOENIXLTD","POLYMED","PRESTIGE","PVRINOX","RAINBOW","RAMCOCEM",
    "RAYMOND","RELAXO","RITES","RPOWER","SCHAEFFLER","SOBHA","SONACOMS",
    "STARHEALTH","STRTECH","SUNDRMFAST","SUPREMEIND","SUZLON","SYNGENE",
    "TANLA","TITAGARH","TORNTPOWER","TTKPRESTIG","TVSHLTD","UJJIVANSFB",
    "UNIONBANK","UNIPARTS","VGUARD","VBL","WELCORP","WELSPUNIND",
    "YESBANK","ZEEL","ZYDUSLIFE",
]

SECTOR_MAP = {
    "RELIANCE":"Energy","TCS":"IT","HDFCBANK":"Banking","INFY":"IT",
    "ICICIBANK":"Banking","HINDUNILVR":"FMCG","ITC":"FMCG","SBIN":"Banking",
    "BHARTIARTL":"Telecom","KOTAKBANK":"Banking","LT":"Infrastructure",
    "AXISBANK":"Banking","ASIANPAINT":"Chemicals","MARUTI":"Auto",
    "TITAN":"Consumer","SUNPHARMA":"Pharma","ULTRACEMCO":"Cement",
    "BAJFINANCE":"NBFC","WIPRO":"IT","ONGC":"Energy","NTPC":"Power",
    "POWERGRID":"Power","M&M":"Auto","BAJAJFINSV":"NBFC","TECHM":"IT",
    "HCLTECH":"IT","DIVISLAB":"Pharma","ADANIENT":"Conglomerate",
    "ADANIPORTS":"Infrastructure","JSWSTEEL":"Metal","TATASTEEL":"Metal",
    "COALINDIA":"Mining","BPCL":"Energy","HEROMOTOCO":"Auto",
    "EICHERMOT":"Auto","CIPLA":"Pharma","DRREDDY":"Pharma",
    "BRITANNIA":"FMCG","NESTLEIND":"FMCG","GRASIM":"Diversified",
    "HINDALCO":"Metal","SBILIFE":"Insurance","HDFCLIFE":"Insurance",
    "INDUSINDBK":"Banking","APOLLOHOSP":"Healthcare","TATACONSUM":"FMCG",
    "LTIM":"IT","BAJAJ-AUTO":"Auto","UPL":"Chemicals","VEDL":"Metal",
    "ZOMATO":"Consumer Tech","PAYTM":"Fintech","IRCTC":"Travel",
    "NAUKRI":"Tech","DLF":"Real Estate","GODREJPROP":"Real Estate",
    "INDIGO":"Aviation","YESBANK":"Banking","IDFCFIRSTB":"Banking",
    "FEDERALBNK":"Banking","BANDHANBNK":"Banking","AUBANK":"Banking",
    "DIXON":"Electronics","POLYCAB":"Cables","HAVELLS":"Electricals",
    "VOLTAS":"Electricals","CROMPTON":"Electricals","JUBLFOOD":"QSR",
    "LAURUSLABS":"Pharma","ALKEM":"Pharma","LUPIN":"Pharma",
    "AUROPHARMA":"Pharma","TORNTPHARM":"Pharma","BIOCON":"Pharma",
    "GRANULES":"Pharma","COFORGE":"IT","MPHASIS":"IT","PERSISTENT":"IT",
    "KPITTECH":"IT","HAPPSTMNDS":"IT","TANLA":"IT",
    "ADANIGREEN":"Power","SUZLON":"Power","TORNTPOWER":"Power",
    "CESC":"Power","JSWENERGY":"Power","NHPC":"Power",
    "SAIL":"Metal","NMDC":"Mining","WELCORP":"Metal",
    "MCX":"Fintech","MOTILALOFS":"Fintech","SBICARD":"Fintech",
}

ALL_STOCKS = list(dict.fromkeys(NIFTY50 + NIFTY_NEXT50 + NIFTY_MIDCAP))

EXCHANGE_CONFIG = {
    "NSE":  {"suffix":".NS","name":"National Stock Exchange",    "lat":19.0596,"lon":72.8656},
    "BSE":  {"suffix":".BO","name":"Bombay Stock Exchange",       "lat":18.9268,"lon":72.8337},
    "MCX":  {"suffix":"=F", "name":"Multi Commodity Exchange",    "lat":19.0800,"lon":72.8777},
    "NCDEX":{"suffix":"=F", "name":"National Commodity Exchange", "lat":19.0596,"lon":72.8656},
}

def is_market_open():
    now = datetime.now(IST)
    if now.weekday() >= 5: return False
    t = now.time()
    return dtime(9,15) <= t <= dtime(15,30)

def _pct(a, b):
    try: return round((a-b)/b*100, 2) if b else 0.0
    except: return 0.0

def _clean(df):
    if df is None or df.empty: return pd.DataFrame()
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [c[0] for c in df.columns]
    cols = [c for c in ["Open","High","Low","Close","Volume"] if c in df.columns]
    if not cols: return pd.DataFrame()
    df = df[cols].copy().dropna(subset=["Close"])
    df.index = pd.to_datetime(df.index)
    return df

def to_yf(symbol, exchange="NSE"):
    if symbol.startswith("^") or "=" in symbol or symbol.endswith(("=F",".NS",".BO")):
        return symbol
    suffix = EXCHANGE_CONFIG.get(exchange.upper(),{}).get("suffix",".NS")
    return symbol + suffix

def get_quote(symbol, exchange="NSE"):
    key = f"q_{exchange}_{symbol}"
    if key in _LIVE: return _LIVE[key]
    base = {"symbol":symbol,"exchange":exchange,"name":symbol,
            "price":0,"change":0,"change_pct":0,"open":0,"high":0,"low":0,
            "prev_close":0,"volume":0,"market_cap":0,"week_52_high":0,"week_52_low":0,
            "sector":SECTOR_MAP.get(symbol,"N/A"),
            "timestamp":datetime.now(IST).isoformat()}
    try:
        t = yf.Ticker(to_yf(symbol, exchange))
        fi = t.fast_info
        px = float(fi.last_price or 0)
        if px == 0:
            h = _clean(t.history(period="5d", interval="1d"))
            if not h.empty: px = float(h["Close"].iloc[-1])
        if px == 0: return base
        prev = float(getattr(fi,"previous_close",None) or px)
        r = {**base,
            "name":        str(getattr(fi,"name",symbol)),
            "price":       round(px,2),
            "change":      round(px-prev,2),
            "change_pct":  _pct(px,prev),
            "open":        round(float(getattr(fi,"open",None) or px),2),
            "high":        round(float(fi.day_high or px),2),
            "low":         round(float(fi.day_low  or px),2),
            "prev_close":  round(prev,2),
            "volume":      int(fi.last_volume or 0),
            "market_cap":  int(fi.market_cap or 0),
            "week_52_high":round(float(fi.year_high or 0),2),
            "week_52_low": round(float(fi.year_low  or 0),2),
        }
        _LIVE[key] = r
        return r
    except Exception as e:
        log.debug(f"Quote {symbol}: {e}")
        return base

def get_commodity_quote(name):
    """Get quote for a commodity by its display name."""
    info = COMMODITIES.get(name)
    if not info: return None
    key = f"comm_{name}"
    if key in _LIVE: return _LIVE[key]
    try:
        t = yf.Ticker(info["sym"])
        fi = t.fast_info
        px = float(fi.last_price or 0)
        if px == 0:
            h = _clean(t.history(period="5d", interval="1d"))
            if not h.empty: px = float(h["Close"].iloc[-1])
        if px == 0: return None
        prev = float(getattr(fi,"previous_close",None) or px)
        r = {
            "symbol": info["sym"], "name": name,
            "exchange": info["exchange"], "sector": info["sector"],
            "unit": info["unit"],
            "price": round(px,2), "change": round(px-prev,2),
            "change_pct": _pct(px,prev),
            "high": round(float(fi.day_high or px),2),
            "low":  round(float(fi.day_low  or px),2),
            "prev_close": round(prev,2),
            "week_52_high": round(float(fi.year_high or 0),2),
            "week_52_low":  round(float(fi.year_low  or 0),2),
            "volume": int(fi.last_volume or 0),
        }
        _LIVE[key] = r
        return r
    except Exception as e:
        log.debug(f"Commodity {name}: {e}")
        return None

def get_bulk_quotes(symbols, exchange="NSE"):
    results, lock = [], threading.Lock()
    def fetch(sym):
        q = get_quote(sym, exchange)
        if q.get("price",0) > 0:
            with lock: results.append(q)
    threads = [threading.Thread(target=fetch, args=(s,)) for s in symbols]
    for t in threads: t.start()
    for t in threads: t.join(timeout=12)
    order = {s:i for i,s in enumerate(symbols)}
    results.sort(key=lambda x: order.get(x["symbol"],999))
    return results

def get_historical(symbol, period="1y", interval="1d", exchange="NSE"):
    key = f"h_{exchange}_{symbol}_{period}_{interval}"
    if key in _HIST: return _HIST[key]
    try:
        df = _clean(yf.Ticker(to_yf(symbol,exchange)).history(period=period,interval=interval,auto_adjust=True))
        if not df.empty: _HIST[key] = df
        return df
    except Exception as e:
        log.debug(f"History {symbol}: {e}")
        return pd.DataFrame()

def get_intraday(symbol, interval="5m", exchange="NSE"):
    key = f"i_{exchange}_{symbol}_{interval}"
    if key in _HIST: return _HIST[key]
    try:
        df = _clean(yf.Ticker(to_yf(symbol,exchange)).history(period="1d",interval=interval,auto_adjust=True))
        if not df.empty: _HIST[key] = df
        return df
    except Exception as e:
        log.debug(f"Intraday {symbol}: {e}")
        return pd.DataFrame()

def get_all_indices():
    key = "all_indices"
    if key in _LIVE: return _LIVE[key]
    results, lock = [], threading.Lock()
    def fetch(name, yf_sym):
        try:
            fi = yf.Ticker(yf_sym).fast_info
            px = float(fi.last_price or 0)
            if px == 0: return
            prev = float(getattr(fi,"previous_close",None) or px)
            with lock: results.append({
                "name":name,"symbol":yf_sym,
                "price":round(px,2),"change":round(px-prev,2),"change_pct":_pct(px,prev),
                "high":round(float(fi.day_high or px),2),"low":round(float(fi.day_low or px),2),
            })
        except: pass
    threads = [threading.Thread(target=fetch,args=(n,s)) for n,s in INDICES.items()]
    for t in threads: t.start()
    for t in threads: t.join(timeout=14)
    order = list(INDICES.keys())
    results.sort(key=lambda x: order.index(x["name"]) if x["name"] in order else 99)
    _LIVE[key] = results
    return results

def get_commodities():
    key = "commodities_all"
    if key in _LIVE: return _LIVE[key]
    results, lock = [], threading.Lock()
    seen_syms = set()
    def fetch(name, info):
        sym = info["sym"]
        if sym in seen_syms: return
        seen_syms.add(sym)
        q = get_commodity_quote(name)
        if q: 
            with lock: results.append(q)
    threads = [threading.Thread(target=fetch,args=(n,i)) for n,i in COMMODITIES.items()]
    for t in threads: t.start()
    for t in threads: t.join(timeout=14)
    results.sort(key=lambda x: ["Precious Metals","Base Metals","Energy","Agri","Softs"].index(x.get("sector","Softs")) if x.get("sector") in ["Precious Metals","Base Metals","Energy","Agri","Softs"] else 99)
    _LIVE[key] = results
    return results

def get_currencies():
    key = "currencies"
    if key in _LIVE: return _LIVE[key]
    results = []
    for name, yf_sym in CURRENCIES.items():
        try:
            fi = yf.Ticker(yf_sym).fast_info
            px = float(fi.last_price or 0)
            if px == 0: continue
            prev = float(getattr(fi,"previous_close",None) or px)
            results.append({"name":name,"symbol":yf_sym,"exchange":"NSE",
                "price":round(px,4),"change":round(px-prev,4),"change_pct":_pct(px,prev)})
        except: continue
    _LIVE[key] = results
    return results

def get_fundamentals(symbol, exchange="NSE"):
    key = f"f_{exchange}_{symbol}"
    if key in _FUND: return _FUND[key]
    base = {"symbol":symbol,"name":symbol,"exchange":exchange,"sector":SECTOR_MAP.get(symbol,"N/A")}
    try:
        info = yf.Ticker(to_yf(symbol,exchange)).info
        r = {**base,
            "name":          info.get("longName",symbol),
            "sector":        info.get("sector",SECTOR_MAP.get(symbol,"N/A")),
            "industry":      info.get("industry","N/A"),
            "market_cap":    info.get("marketCap",0) or 0,
            "pe":            round(float(info.get("trailingPE") or 0),2),
            "forward_pe":    round(float(info.get("forwardPE") or 0),2),
            "pb":            round(float(info.get("priceToBook") or 0),2),
            "eps":           round(float(info.get("trailingEps") or 0),2),
            "div_yield":     round(float(info.get("dividendYield") or 0)*100,2),
            "roe":           round(float(info.get("returnOnEquity") or 0)*100,2),
            "debt_equity":   round(float(info.get("debtToEquity") or 0),2),
            "current_ratio": round(float(info.get("currentRatio") or 0),2),
            "revenue":       info.get("totalRevenue",0) or 0,
            "net_income":    info.get("netIncomeToCommon",0) or 0,
            "profit_margin": round(float(info.get("profitMargins") or 0)*100,2),
            "week_52_high":  round(float(info.get("fiftyTwoWeekHigh") or 0),2),
            "week_52_low":   round(float(info.get("fiftyTwoWeekLow") or 0),2),
            "beta":          round(float(info.get("beta") or 1.0),2),
            "avg_volume":    info.get("averageVolume",0) or 0,
            "employees":     info.get("fullTimeEmployees",0) or 0,
            "website":       info.get("website",""),
            "description":   info.get("longBusinessSummary",""),
        }
        _FUND[key] = r
        return r
    except Exception as e:
        log.debug(f"Fundamentals {symbol}: {e}")
        return base

def get_options(symbol, exchange="NSE"):
    empty = {"calls":[],"puts":[],"expiries":[],"spot":0}
    try:
        t = yf.Ticker(to_yf(symbol,exchange))
        expiries = t.options
        if not expiries: return empty
        chain = t.option_chain(expiries[0])
        spot = get_quote(symbol,exchange).get("price",0)
        def safe(df):
            if df is None or df.empty: return []
            df = df.copy()
            for c in df.select_dtypes(include=["float","int"]).columns:
                df[c] = df[c].where(df[c].notna(), None)
            return df.to_dict("records")
        return {"calls":safe(chain.calls),"puts":safe(chain.puts),"expiries":list(expiries),"spot":spot}
    except Exception as e:
        log.debug(f"Options {symbol}: {e}")
        return empty

def search_symbols(query):
    q = query.upper().strip()
    if not q: return []
    results, seen = [], set()
    def add(sym, name, exchange, type_, price=0, change_pct=0, sector="N/A", extra=None):
        if sym in seen: return
        seen.add(sym)
        item = {"symbol":sym,"name":name,"exchange":exchange,"type":type_,
                "price":price,"change_pct":change_pct,"sector":sector}
        if extra: item.update(extra)
        results.append(item)
    # Stocks
    for sym in ALL_STOCKS:
        if q in sym or q in sym.replace("-","") or q in SECTOR_MAP.get(sym,"").upper():
            lq = _LIVE.get(f"q_NSE_{sym}",{})
            add(sym, lq.get("name",sym), "NSE", "EQUITY",
                lq.get("price",0), lq.get("change_pct",0), SECTOR_MAP.get(sym,"N/A"))
    # Indices
    for name, yf_sym in INDICES.items():
        if q in name.upper() or q in yf_sym.upper():
            add(yf_sym, name, "NSE", "INDEX")
    # Commodities — search by name and sector
    for name, info in COMMODITIES.items():
        if q in name.upper() or q in info["sector"].upper() or q in info["exchange"].upper():
            lq = _LIVE.get(f"comm_{name}",{})
            add(info["sym"], name, info["exchange"], "COMMODITY",
                lq.get("price",0), lq.get("change_pct",0), info["sector"],
                {"unit":info["unit"],"display_name":name})
    # Currencies
    for name, yf_sym in CURRENCIES.items():
        if q in name.upper():
            add(yf_sym, name, "NSE", "CURRENCY")
    # Fallback: try NSE/BSE directly
    if not results and len(q) >= 2:
        for ex, suffix in [("NSE",".NS"),("BSE",".BO")]:
            try:
                fi = yf.Ticker(q+suffix).fast_info
                px = float(fi.last_price or 0)
                if px > 0: add(q, q, ex, "EQUITY", px)
            except: pass
    return results[:35]

# ══════════════════════════════════════════════════════════
# ETFs & GOLD/SILVER INSTRUMENTS (NSE)
# ══════════════════════════════════════════════════════════
ETFS = {
    # Gold ETFs
    "HDFC Gold ETF":      {"sym":"HDFCGOLD.NS",  "exchange":"NSE","sector":"Gold ETF"},
    "SBI Gold ETF":       {"sym":"SBIGETS.NS",    "exchange":"NSE","sector":"Gold ETF"},
    "Nippon Gold ETF":    {"sym":"GOLDBEES.NS",   "exchange":"NSE","sector":"Gold ETF"},
    "ICICI Gold ETF":     {"sym":"ICICIGOLD.NS",  "exchange":"NSE","sector":"Gold ETF"},
    "Axis Gold ETF":      {"sym":"AXISGOLD.NS",   "exchange":"NSE","sector":"Gold ETF"},
    "Kotak Gold ETF":     {"sym":"KOTAKGOLD.NS",  "exchange":"NSE","sector":"Gold ETF"},
    "Birla Gold ETF":     {"sym":"ABSLGOLD.NS",   "exchange":"NSE","sector":"Gold ETF"},
    "Invesco Gold ETF":   {"sym":"IVZINGOLD.NS",  "exchange":"NSE","sector":"Gold ETF"},
    "Tata Gold ETF":      {"sym":"TATGOLD.NS",    "exchange":"NSE","sector":"Gold ETF"},
    "UTI Gold ETF":       {"sym":"UTIISIGOLD.NS", "exchange":"NSE","sector":"Gold ETF"},
    # Silver ETFs
    "HDFC Silver ETF":    {"sym":"HDFC_SILVER.NS","exchange":"NSE","sector":"Silver ETF"},
    "Nippon Silver ETF":  {"sym":"SILVERBEES.NS", "exchange":"NSE","sector":"Silver ETF"},
    "ICICI Silver ETF":   {"sym":"ICICISILETF.NS","exchange":"NSE","sector":"Silver ETF"},
    "Axis Silver ETF":    {"sym":"AXSILVER.NS",   "exchange":"NSE","sector":"Silver ETF"},
    "Aditya Silver ETF":  {"sym":"ABSLSILVER.NS", "exchange":"NSE","sector":"Silver ETF"},
    "Mirae Silver ETF":   {"sym":"MIRAESILVER.NS","exchange":"NSE","sector":"Silver ETF"},
    # Broad Market ETFs
    "Nippon BeES":        {"sym":"NIFTYBEES.NS",  "exchange":"NSE","sector":"Index ETF"},
    "SBI Nifty ETF":      {"sym":"SETFNIF50.NS",  "exchange":"NSE","sector":"Index ETF"},
    "HDFC Nifty ETF":     {"sym":"HDFCNIFETF.NS", "exchange":"NSE","sector":"Index ETF"},
    "ICICI Nifty ETF":    {"sym":"ICICIB22.NS",   "exchange":"NSE","sector":"Index ETF"},
    "Nippon BankBees":    {"sym":"BANKBEES.NS",   "exchange":"NSE","sector":"Sector ETF"},
    "Nippon ITBees":      {"sym":"ITBEES.NS",     "exchange":"NSE","sector":"Sector ETF"},
    "SBI PSU ETF":        {"sym":"SETFPSU.NS",    "exchange":"NSE","sector":"Sector ETF"},
    "CPSE ETF":           {"sym":"CPSEETF.NS",    "exchange":"NSE","sector":"Sector ETF"},
    # International ETFs
    "Motilal Nasdaq":     {"sym":"MO N100.NS",    "exchange":"NSE","sector":"Intl ETF"},
    "Mirae NY Dow":       {"sym":"MAFANG.NS",     "exchange":"NSE","sector":"Intl ETF"},
    # MCX Futures (specific contracts)
    "Gold Feb MCX":       {"sym":"GC=F",          "exchange":"MCX","sector":"Gold Futures"},
    "Silver Mar MCX":     {"sym":"SI=F",          "exchange":"MCX","sector":"Silver Futures"},
    "Crude Oil Feb MCX":  {"sym":"CL=F",          "exchange":"MCX","sector":"Energy Futures"},
    "Copper Feb MCX":     {"sym":"HG=F",          "exchange":"MCX","sector":"Metal Futures"},
    "Natural Gas MCX":    {"sym":"NG=F",          "exchange":"MCX","sector":"Energy Futures"},
    "Zinc MCX":           {"sym":"ZNC=F",         "exchange":"MCX","sector":"Metal Futures"},
    "Lead MCX":           {"sym":"LE=F",          "exchange":"MCX","sector":"Metal Futures"},
    "Nickel MCX":         {"sym":"NI=F",          "exchange":"MCX","sector":"Metal Futures"},
    "Aluminium MCX":      {"sym":"ALI=F",         "exchange":"MCX","sector":"Metal Futures"},
}

def get_etf_quote(name: str) -> dict:
    """Get quote for an ETF/futures instrument by display name."""
    info = ETFS.get(name)
    if not info: return None
    key = f"etf_{name}"
    if key in _LIVE: return _LIVE[key]
    try:
        t  = yf.Ticker(info["sym"])
        fi = t.fast_info
        px = float(fi.last_price or 0)
        if px == 0:
            h = _clean(t.history(period="5d", interval="1d"))
            if not h.empty: px = float(h["Close"].iloc[-1])
        if px == 0: return None
        prev = float(getattr(fi,"previous_close", None) or px)
        r = {
            "symbol": info["sym"], "name": name,
            "exchange": info["exchange"], "sector": info["sector"],
            "price": round(px,2), "change": round(px-prev,2),
            "change_pct": _pct(px,prev),
            "high": round(float(fi.day_high or px),2),
            "low":  round(float(fi.day_low  or px),2),
            "prev_close": round(prev,2),
            "week_52_high": round(float(fi.year_high or 0),2),
            "week_52_low":  round(float(fi.year_low  or 0),2),
            "volume": int(fi.last_volume or 0),
        }
        _LIVE[key] = r
        return r
    except Exception as e:
        log.debug(f"ETF {name}: {e}")
        return None

def get_all_etfs(sector_filter: str = "") -> list:
    results, lock = [], threading.Lock()
    def fetch(name, info):
        q = get_etf_quote(name)
        if q and q.get("price", 0) > 0:
            if not sector_filter or sector_filter.lower() in q["sector"].lower():
                with lock: results.append(q)
    threads = [threading.Thread(target=fetch, args=(n, i)) for n, i in ETFS.items()]
    for t in threads: t.start()
    for t in threads: t.join(timeout=14)
    results.sort(key=lambda x: x.get("sector",""))
    return results
