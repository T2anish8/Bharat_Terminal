"""
Bharat Terminal — Global News & Sentiment Engine
NewsAPI (if key set) + 15 RSS feeds from India + World
"""
import os, feedparser, logging, requests
from datetime import datetime
from cachetools import TTLCache

log = logging.getLogger(__name__)
_cache = TTLCache(maxsize=500, ttl=180)  # 3 min cache

NEWSAPI_KEY = os.environ.get("NEWSAPI_KEY", "b9595a5484f5458a92f014668685c662")

# ── RSS Feeds — India + Global Finance ─────────────────────────────
RSS_FEEDS = {
    # India
    "Economic Times":    "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    "Moneycontrol":      "https://www.moneycontrol.com/rss/marketreports.xml",
    "Business Standard": "https://www.business-standard.com/rss/markets-106.rss",
    "LiveMint":          "https://www.livemint.com/rss/markets",
    "CNBCTV18":          "https://www.cnbctv18.com/commonfeeds/v1/cne/rss/market.xml",
    "Financial Express": "https://www.financialexpress.com/market/feed/",
    "Hindu Business":    "https://www.thehindubusinessline.com/markets/feeder/default.rss",
    "Zee Business":      "https://www.zeebiz.com/rss/market.xml",
    # Global
    "Reuters":           "https://feeds.reuters.com/reuters/businessNews",
    "Bloomberg":         "https://feeds.bloomberg.com/markets/news.rss",
    "CNBC World":        "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",
    "FT Markets":        "https://www.ft.com/rss/home/uk",
    "WSJ Markets":       "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
    "Investing.com":     "https://www.investing.com/rss/news.rss",
    "Yahoo Finance":     "https://finance.yahoo.com/news/rssindex",
}

INDIA_SOURCES  = {"Economic Times","Moneycontrol","Business Standard","LiveMint","CNBCTV18","Financial Express","Hindu Business","Zee Business"}
GLOBAL_SOURCES = {"Reuters","Bloomberg","CNBC World","FT Markets","WSJ Markets","Investing.com","Yahoo Finance"}

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    _vader = SentimentIntensityAnalyzer()
    HAS_VADER = True
except: HAS_VADER = False

try:
    from textblob import TextBlob
    HAS_TB = True
except: HAS_TB = False

def analyze_text(text: str) -> dict:
    score = 0.0; n = 0
    if HAS_VADER:
        score += _vader.polarity_scores(text)["compound"]; n += 1
    if HAS_TB:
        score += TextBlob(text).sentiment.polarity; n += 1
    if n > 1: score /= n
    sentiment = "Positive" if score > 0.05 else "Negative" if score < -0.05 else "Neutral"
    return {"sentiment": sentiment, "score": round(score, 4)}

def _newsapi_fetch(query: str, limit: int = 30, language: str = "en") -> list:
    if not NEWSAPI_KEY: return []
    try:
        r = requests.get("https://newsapi.org/v2/everything", params={
            "q": query, "language": language, "sortBy": "publishedAt",
            "pageSize": min(limit, 30), "apiKey": NEWSAPI_KEY,
        }, timeout=8)
        if r.status_code != 200: return []
        out = []
        for a in r.json().get("articles", []):
            title = (a.get("title") or "").strip()
            if not title or title == "[Removed]": continue
            sent = analyze_text(title + " " + (a.get("description") or ""))
            try: pub = datetime.strptime(a["publishedAt"][:19], "%Y-%m-%dT%H:%M:%S").strftime("%d %b %Y %H:%M")
            except: pub = ""
            out.append({
                "title": title, "source": a.get("source",{}).get("name","NewsAPI"),
                "url": a.get("url","#"), "published": pub,
                "image": a.get("urlToImage",""), "region": "Global",
                **sent,
            })
        return out
    except Exception as e:
        log.warning(f"NewsAPI: {e}"); return []

def _rss_fetch(symbol: str = "", sources: set = None, limit: int = 40) -> list:
    articles = []
    feeds = {k:v for k,v in RSS_FEEDS.items() if sources is None or k in sources}
    for source, url in feeds.items():
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:10]:
                title = entry.get("title","").strip()
                if not title: continue
                if symbol and symbol.upper() not in title.upper(): continue
                sent = analyze_text(title)
                try: pub = datetime(*entry.published_parsed[:6]).strftime("%d %b %Y %H:%M")
                except: pub = ""
                articles.append({
                    "title": title, "source": source,
                    "url": entry.get("link","#"), "published": pub,
                    "image": "", "region": "India" if source in INDIA_SOURCES else "Global",
                    **sent,
                })
        except: continue
    articles.sort(key=lambda x: x.get("published",""), reverse=True)
    return articles[:limit]

def fetch_news(symbol: str = "", limit: int = 40) -> list:
    key = f"news_{symbol}_{limit}"
    if key in _cache: return _cache[key]

    articles = []
    seen_urls = set()

    def add(a_list):
        for a in a_list:
            u = a.get("url","")
            if u and u not in seen_urls:
                seen_urls.add(u); articles.append(a)

    if NEWSAPI_KEY:
        q = f"{symbol} NSE BSE India market" if symbol else "India NSE BSE Nifty Sensex stock market"
        add(_newsapi_fetch(q, 20))
        if not symbol:
            add(_newsapi_fetch("global stock market finance economy", 10))

    # Always add RSS
    add(_rss_fetch(symbol, limit=limit))

    articles.sort(key=lambda x: x.get("published",""), reverse=True)
    result = articles[:limit]
    _cache[key] = result
    return result

def fetch_global_news(limit: int = 30) -> list:
    key = f"global_news_{limit}"
    if key in _cache: return _cache[key]
    articles = []
    seen = set()
    if NEWSAPI_KEY:
        for q in ["global stock market","US Federal Reserve economy","crude oil gold market","China economy trade"]:
            for a in _newsapi_fetch(q, 8):
                if a["url"] not in seen: seen.add(a["url"]); articles.append(a)
    rss = _rss_fetch(sources=GLOBAL_SOURCES, limit=limit)
    for a in rss:
        if a["url"] not in seen: seen.add(a["url"]); articles.append(a)
    articles.sort(key=lambda x: x.get("published",""), reverse=True)
    result = articles[:limit]
    _cache[key] = result
    return result

def market_sentiment_score(articles: list) -> dict:
    if not articles: return {"score":0,"label":"Neutral","breakdown":{}}
    scores = [a.get("score",0) for a in articles]
    avg  = sum(scores)/len(scores)
    pos  = sum(1 for s in scores if s > 0.05)
    neg  = sum(1 for s in scores if s < -0.05)
    neut = len(scores)-pos-neg
    label = "Bullish" if avg > 0.1 else "Bearish" if avg < -0.1 else "Neutral"
    return {"score":round(avg,4),"label":label,
            "breakdown":{"positive":pos,"negative":neg,"neutral":neut,"total":len(scores)}}
