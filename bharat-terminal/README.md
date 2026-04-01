# 🇮🇳 BHARAT TERMINAL

India's most powerful open-source financial terminal — Bloomberg-style, built for NSE, BSE, MCX & MSE.

## 🚀 Quick Start

### 1. Backend (Python)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API runs at: http://localhost:8000
Docs at: http://localhost:8000/docs

### 2. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
UI runs at: http://localhost:5173

## 🔌 Exchanges Covered
- **NSE** — National Stock Exchange (Mumbai)
- **BSE** — Bombay Stock Exchange (Mumbai)
- **MCX** — Multi Commodity Exchange (Mumbai)
- **MSE** — Metropolitan Stock Exchange (Mumbai)
- **NCDEX** — National Commodity & Derivatives Exchange
- **NSE IFSC** — NSE International, GIFT City (Gujarat)

## 📊 Features
- Real-time WebSocket price streaming
- Candlestick charts (lightweight-charts)
- Interactive India map with exchange locations + trading cities
- ML price prediction (Ridge Regression on 12+ technical features)
- News sentiment (TextBlob + VADER)
- Signal scanner (25+ indicator confluence)
- Full options chain with OI analysis
- NSE + BSE + MCX data via yfinance (FREE, no API key)
- Search across stocks, indices, commodities

## 🛠️ Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Zustand, lightweight-charts, React-Leaflet |
| Backend  | FastAPI, Python 3.11+, WebSockets |
| Data     | yfinance, nsepython, feedparser (RSS) |
| ML/AI    | scikit-learn, TextBlob, VADER |
| Charts   | TradingView lightweight-charts |
| Map      | Leaflet.js + OpenStreetMap |

## ⚠️ Disclaimer
Educational / research project. Not financial advice.
