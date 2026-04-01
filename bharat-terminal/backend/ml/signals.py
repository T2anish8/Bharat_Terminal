"""
BHARAT TERMINAL — Signal Scanner
Scans all Nifty 50 stocks for buy/sell signals.
"""
import pandas as pd
from core.data_fetcher import get_historical, NIFTY50
from core.indicators   import add_all, generate_signal

def scan_all_signals() -> list[dict]:
    results = []
    for sym in NIFTY50:
        try:
            df = get_historical(sym, "3mo", "1d")
            if df.empty or len(df) < 50:
                continue
            sig = generate_signal(df)
            results.append({"symbol": sym, **sig})
        except:
            continue
    results.sort(key=lambda x: x.get("score", 0), reverse=True)
    return results

def get_signal(df):
    """Generate a buy/sell/neutral signal from a DataFrame with indicators."""
    try:
        import numpy as np
        last = df.iloc[-1]
        score = 0
        indicators = {}

        # RSI
        if "RSI" in df.columns:
            rsi = float(last["RSI"]) if not np.isnan(last["RSI"]) else 50
            indicators["RSI"] = round(rsi, 2)
            if rsi < 30: score += 2
            elif rsi < 45: score += 1
            elif rsi > 70: score -= 2
            elif rsi > 55: score -= 1

        # MACD
        if "MACD" in df.columns and "MACD_signal" in df.columns:
            macd = float(last.get("MACD", 0) or 0)
            sig  = float(last.get("MACD_signal", 0) or 0)
            indicators["MACD"] = round(macd, 2)
            if macd > sig: score += 1
            else: score -= 1

        # Price vs SMA50
        if "SMA50" in df.columns:
            sma50 = float(last.get("SMA50", 0) or 0)
            close = float(last.get("Close", 0) or 0)
            if sma50 > 0:
                indicators["SMA50"] = round(sma50, 2)
                if close > sma50: score += 1
                else: score -= 1

        # Price vs SMA200
        if "SMA200" in df.columns:
            sma200 = float(last.get("SMA200", 0) or 0)
            close  = float(last.get("Close", 0) or 0)
            if sma200 > 0:
                indicators["SMA200"] = round(sma200, 2)
                if close > sma200: score += 1
                else: score -= 1

        # Bollinger
        if "BB_upper" in df.columns and "BB_lower" in df.columns:
            upper = float(last.get("BB_upper", 0) or 0)
            lower = float(last.get("BB_lower", 0) or 0)
            close = float(last.get("Close", 0) or 0)
            if upper > 0:
                indicators["BB_upper"] = round(upper, 2)
                indicators["BB_lower"] = round(lower, 2)
                if close < lower: score += 1
                elif close > upper: score -= 1

        if score >= 3:   signal = "Strong Buy"
        elif score >= 1: signal = "Buy"
        elif score <= -3:signal = "Strong Sell"
        elif score <= -1:signal = "Sell"
        else:            signal = "Neutral"

        return {"signal": signal, "score": score, "indicators": indicators}
    except Exception as e:
        return {"signal": "Neutral", "score": 0, "indicators": {}}
