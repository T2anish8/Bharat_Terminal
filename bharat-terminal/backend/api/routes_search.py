from fastapi import APIRouter, Query
from core.data_fetcher import search_symbols, ALL_STOCKS, INDICES, COMMODITIES, CURRENCIES

router = APIRouter()

@router.get("")
async def search(q: str = Query("")):
    if not q.strip(): return []
    return search_symbols(q.strip())

@router.get("/all")
async def all_symbols():
    stocks     = [{"symbol":s,"type":"EQUITY","exchange":"NSE"} for s in ALL_STOCKS]
    idxs       = [{"symbol":v,"name":k,"type":"INDEX","exchange":"NSE"} for k,v in INDICES.items()]
    comms      = [{"symbol":info["sym"],"name":k,"type":"COMMODITY","exchange":info["exchange"],"sector":info["sector"]} for k,info in COMMODITIES.items()]
    currencies = [{"symbol":v,"name":k,"type":"CURRENCY","exchange":"NSE"} for k,v in CURRENCIES.items()]
    return {"stocks":stocks,"indices":idxs,"commodities":comms,"currencies":currencies,
            "total":len(stocks)+len(idxs)+len(comms)+len(currencies)}
