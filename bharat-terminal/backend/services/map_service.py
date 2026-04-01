"""
BHARAT TERMINAL — India Trade Map Service
Returns exchange locations + stock trading volume data for India map visualization.
"""
from core.data_fetcher import EXCHANGE_CONFIG, get_bulk_quotes, NIFTY50

EXCHANGE_LOCATIONS = [
    {"id":"NSE",   "name":"National Stock Exchange",    "city":"Mumbai",     "state":"Maharashtra", "lat":19.0596,"lon":72.8656,"type":"equity","instruments":2000},
    {"id":"BSE",   "name":"Bombay Stock Exchange",       "city":"Mumbai",     "state":"Maharashtra", "lat":18.9268,"lon":72.8337,"type":"equity","instruments":5000},
    {"id":"MCX",   "name":"Multi Commodity Exchange",    "city":"Mumbai",     "state":"Maharashtra", "lat":19.0800,"lon":72.8777,"type":"commodity","instruments":50},
    {"id":"MSE",   "name":"Metropolitan Stock Exchange", "city":"Mumbai",     "state":"Maharashtra", "lat":19.1136,"lon":72.8697,"type":"equity","instruments":1000},
    {"id":"NCDEX", "name":"National Commodity & Derivatives","city":"Mumbai", "state":"Maharashtra", "lat":19.0760,"lon":72.8777,"type":"commodity","instruments":30},
    {"id":"NSE_IFSC","name":"NSE International (GIFT City)","city":"Gandhinagar","state":"Gujarat","lat":23.1500,"lon":72.6700,"type":"international","instruments":100},
    {"id":"ICEX",  "name":"Indian Commodity Exchange",  "city":"Gurugram",   "state":"Haryana",     "lat":28.4595,"lon":77.0266,"type":"commodity","instruments":20},
    {"id":"ACE",   "name":"Ace Derivatives Exchange",   "city":"Ahmedabad",  "state":"Gujarat",     "lat":23.0225,"lon":72.5714,"type":"commodity","instruments":15},
]

MAJOR_TRADING_CITIES = [
    {"city":"Mumbai",     "state":"Maharashtra", "lat":19.0760,"lon":72.8777,"exchanges":["NSE","BSE","MCX","MSE"],"traders":500000},
    {"city":"Delhi",      "state":"Delhi",       "lat":28.6139,"lon":77.2090,"exchanges":["NSE","BSE"],"traders":200000},
    {"city":"Ahmedabad",  "state":"Gujarat",     "lat":23.0225,"lon":72.5714,"exchanges":["NSE","BSE","ACE"],"traders":150000},
    {"city":"Kolkata",    "state":"West Bengal", "lat":22.5726,"lon":88.3639,"exchanges":["NSE","BSE"],"traders":100000},
    {"city":"Chennai",    "state":"Tamil Nadu",  "lat":13.0827,"lon":80.2707,"exchanges":["NSE","BSE"],"traders":80000},
    {"city":"Hyderabad",  "state":"Telangana",   "lat":17.3850,"lon":78.4867,"exchanges":["NSE","BSE"],"traders":90000},
    {"city":"Bangalore",  "state":"Karnataka",   "lat":12.9716,"lon":77.5946,"exchanges":["NSE","BSE"],"traders":120000},
    {"city":"Pune",       "state":"Maharashtra", "lat":18.5204,"lon":73.8567,"exchanges":["NSE","BSE"],"traders":70000},
    {"city":"Surat",      "state":"Gujarat",     "lat":21.1702,"lon":72.8311,"exchanges":["NSE","BSE"],"traders":60000},
    {"city":"Jaipur",     "state":"Rajasthan",   "lat":26.9124,"lon":75.7873,"exchanges":["NSE","BSE"],"traders":40000},
    {"city":"Lucknow",    "state":"Uttar Pradesh","lat":26.8467,"lon":80.9462,"exchanges":["NSE","BSE"],"traders":30000},
    {"city":"Chandigarh", "state":"Punjab",      "lat":30.7333,"lon":76.7794,"exchanges":["NSE","BSE"],"traders":25000},
    {"city":"Kochi",      "state":"Kerala",      "lat":9.9312,"lon":76.2673,"exchanges":["NSE","BSE"],"traders":35000},
    {"city":"Indore",     "state":"Madhya Pradesh","lat":22.7196,"lon":75.8577,"exchanges":["NSE","BSE"],"traders":28000},
]

def get_exchange_map_data() -> dict:
    return {
        "exchanges":     EXCHANGE_LOCATIONS,
        "trading_cities": MAJOR_TRADING_CITIES,
    }

def get_stock_map_data(symbol: str) -> dict:
    """For a given stock, return where it's most actively traded in India."""
    quotes = []
    for ex in ["NSE", "BSE"]:
        from core.data_fetcher import get_quote
        q = get_quote(symbol, ex)
        if q.get("price", 0) > 0:
            cfg = EXCHANGE_CONFIG.get(ex, {})
            quotes.append({
                "exchange":   ex,
                "full_name":  cfg.get("name", ex),
                "city":       cfg.get("city", "Mumbai"),
                "lat":        cfg.get("lat", 19.0596),
                "lon":        cfg.get("lon", 72.8656),
                "price":      q.get("price", 0),
                "volume":     q.get("volume", 0),
                "change_pct": q.get("change_pct", 0),
            })
    quotes.sort(key=lambda x: x.get("volume", 0), reverse=True)
    primary = quotes[0] if quotes else {}
    return {
        "symbol":            symbol,
        "exchanges":         quotes,
        "primary_exchange":  primary.get("exchange", "NSE"),
        "primary_city":      primary.get("city", "Mumbai"),
        "all_trading_cities": MAJOR_TRADING_CITIES,
    }
