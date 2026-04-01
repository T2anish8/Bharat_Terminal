from fastapi import APIRouter, Query
from ml.predictor import predict_price
from ml.signals   import scan_all_signals

router = APIRouter()

@router.get("/predict/{symbol}")
async def predict(symbol: str, horizon: int = Query(10), exchange: str = Query("NSE")):
    return predict_price(symbol.upper(), horizon, exchange.upper())

@router.get("/scan")
async def scan():
    return scan_all_signals()
