"""BHARAT TERMINAL v2 — FastAPI Backend"""
import warnings; warnings.filterwarnings("ignore")
import os; os.environ["PYTHONWARNINGS"] = "ignore"
import asyncio, json, logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger("bharat")

from api.routes_market import router as market_router
from api.routes_stock  import router as stock_router
from api.routes_search import router as search_router
from api.routes_news   import router as news_router
from api.routes_ml     import router as ml_router
from api.routes_map    import router as map_router
from api.routes_trades import router as trades_router
from websocket.ws_manager import WSManager

ws_manager = WSManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Bharat Terminal API v2 started!")
    asyncio.create_task(ws_manager.broadcast_loop())
    yield

app = FastAPI(title="Bharat Terminal API", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"],
                   allow_headers=["*"], allow_credentials=True)

app.include_router(market_router, prefix="/api/market", tags=["Market"])
app.include_router(stock_router,  prefix="/api/stock",  tags=["Stock"])
app.include_router(search_router, prefix="/api/search", tags=["Search"])
app.include_router(news_router,   prefix="/api/news",   tags=["News"])
app.include_router(ml_router,     prefix="/api/ml",     tags=["ML"])
app.include_router(map_router,    prefix="/api/map",    tags=["Map"])
app.include_router(trades_router, prefix="/api/trades", tags=["Trades"])

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket, symbols: str = Query("")):
    await ws_manager.connect(websocket)
    if symbols:
        ws_manager.subscribe(websocket, [s.strip().upper() for s in symbols.split(",") if s.strip()])
    try:
        while True:
            msg = await websocket.receive_text()
            try:
                d = json.loads(msg)
                if d.get("action") == "subscribe":
                    ws_manager.subscribe(websocket, d.get("symbols", []))
            except: pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

@app.get("/")
async def root():
    import sys
    return {"app": "Bharat Terminal v2", "status": "running"}

@app.get("/health")
async def health():
    from core.data_fetcher import is_market_open
    return {"status": "ok", "market_open": is_market_open()}
