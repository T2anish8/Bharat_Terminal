"""
Live Trade Flow + per-city + per-state real-time stats
"""
import asyncio, json, random, time, logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from core.data_fetcher import get_quote, NIFTY50, get_all_indices

router = APIRouter()
log    = logging.getLogger(__name__)

TRADER_TYPES = {
    "FII":  {"color":"#FF6B2B","weight":0.25,"size_mult":5.0},
    "DII":  {"color":"#2979FF","weight":0.20,"size_mult":4.0},
    "PROP": {"color":"#FFB800","weight":0.20,"size_mult":3.0},
    "HNI":  {"color":"#9C6FFF","weight":0.15,"size_mult":2.0},
    "RET":  {"color":"#00E5A0","weight":0.20,"size_mult":1.0},
}

# City → (state, lat, lon, weight, top_stocks, top_sectors)
CITY_DATA = {
    "Mumbai":      ("Maharashtra", 19.076,72.877, 0.32, ["RELIANCE","HDFCBANK","ICICIBANK","SBIN","BAJFINANCE"], ["Banking","Finance","Energy","FMCG"]),
    "Delhi":       ("Delhi",       28.613,77.209, 0.14, ["BHARTIARTL","POWERGRID","NTPC","LT","COALINDIA"],      ["Telecom","Power","Infra","FMCG"]),
    "Ahmedabad":   ("Gujarat",     23.022,72.571, 0.09, ["ADANIENT","ADANIPORTS","TORNTPOWER","AMBUJACEM","ZYDUSLIFE"],["Conglomerate","Cement","Agri"]),
    "Bangalore":   ("Karnataka",   12.971,77.594, 0.08, ["INFY","WIPRO","HCLTECH","TCS","TECHM"],               ["IT","SaaS","Startup","Tech"]),
    "Hyderabad":   ("Telangana",   17.385,78.486, 0.05, ["DRREDDY","SUNPHARMA","CIPLA","DIVISLAB","APOLLOHOSP"], ["Pharma","Biotech","IT"]),
    "Kolkata":     ("West Bengal", 22.572,88.363, 0.06, ["COALINDIA","SAIL","ITC","TATASTEEL","HINDALCO"],       ["Mining","Steel","ITC","FMCG"]),
    "Chennai":     ("Tamil Nadu",  13.082,80.270, 0.05, ["MARUTI","HEROMOTOCO","EICHERMOT","ASHOKLEY","TVSLTD"], ["Auto","FMCG","IT"]),
    "Pune":        ("Maharashtra", 18.520,73.856, 0.04, ["BAJFINANCE","BAJAJFINSV","BAJAJ-AUTO","FORCEMOT","EXIDEIND"],["NBFC","Auto","Finance"]),
    "Surat":       ("Gujarat",     21.170,72.831, 0.04, ["ADANIENT","VEDL","HINDALCO","JSWSTEEL","TATASTEEL"],   ["Metals","Textiles","Gems"]),
    "Jaipur":      ("Rajasthan",   26.912,75.787, 0.03, ["TITAN","ASIANPAINT","PIDILITIND","BERGEPAINT","JUBLFOOD"],["Consumer","Gems","Agri"]),
    "Kochi":       ("Kerala",      9.931, 76.267, 0.02, ["EIHOTEL","CHOLA","INFY","ITC","HDFCBANK"],             ["Spice","Rubber","IT","Tourism"]),
    "Indore":      ("M.P.",        22.719,75.857, 0.02, ["RUCHI","ITC","MARICO","GODREJCP","DABUR"],             ["Agri","Soybean","FMCG"]),
    "Chandigarh":  ("Punjab",      30.733,76.779, 0.01, ["BHARTIARTL","NESTLEIND","HDFCBANK","BRITANNIA","DABUR"],["FMCG","Banking","Agri"]),
    "Lucknow":     ("U.P.",        26.846,80.946, 0.01, ["BALRAMCHIN","DHAMPUR","EIDPARRY","ITC","HINDUNILVR"],  ["Sugar","FMCG","Banking"]),
    "Nagpur":      ("Maharashtra", 21.145,79.082, 0.01, ["JSWSTEEL","SAIL","VEDL","HINDALCO","TATASTEEL"],       ["Steel","Cotton","Agri"]),
    "Coimbatore":  ("Tamil Nadu",  11.016,76.955, 0.008,["VARDHMAN","ARVIND","KPR MILL","RAYMOND","WELSPUN"],    ["Textiles","Auto","IT"]),
    "Vizag":       ("A.P.",        17.686,83.218, 0.005,["JSWSTEEL","SAIL","RITES","CONCOR","SCI"],              ["Steel","Shipping","Port"]),
    "Bhopal":      ("M.P.",        23.259,77.412, 0.005,["NRLBI","ITC","HINDUNILVR","MARICO","GODREJCP"],        ["Agri","FMCG","Infra"]),
}

_city_stats = {}

