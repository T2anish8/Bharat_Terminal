import { useEffect, useRef, useState } from 'react'
import { createChart } from 'lightweight-charts'
import axios from 'axios'

const STOCK_PERIODS = [
  { label:'1D', endpoint:(sym,ex)=>`/api/stock/intraday/${sym}?exchange=${ex}&interval=5m`    },
  { label:'5D', endpoint:(sym,ex)=>`/api/stock/intraday/${sym}?exchange=${ex}&interval=15m`   },
  { label:'1M', endpoint:(sym,ex)=>`/api/stock/history/${sym}?exchange=${ex}&period=1mo&interval=1d`  },
  { label:'3M', endpoint:(sym,ex)=>`/api/stock/history/${sym}?exchange=${ex}&period=3mo&interval=1d`  },
  { label:'1Y', endpoint:(sym,ex)=>`/api/stock/history/${sym}?exchange=${ex}&period=1y&interval=1d`   },
  { label:'2Y', endpoint:(sym,ex)=>`/api/stock/history/${sym}?exchange=${ex}&period=2y&interval=1wk`  },
  { label:'5Y', endpoint:(sym,ex)=>`/api/stock/history/${sym}?exchange=${ex}&period=5y&interval=1wk`  },
]

const COMM_PERIODS = [
  { label:'1M', endpoint:(name)=>`/api/market/commodity-history/${encodeURIComponent(name)}?period=1mo&interval=1d` },
  { label:'3M', endpoint:(name)=>`/api/market/commodity-history/${encodeURIComponent(name)}?period=3mo&interval=1d` },
  { label:'6M', endpoint:(name)=>`/api/market/commodity-history/${encodeURIComponent(name)}?period=6mo&interval=1d` },
  { label:'1Y', endpoint:(name)=>`/api/market/commodity-history/${encodeURIComponent(name)}?period=1y&interval=1d`  },
  { label:'3Y', endpoint:(name)=>`/api/market/commodity-history/${encodeURIComponent(name)}?period=3y&interval=1wk` },
  { label:'5Y', endpoint:(name)=>`/api/market/commodity-history/${encodeURIComponent(name)}?period=5y&interval=1wk` },
]

export default function CandlestickChart({ symbol, exchange='NSE', isCommodity=false, commodityName=null }) {
  const containerRef = useRef(null)
  const chartRef     = useRef(null)
  const seriesRef    = useRef(null)
  const volSeriesRef = useRef(null)

  const periods      = isCommodity ? COMM_PERIODS : STOCK_PERIODS
  const [active, setActive]   = useState('1M')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [ohlc,    setOhlc]    = useState(null)

  // Init chart
  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      layout:     { background:{color:'#0F1117'}, textColor:'#8892A4' },
      grid:       { vertLines:{color:'#1E2535'}, horzLines:{color:'#1E2535'} },
      crosshair:  { mode:1 },
      rightPriceScale: { borderColor:'#1E2535' },
      timeScale:  { borderColor:'#1E2535', timeVisible:true, secondsVisible:false },
      width:  containerRef.current.clientWidth  || 600,
      height: containerRef.current.clientHeight || 400,
    })
    const series = chart.addCandlestickSeries({
      upColor:'#00E5A0', downColor:'#FF3B5C',
      borderUpColor:'#00E5A0', borderDownColor:'#FF3B5C',
      wickUpColor:'#00E5A0', wickDownColor:'#FF3B5C',
    })
    const volSeries = chart.addHistogramSeries({
      color:'rgba(255,107,43,0.3)', priceFormat:{type:'volume'},
      priceScaleId:'vol', scaleMargins:{top:0.8, bottom:0},
    })
    chartRef.current  = chart
    seriesRef.current = series
    volSeriesRef.current = volSeries

    const ro = new ResizeObserver(entries => {
      if (!chartRef.current) return
      const {width, height} = entries[0].contentRect
      chartRef.current.applyOptions({ width: Math.max(width,100), height: Math.max(height,100) })
    })
    ro.observe(containerRef.current)
    return () => { ro.disconnect(); chart.remove() }
  }, [])

  // Load data
  useEffect(() => {
    if (!symbol || !chartRef.current) return
    setLoading(true); setError(null); setOhlc(null)

    const cfg = periods.find(p => p.label === active) || periods[0]
    const url = isCommodity
      ? cfg.endpoint(commodityName || symbol)
      : cfg.endpoint(symbol, exchange)

    axios.get(url, { timeout: 25000 })
      .then(({ data }) => {
        const candles = Array.isArray(data) ? data : []
        if (!candles.length) { setError('No data'); return }
        const sorted = [...candles].sort((a,b) => a.time-b.time)
        seriesRef.current.setData(sorted)
        volSeriesRef.current.setData(sorted.map(c => ({
          time: c.time,
          value: c.volume || 0,
          color: c.close >= c.open ? 'rgba(0,229,160,0.3)' : 'rgba(255,59,92,0.3)',
        })))
        chartRef.current.timeScale().fitContent()
        setOhlc(sorted[sorted.length-1])
      })
      .catch(e => setError(`Load failed: ${e.message}`))
      .finally(() => setLoading(false))
  }, [symbol, exchange, active, isCommodity, commodityName])

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0, overflow:'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display:'flex', alignItems:'center', gap:4, padding:'5px 8px', flexShrink:0,
        background:'var(--bg-3)', borderBottom:'1px solid var(--border)',
      }}>
        {periods.map(p => (
          <button key={p.label} className={`btn ${active===p.label?'active':''}`}
            onClick={() => setActive(p.label)}>{p.label}</button>
        ))}
        {loading && <span style={{ fontSize:9, color:'var(--text-3)', marginLeft:6 }}>Loading…</span>}
        {ohlc && !loading && (
          <div style={{ display:'flex', gap:12, marginLeft:10, fontSize:10, color:'var(--text-2)' }}>
            {[['O',ohlc.open],['H',ohlc.high],['L',ohlc.low],['C',ohlc.close]].map(([l,v])=>(
              <span key={l}>
                <span style={{color:'var(--text-3)'}}>{l} </span>
                <span style={{color:'var(--text-0)'}}>{v?.toLocaleString('en-IN',{maximumFractionDigits:isCommodity?4:2})}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Canvas */}
      <div ref={containerRef} style={{ flex:1, minHeight:0, position:'relative' }}>
        {error && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-3)', fontSize:11 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
