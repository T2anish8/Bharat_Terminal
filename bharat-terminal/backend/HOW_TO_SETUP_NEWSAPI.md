# Setting Up NewsAPI for Live News

## Get a FREE API key (500 requests/day):
1. Go to https://newsapi.org/register
2. Sign up for free
3. Copy your API key

## Add it to the backend:

**Option 1 — Environment variable (recommended):**
```
set NEWSAPI_KEY=your_key_here
python run.py
```

**Option 2 — Edit the file directly:**
Open: backend/ml/sentiment.py
Find:  NEWSAPI_KEY = os.environ.get("NEWSAPI_KEY", "")
Change to: NEWSAPI_KEY = "your_actual_key_here"

## Without NewsAPI:
The terminal still works — it falls back to RSS feeds from:
- Economic Times, Moneycontrol, Business Standard, LiveMint, CNBCTV18
