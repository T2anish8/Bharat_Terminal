import { useEffect, useState } from 'react'
import axios from 'axios'

export default function TickerBar() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const { data } = await axios.get('/api/market/indices', { timeout: 10000 })
        if (Array.isArray(data) && data.length > 0) setItems(data)
      } catch {}
    }
    fetchTicker()
    const id = setInterval(fetchTicker, 30000)
    return () => clearInterval(id)
  }, [])

  const displayItems = [...items, ...items] // duplicate for seamless loop

  return (
    <div className="ticker-bar">
      {items.length === 0 ? (
        <div style={{ padding:'0 12px', fontSize:10, color:'var(--text-3)' }}>
          Starting market data feed…
        </div>
      ) : (
        <div className="ticker-track">
          {displayItems.map((item, i) => (
            <span key={i} className="ticker-item">
              <span style={{ color:'var(--text-3)', fontSize:9 }}>{item.name?.replace('NIFTY ','')}</span>
              <span style={{ color:'var(--text-0)', fontWeight:500 }}>
                {item.price > 0 ? item.price.toLocaleString('en-IN', {maximumFractionDigits:0}) : '—'}
              </span>
              <span style={{ color: item.change_pct >= 0 ? 'var(--green)':'var(--red)', fontSize:10 }}>
                {item.change_pct >= 0 ? '▲':'▼'}{Math.abs(item.change_pct||0).toFixed(2)}%
              </span>
              <span style={{ color:'var(--border)', fontSize:14, marginLeft:8 }}>│</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
