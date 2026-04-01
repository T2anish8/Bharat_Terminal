from ml.sentiment import fetch_news, market_sentiment_score

def get_market_news(symbol: str = "", limit: int = 30) -> dict:
    articles = fetch_news(symbol, limit)
    summary  = market_sentiment_score(articles)
    return {"articles": articles, "summary": summary}