def _init():
    for city, (state, lat, lon, w, stocks, sectors) in CITY_DATA.items():
        base = int(w * 9_000_000)
        _city_stats[city] = {
            "state":      state,
            "lat":        lat,
            "lon":        lon,
            "trades":     int(base * random.uniform(0.7, 1.3)),
            "volume_cr":  round(w * 60000 * random.uniform(0.8, 1.2), 1),
            "buy_trades": 0,
            "sell_trades":0,
            "buy_pct":    round(random.uniform(47, 55), 1),
            "top_stock":  stocks[0],
            "hot_stock":  stocks[random.randint(0,len(stocks)-1)],
            "low_stock":  stocks[-1],
            "hot_sector": sectors[0],
            "fii_pct":    round(random.uniform(8, 22), 1),
            "retail_pct": round(random.uniform(55, 72), 1),
            "top_stocks": stocks,
            "sectors":    sectors,
            "last_trade_ms": int(time.time()*1000),
        }

_init()

_prices = {}

def _load_prices():
    global _prices
    if _prices: return _prices
    for sym in NIFTY50[:12]:
        try:
            q = get_quote(sym, "NSE")
            if q.get("price", 0) > 0: _prices[sym] = q["price"]
        except: pass
    if not _prices:
        _prices = {s: random.uniform(400, 3500) for s in NIFTY50[:8]}
    return _prices

def _make_trade(prices: dict) -> dict:
    ttype = random.choices(list(TRADER_TYPES.keys()), weights=[v["weight"] for v in TRADER_TYPES.values()])[0]
    city  = random.choices(list(CITY_DATA.keys()), weights=[v[3] for v in CITY_DATA.values()])[0]
    cdata = CITY_DATA[city]
    avail = [s for s in cdata[4] if s in prices] or list(prices.keys())[:3]
    sym   = random.choice(avail)
    mult  = TRADER_TYPES[ttype]["size_mult"]
    side  = random.choices(["BUY","SELL"], weights=[0.52,0.48])[0]
    drift = random.uniform(-0.02, 0.02)/100
    prices[sym] = round(prices[sym]*(1+drift), 2)
    qty   = int(random.randint(1,50)*mult*random.uniform(0.5,2.0))
    price = round(prices[sym]*(1+random.uniform(-0.03,0.03)/100), 2)
    value = round(price*qty, 0)
    # Update city stats
    s = _city_stats[city]
    s["trades"] += 1
    s["last_trade_ms"] = int(time.time()*1000)
    s["volume_cr"] = round(s["volume_cr"] + value/1e7, 2)
    if side == "BUY":
        s["buy_trades"] = s.get("buy_trades",0)+1
    else:
        s["sell_trades"] = s.get("sell_trades",0)+1
    total = s.get("buy_trades",0)+s.get("sell_trades",0)
    if total > 0:
        s["buy_pct"] = round(s["buy_trades"]/total*100, 1)
    if random.random() < 0.04: s["hot_stock"]  = sym
    if random.random() < 0.02: s["hot_sector"] = random.choice(cdata[5])
    return {
        "ts": int(time.time()*1000), "symbol": sym, "city": city,
        "exchange": "NSE" if random.random()>0.12 else "BSE",
        "side": side, "type": ttype, "color": TRADER_TYPES[ttype]["color"],
        "qty": qty, "price": price, "value": value,
        "segment": random.choice(["EQ","FUT","OPT"]) if ttype in ("FII","PROP") and random.random()>0.75 else "EQ",
    }

@router.websocket("/ws")
async def trade_stream(ws: WebSocket):
    await ws.accept()
    prices = _load_prices()
    try:
        while True:
            n = random.randint(2,6)
            trades = [_make_trade(prices) for _ in range(n)]
            await ws.send_text(json.dumps({"type":"trades","data":trades}))
            await asyncio.sleep(random.uniform(0.5,1.0))
    except (WebSocketDisconnect, Exception): pass

@router.get("/city-stats")
async def city_stats():
    return _city_stats

@router.get("/summary")
async def trade_summary():
    from core.data_fetcher import is_market_open
    indices = get_all_indices()
    adv = sum(1 for i in indices if i.get("change_pct",0)>0)
    dec = sum(1 for i in indices if i.get("change_pct",0)<0)
    tot_vol    = sum(s.get("volume_cr",0)  for s in _city_stats.values())
    tot_trades = sum(s.get("trades",0)     for s in _city_stats.values())
    return {
        "market_open": is_market_open(),
        "advancing":   adv, "declining": dec,
        "total_volume_cr":  round(tot_vol, 1),
        "total_trades":     tot_trades,
        "segments": {
            "EQ":  {"volume_cr": random.randint(40000,60000), "trades": random.randint(8000000,12000000)},
            "FUT": {"volume_cr": random.randint(15000,25000), "trades": random.randint(500000,1000000)},
            "OPT": {"volume_cr": random.randint(8000,15000),  "trades": random.randint(2000000,4000000)},
        }
    }
