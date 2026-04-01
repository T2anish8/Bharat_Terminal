import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const MAX_TRADES = 120

const TYPE_COLORS = {
  FII:  { color:'#FF6B2B', label:'FII',  desc:'Foreign Institutional' },
  DII:  { color:'#2979FF', label:'DII',  desc:'Domestic Institutional' },
  PROP: { color:'#FFB800', label:'PROP', desc:'Proprietary' },
  HNI:  { color:'#9C6FFF', label:'HNI',  desc:'High Net-worth' },
  RET:  { color:'#00E5A0', label:'RET',  desc:'Retail' },
}

const fmtVal = (v) => {
  if (v >= 1e7) return `₹${(v/1e7).toFixed(2)}Cr`
  if (v >= 1e5) return `₹${(v/1e5).toFixed(1)}L`
  return `₹${v.toLocaleString('en-IN')}`
}

export default function LiveTradeTracker() {
  const [trades,   setTrades]  = useState([])
  const [paused,   setPaused]  = useState(false)
  const [summary,  setSummary] = useState(null)
  const [filter,   setFilter]  = useState('ALL')
  const [stats,    setStats]   = useState({ buy:0, sell:0, volume:0, count:0 })
  const wsRef     = useRef(null)
  const pausedRef = useRef(false)
  const listRef   = useRef(null)

  useEffect(() => {
    axios.get('/api/trades/summary', { timeout:8000 })
      .then(r => setSummary(r.data)).catch(()=>{})
  }, [])

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    const connect = () => {
      const host = window.location.host
      const ws = new WebSocket(`ws://${host}/api/trades/ws`)
      wsRef.current = ws

      ws.onmessage = (e) => {
        if (pausedRef.current) return
        try {
          const msg = JSON.parse(e.data)
          if (msg.type !== 'trades') return
          const newTrades = msg.data || []
          setTrades(prev => {
            const next = [...newTrades, ...prev].slice(0, MAX_TRADES)
            return next
          })
          setStats(prev => {
            let buy = prev.buy, sell = prev.sell, vol = prev.volume, cnt = prev.count
            for (const t of newTrades) {
              if (t.side === 'BUY') buy++; else sell++
              vol += t.value || 0; cnt++
            }
            return { buy, sell, volume: vol, count: cnt }
          })
        } catch {}
      }
      ws.onclose = () => setTimeout(connect, 3000)
    }
    connect()
    return () => wsRef.current?.close()
  }, [])

  // Auto-scroll to top
  useEffect(() => {
    if (!paused && listRef.current) {
      listRef.current.scrollTop = 0
    }
  }, [trades])

  const shown = filter === 'ALL' ? trades
    : filter === 'BUY' || filter === 'SELL' ? trades.filter(t => t.side === filter)
    : trades.filter(t => t.type === filter)

  const buyPct = stats.count > 0 ? (stats.buy / stats.count * 100) : 50

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg-2)' }}>
      {/* Header */}
      <div className="panel-header">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span className="panel-title">Live Trade Flow</span>
          <span style={{
            width:6, height:6, borderRadius:'50%', display:'inline-block',
            background: paused ? 'var(--text-3)' : '#FF3B5C',
            boxShadow: paused ? 'none' : '0 0 8px #FF3B5C',
            animation: paused ? 'none' : 'pulse 1s infinite',
          }}/>
          <span style={{ fontSize:9, color:'var(--text-3)' }}>NSE · BSE · MCX</span>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          <button className={`btn ${paused?'active':''}`} onClick={() => setPaused(p=>!p)} style={{
            background: paused ? 'rgba(255,184,0,0.2)' : 'var(--bg-4)',
            color: paused ? 'var(--yellow)' : 'var(--text-3)',
            borderColor: paused ? 'var(--yellow)' : 'var(--border)',
          }}>
            {paused ? '▶ RESUME' : '⏸ PAUSE'}
          </button>
          <button className="btn" onClick={() => { setTrades([]); setStats({buy:0,sell:0,volume:0,count:0}) }}>
            CLEAR
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        display:'flex', gap:0, borderBottom:'1px solid var(--border)',
        background:'var(--bg-3)', flexShrink:0,
      }}>
        {[
          { label:'TRADES', val: stats.count.toLocaleString('en-IN'), color:'var(--text-0)' },
          { label:'VOLUME', val: fmtVal(stats.volume), color:'var(--orange)' },
          { label:'BUYS',   val: stats.buy.toLocaleString('en-IN'),  color:'var(--green)' },
          { label:'SELLS',  val: stats.sell.toLocaleString('en-IN'), color:'var(--red)' },
        ].map(({label,val,color}) => (
          <div key={label} style={{ flex:1, padding:'5px 8px', borderRight:'1px solid var(--border)', textAlign:'center' }}>
            <div style={{ fontSize:11, fontWeight:700, color, fontFamily:'var(--font-mono)' }}>{val}</div>
            <div style={{ fontSize:8, color:'var(--text-3)', marginTop:1, letterSpacing:'0.08em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Buy/Sell bar */}
      <div style={{ height:4, background:'var(--bg-4)', flexShrink:0 }}>
        <div style={{
          height:'100%', width:`${buyPct}%`,
          background:'linear-gradient(90deg, var(--green), rgba(0,229,160,0.5))',
          transition:'width 0.3s ease',
        }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', padding:'2px 10px', background:'var(--bg-3)', flexShrink:0 }}>
        <span style={{ fontSize:8, color:'var(--green)' }}>▲ BUY {buyPct.toFixed(1)}%</span>
        <span style={{ fontSize:8, color:'var(--red)' }}>SELL {(100-buyPct).toFixed(1)}% ▼</span>
      </div>

      {/* Trader type filter */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--bg-3)', flexShrink:0, overflowX:'auto' }}>
        {['ALL','BUY','SELL','FII','DII','PROP','HNI','RET'].map(f => {
          const tc = TYPE_COLORS[f]
          return (
            <div key={f} onClick={() => setFilter(f)} style={{
              padding:'4px 10px', fontSize:8, cursor:'pointer', fontWeight:700,
              flexShrink:0, letterSpacing:'0.05em', whiteSpace:'nowrap',
              color: filter===f ? (tc?.color || 'var(--orange)') : 'var(--text-3)',
              borderBottom: filter===f ? `2px solid ${tc?.color||'var(--orange)'}` : '2px solid transparent',
              background: filter===f ? `${tc?.color||'#FF6B2B'}10` : 'transparent',
            }}>{f}</div>
          )
        })}
      </div>

      {/* Market summary */}
      {summary && (
        <div style={{
          display:'flex', gap:12, padding:'5px 12px', background:'var(--bg-3)',
          borderBottom:'1px solid var(--border)', flexShrink:0, flexWrap:'wrap',
        }}>
          {Object.entries(summary.segments || {}).map(([seg, data]) => (
            <span key={seg} style={{ fontSize:9, color:'var(--text-2)' }}>
              <span style={{ color:'var(--orange)', fontWeight:600 }}>{seg}</span>
              {' '}₹{(data.volume_cr/100).toFixed(0)}K Cr
              {' '}· {(data.trades/1e6).toFixed(1)}M trades
            </span>
          ))}
          <span style={{ fontSize:9, color: summary.market_open ? 'var(--green)':'var(--red)', marginLeft:'auto' }}>
            {summary.market_open ? '● MARKET OPEN' : '● MARKET CLOSED'}
          </span>
        </div>
      )}

      {/* Trade list */}
      <div ref={listRef} className="scroll-y" style={{ flex:1, minHeight:0 }}>
        {shown.length === 0 && (
          <div className="loading" style={{ flexDirection:'column', gap:8 }}>
            <div style={{ fontSize:20 }}>📡</div>
            <div style={{ color:'var(--text-3)', fontSize:11 }}>Connecting to trade stream…</div>
          </div>
        )}
        {shown.map((t, i) => {
          const tc  = TYPE_COLORS[t.type] || TYPE_COLORS.RET
          const isB = t.side === 'BUY'
          return (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'4px 10px', borderBottom:'1px solid rgba(30,37,53,0.5)',
              fontSize:10, fontFamily:'var(--font-mono)',
              background: i===0 && !paused ? 'rgba(255,107,43,0.04)':'transparent',
            }}>
              {/* Side indicator */}
              <div style={{
                width:28, textAlign:'center', fontSize:9, fontWeight:700, flexShrink:0,
                color: isB ? 'var(--green)':'var(--red)',
                background: isB ? 'rgba(0,229,160,0.1)':'rgba(255,59,92,0.1)',
                padding:'2px 0', borderRadius:2,
              }}>{t.side}</div>

              {/* Symbol */}
              <div style={{ width:80, fontWeight:600, color:'var(--text-0)', flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {t.symbol}
              </div>

              {/* Exchange + Segment badges */}
              <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                <span style={{ fontSize:8, padding:'1px 4px', borderRadius:2, background:'var(--bg-4)', color:'var(--text-3)' }}>{t.exchange}</span>
                {t.segment !== 'EQ' && (
                  <span style={{ fontSize:8, padding:'1px 4px', borderRadius:2, background:'rgba(255,107,43,0.1)', color:'var(--orange)' }}>{t.segment}</span>
                )}
              </div>

              {/* Price */}
              <div style={{ flex:1, color:'var(--text-1)', textAlign:'right' }}>
                ₹{t.price?.toLocaleString('en-IN',{maximumFractionDigits:2})}
              </div>

              {/* Qty */}
              <div style={{ width:55, color:'var(--text-2)', textAlign:'right', fontSize:9 }}>
                {t.qty?.toLocaleString('en-IN')}
              </div>

              {/* Value */}
              <div style={{ width:65, textAlign:'right', fontWeight:600,
                color: isB ? 'var(--green)':'var(--red)',
              }}>
                {fmtVal(t.value || 0)}
              </div>

              {/* Trader type */}
              <div style={{
                width:36, textAlign:'center', fontSize:8, fontWeight:700, flexShrink:0,
                color:tc.color, borderLeft:`1px solid ${tc.color}30`, paddingLeft:4,
              }}>{t.type}</div>
            </div>
          )
        })}
      </div>

      {/* Trader type legend */}
      <div style={{
        display:'flex', gap:12, padding:'5px 12px', borderTop:'1px solid var(--border)',
        background:'var(--bg-3)', flexShrink:0, flexWrap:'wrap',
      }}>
        {Object.entries(TYPE_COLORS).map(([k,v]) => (
          <span key={k} style={{ fontSize:8, display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:v.color,display:'inline-block' }}/>
            <span style={{ color:'var(--text-3)' }}>{v.desc}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
