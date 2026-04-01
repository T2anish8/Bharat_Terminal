from fastapi import APIRouter, Query
from services.news_service import get_market_news
from ml.sentiment import fetch_global_news, market_sentiment_score

router = APIRouter()

@router.get("")
async def news(symbol: str = Query(""), limit: int = Query(50),
               region: str = Query("")):   # region: "India" | "Global" | ""
    data = get_market_news(symbol, limit)
    articles = data.get("articles", [])
    if region:
        articles = [a for a in articles if a.get("region","").lower() == region.lower()]
    summary = market_sentiment_score(articles)
    return {"articles": articles, "summary": summary}

@router.get("/global")
async def global_news(limit: int = Query(30)):
    articles = fetch_global_news(limit)
    return {"articles": articles, "summary": market_sentiment_score(articles)}

@router.get("/sentiment")
async def sentiment_summary(symbol: str = Query("")):
    data = get_market_news(symbol, 20)
    return data.get("summary", {})
