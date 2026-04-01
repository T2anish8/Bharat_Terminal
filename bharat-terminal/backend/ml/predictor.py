"""
BHARAT TERMINAL — ML Price Predictor
Linear Regression + feature engineering for short-term price direction.
Designed to run without GPU; extensible to LSTM.
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score
from cachetools import TTLCache

from core.data_fetcher import get_historical
from core.indicators   import add_all

_cache = TTLCache(maxsize=100, ttl=3600)

FEATURE_COLS = [
    "EMA9","EMA21","EMA50","RSI","MACD","MACD_Sig","BB_pctB",
    "ATR","OBV","MFI","STOCH_K","ADX",
]


def predict_price(symbol: str, horizon: int = 10, exchange: str = "NSE") -> dict:
    key = f"pred_{exchange}_{symbol}_{horizon}"
    if key in _cache:
        return _cache[key]

    df = get_historical(symbol, "1y", "1d", exchange)
    if df.empty or len(df) < 100:
        return {"error": "Insufficient data", "symbol": symbol}

    df = add_all(df.copy())
    df["Target"] = df["Close"].shift(-horizon)
    df = df.dropna()

    available = [c for c in FEATURE_COLS if c in df.columns]
    X = df[available].values
    y = df["Target"].values

    split = int(len(X) * 0.8)
    scaler = StandardScaler()
    X_tr   = scaler.fit_transform(X[:split])
    X_te   = scaler.transform(X[split:])

    model = Ridge(alpha=1.0)
    model.fit(X_tr, y[:split])
    y_pred = model.predict(X_te)
    r2 = r2_score(y[split:], y_pred)

    current_price  = float(df["Close"].iloc[-1])
    last_features  = scaler.transform(X[[-1]])
    forecast_price = float(model.predict(last_features)[0])
    direction      = "UP" if forecast_price > current_price else "DOWN"
    confidence     = min(100, max(0, abs(r2) * 100))

    result = {
        "symbol":         symbol,
        "current_price":  round(current_price, 2),
        "forecast_price": round(forecast_price, 2),
        "forecast_change": round(forecast_price - current_price, 2),
        "forecast_pct":   round((forecast_price - current_price) / current_price * 100, 2),
        "direction":      direction,
        "horizon_days":   horizon,
        "confidence":     round(confidence, 1),
        "r2_score":       round(r2, 4),
        "model":          "Ridge Regression",
        "features_used":  available,
    }
    _cache[key] = result
    return result
