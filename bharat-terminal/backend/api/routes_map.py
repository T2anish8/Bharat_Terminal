from fastapi import APIRouter, Path
from services.map_service import get_exchange_map_data, get_stock_map_data

router = APIRouter()

@router.get("/exchanges")
async def exchanges():
    return get_exchange_map_data()

@router.get("/stock/{symbol}")
async def stock_map(symbol: str = Path(...)):
    return get_stock_map_data(symbol.upper())
