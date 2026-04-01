"""
WebSocket Manager — Stable version
- Health-check ping every 20s to prevent false offline detection
- Graceful error handling, dead connection cleanup
- Only pushes quotes when data is actually available
"""
import asyncio, json, logging
from collections import defaultdict
from datetime import datetime
import pytz
from fastapi import WebSocket
from core.data_fetcher import get_quote, NIFTY50

log = logging.getLogger(__name__)
IST = pytz.timezone("Asia/Kolkata")
DEFAULT_SYMBOLS = NIFTY50[:20]

class WSManager:
    def __init__(self):
        self.connections: list[WebSocket] = []
        self.subscriptions: dict = defaultdict(set)

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.append(ws)
        # Send immediate ping so frontend knows connection is alive
        try:
            await ws.send_text(json.dumps({"type": "connected", "ts": datetime.now(IST).isoformat()}))
        except: pass

    def disconnect(self, ws: WebSocket):
        if ws in self.connections:
            self.connections.remove(ws)
        self.subscriptions.pop(id(ws), None)

    def subscribe(self, ws: WebSocket, symbols: list):
        self.subscriptions[id(ws)].update(s.upper() for s in symbols)

    async def _send_safe(self, ws: WebSocket, msg: str) -> bool:
        try:
            await asyncio.wait_for(ws.send_text(msg), timeout=5.0)
            return True
        except:
            return False

    async def broadcast_loop(self):
        cursor = 0
        ping_counter = 0
        while True:
            try:
                await asyncio.sleep(4)
                if not self.connections:
                    continue

                ping_counter += 1

                # Ping every ~20s to keep connection alive and show backend is online
                if ping_counter % 5 == 0:
                    ping_msg = json.dumps({"type": "ping", "ts": datetime.now(IST).isoformat()})
                    dead = []
                    for ws in list(self.connections):
                        ok = await self._send_safe(ws, ping_msg)
                        if not ok: dead.append(ws)
                    for ws in dead: self.disconnect(ws)
                    continue

                # Push 3 quotes per cycle to stay fast
                batch = DEFAULT_SYMBOLS[cursor:cursor+3]
                cursor = (cursor + 3) % len(DEFAULT_SYMBOLS)

                for sym in batch:
                    try:
                        q = get_quote(sym, "NSE")
                        if not q.get("price", 0): continue
                        msg = json.dumps({"type": "quote", "data": q})
                        dead = []
                        for ws in list(self.connections):
                            ok = await self._send_safe(ws, msg)
                            if not ok: dead.append(ws)
                        for ws in dead: self.disconnect(ws)
                    except: continue

            except Exception as e:
                log.error(f"WS loop error: {e}")
                await asyncio.sleep(5)
