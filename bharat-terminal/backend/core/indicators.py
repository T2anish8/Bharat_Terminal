"""
BHARAT TERMINAL — Technical Indicators (Pure Pandas, no TA-Lib)
25+ indicators covering momentum, volatility, trend, volume.
"""
import pandas as pd
import numpy as np
from typing import Optional


def sma(s: pd.Series, p: int) -> pd.Series:
    return s.rolling(p).mean().round(2)

def ema(s: pd.Series, p: int) -> pd.Series:
    return s.ewm(span=p, adjust=False).mean().round(2)

def add_moving_averages(df: pd.DataFrame) -> pd.DataFrame:
    for p in [9, 21, 50, 100, 200]:
        df[f"SMA{p}"] = sma(df["Close"], p)
        df[f"EMA{p}"] = ema(df["Close"], p)
    return df

def add_vwap(df: pd.DataFrame) -> pd.DataFrame:
    tp = (df["High"] + df["Low"] + df["Close"]) / 3
    df["VWAP"] = (tp * df["Volume"]).cumsum() / df["Volume"].cumsum()
    return df.round(2)

def add_rsi(df: pd.DataFrame, p: int = 14) -> pd.DataFrame:
    d  = df["Close"].diff()
    up = d.clip(lower=0).ewm(com=p-1, adjust=False).mean()
    dn = (-d).clip(lower=0).ewm(com=p-1, adjust=False).mean()
    df["RSI"] = (100 - 100 / (1 + up / dn)).round(2)
    return df

def add_macd(df: pd.DataFrame, fast=12, slow=26, sig=9) -> pd.DataFrame:
    ef = ema(df["Close"], fast)
    es = ema(df["Close"], slow)
    df["MACD"]      = (ef - es).round(3)
    df["MACD_Sig"]  = ema(df["MACD"], sig).round(3)
    df["MACD_Hist"] = (df["MACD"] - df["MACD_Sig"]).round(3)
    return df

def add_bollinger(df: pd.DataFrame, p=20, std=2.0) -> pd.DataFrame:
    df["BB_Mid"]   = sma(df["Close"], p)
    rs = df["Close"].rolling(p).std()
    df["BB_Upper"] = (df["BB_Mid"] + std * rs).round(2)
    df["BB_Lower"] = (df["BB_Mid"] - std * rs).round(2)
    df["BB_Width"] = ((df["BB_Upper"] - df["BB_Lower"]) / df["BB_Mid"] * 100).round(2)
    df["BB_pctB"]  = ((df["Close"] - df["BB_Lower"]) / (df["BB_Upper"] - df["BB_Lower"])).round(4)
    return df

def add_atr(df: pd.DataFrame, p=14) -> pd.DataFrame:
    tr = pd.concat([
        df["High"] - df["Low"],
        (df["High"] - df["Close"].shift()).abs(),
        (df["Low"]  - df["Close"].shift()).abs(),
    ], axis=1).max(axis=1)
    df["ATR"] = tr.ewm(com=p-1, adjust=False).mean().round(2)
    return df

def add_stoch(df: pd.DataFrame, k=14, d=3) -> pd.DataFrame:
    lo = df["Low"].rolling(k).min()
    hi = df["High"].rolling(k).max()
    df["STOCH_K"] = (100 * (df["Close"] - lo) / (hi - lo)).round(2)
    df["STOCH_D"] = df["STOCH_K"].rolling(d).mean().round(2)
    return df

def add_adx(df: pd.DataFrame, p=14) -> pd.DataFrame:
    df = add_atr(df.copy(), p)
    dh = df["High"].diff()
    dl = df["Low"].diff()
    pdm = dh.where((dh > 0) & (dh > -dl), 0.0)
    ndm = (-dl).where((-dl > 0) & (-dl > dh), 0.0)
    pdi = (100 * pdm.ewm(com=p-1, adjust=False).mean() / df["ATR"]).round(2)
    ndi = (100 * ndm.ewm(com=p-1, adjust=False).mean() / df["ATR"]).round(2)
    dx  = (100 * (pdi - ndi).abs() / (pdi + ndi).replace(0, 1e-9))
    df["ADX"]  = dx.ewm(com=p-1, adjust=False).mean().round(2)
    df["+DI"]  = pdi
    df["-DI"]  = ndi
    return df

def add_cci(df: pd.DataFrame, p=20) -> pd.DataFrame:
    tp = (df["High"] + df["Low"] + df["Close"]) / 3
    ma = tp.rolling(p).mean()
    md = tp.rolling(p).apply(lambda x: np.abs(x - x.mean()).mean())
    df["CCI"] = ((tp - ma) / (0.015 * md)).round(2)
    return df

def add_williams_r(df: pd.DataFrame, p=14) -> pd.DataFrame:
    hi = df["High"].rolling(p).max()
    lo = df["Low"].rolling(p).min()
    df["WR"] = (-100 * (hi - df["Close"]) / (hi - lo)).round(2)
    return df

def add_obv(df: pd.DataFrame) -> pd.DataFrame:
    dir_ = np.sign(df["Close"].diff()).fillna(0)
    df["OBV"] = (dir_ * df["Volume"]).cumsum().astype(int)
    return df

def add_mfi(df: pd.DataFrame, p=14) -> pd.DataFrame:
    tp  = (df["High"] + df["Low"] + df["Close"]) / 3
    rmf = tp * df["Volume"]
    pos = rmf.where(tp > tp.shift(1), 0)
    neg = rmf.where(tp < tp.shift(1), 0)
    mfr = pos.rolling(p).sum() / neg.rolling(p).sum().replace(0, 1e-9)
    df["MFI"] = (100 - 100 / (1 + mfr)).round(2)
    return df

def add_supertrend(df: pd.DataFrame, p=10, mult=3.0) -> pd.DataFrame:
    df = add_atr(df.copy(), p)
    hl2 = (df["High"] + df["Low"]) / 2
    ub  = hl2 + mult * df["ATR"]
    lb  = hl2 - mult * df["ATR"]
    st  = pd.Series(np.nan, index=df.index)
    dir_ = pd.Series(1, index=df.index)
    for i in range(1, len(df)):
        ub.iloc[i] = min(ub.iloc[i], ub.iloc[i-1]) if df["Close"].iloc[i-1] > ub.iloc[i-1] else ub.iloc[i]
        lb.iloc[i] = max(lb.iloc[i], lb.iloc[i-1]) if df["Close"].iloc[i-1] < lb.iloc[i-1] else lb.iloc[i]
        if df["Close"].iloc[i] > ub.iloc[i-1]:
            dir_.iloc[i] = 1
        elif df["Close"].iloc[i] < lb.iloc[i-1]:
            dir_.iloc[i] = -1
        else:
            dir_.iloc[i] = dir_.iloc[i-1]
        st.iloc[i] = lb.iloc[i] if dir_.iloc[i] == 1 else ub.iloc[i]
    df["Supertrend"]     = st.round(2)
    df["ST_Direction"]   = dir_
    return df

def add_ichimoku(df: pd.DataFrame) -> pd.DataFrame:
    h9  = df["High"].rolling(9).max()
    l9  = df["Low"].rolling(9).min()
    h26 = df["High"].rolling(26).max()
    l26 = df["Low"].rolling(26).min()
    h52 = df["High"].rolling(52).max()
    l52 = df["Low"].rolling(52).min()
    df["Ichi_Tenkan"]  = ((h9  + l9)  / 2).round(2)
    df["Ichi_Kijun"]   = ((h26 + l26) / 2).round(2)
    df["Ichi_SenkouA"] = (((df["Ichi_Tenkan"] + df["Ichi_Kijun"]) / 2).shift(26)).round(2)
    df["Ichi_SenkouB"] = (((h52 + l52) / 2).shift(26)).round(2)
    df["Ichi_Chikou"]  = df["Close"].shift(-26)
    return df

def add_all(df: pd.DataFrame) -> pd.DataFrame:
    if len(df) < 50:
        return df
    df = add_moving_averages(df)
    df = add_rsi(df)
    df = add_macd(df)
    df = add_bollinger(df)
    df = add_atr(df)
    df = add_stoch(df)
    df = add_adx(df)
    df = add_obv(df)
    df = add_mfi(df)
    df = add_vwap(df)
    return df


def get_pivot_points(df: pd.DataFrame) -> dict:
    H, L, C = float(df["High"].iloc[-1]), float(df["Low"].iloc[-1]), float(df["Close"].iloc[-1])
    P  = (H + L + C) / 3
    return {
        "PP": round(P, 2),
        "R1": round(2*P - L, 2), "R2": round(P + H - L, 2), "R3": round(H + 2*(P-L), 2),
        "S1": round(2*P - H, 2), "S2": round(P - H + L, 2), "S3": round(L - 2*(H-P), 2),
    }


def generate_signal(df: pd.DataFrame) -> dict:
    """Multi-indicator confluence signal."""
    df = add_all(df.copy())
    last = df.dropna(subset=["RSI","MACD","EMA21","EMA50"]).iloc[-1]
    score = 0
    reasons = []

    rsi = last.get("RSI", 50)
    if rsi < 30:   score += 2; reasons.append("RSI Oversold")
    elif rsi > 70: score -= 2; reasons.append("RSI Overbought")

    if last.get("MACD",0) > last.get("MACD_Sig",0):
        score += 1; reasons.append("MACD Bullish")
    else:
        score -= 1; reasons.append("MACD Bearish")

    if last.get("EMA21",0) > last.get("EMA50",0):
        score += 1; reasons.append("EMA Cross Bullish")
    else:
        score -= 1; reasons.append("EMA Cross Bearish")

    if last.get("Close",0) > last.get("SMA200",0):
        score += 1; reasons.append("Above SMA200")
    else:
        score -= 1; reasons.append("Below SMA200")

    bb_pctb = last.get("BB_pctB", 0.5)
    if bb_pctb < 0.2:  score += 1; reasons.append("Near BB Lower")
    elif bb_pctb > 0.8: score -= 1; reasons.append("Near BB Upper")

    st_dir = last.get("ST_Direction", 0)
    if st_dir == 1:   score += 1; reasons.append("Supertrend Bullish")
    elif st_dir == -1: score -= 1; reasons.append("Supertrend Bearish")

    label = ("Strong Buy" if score >= 4 else "Buy" if score >= 2
             else "Strong Sell" if score <= -4 else "Sell" if score <= -2 else "Neutral")

    return {
        "signal":  label,
        "score":   score,
        "reasons": reasons,
        "rsi":     round(rsi, 1),
        "macd":    round(float(last.get("MACD",0)), 3),
        "adx":     round(float(last.get("ADX",0)), 1),
        "atr":     round(float(last.get("ATR",0)), 2),
    }

# Alias for compatibility
compute_indicators = add_all

