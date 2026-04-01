import { useEffect, useState } from 'react'
import axios from 'axios'
import { useStore, API } from '../../store/useStore'
import CandlestickChart from '../charts/CandlestickChart'

const ax  = axios.create({ baseURL: API, timeout: 18000 })
const fmt = (n) => (n != null && !isNaN(n) && n !== 0)
  ? n.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 }) : '—'
const fmtMcap = (n) => {
  if (!n || n===0) return '—'
  if (n >= 1e12) return `₹${(n/1e12).toFixed(2)}L Cr`
  if (n >= 1e9)  return `₹${(n/1e9).toFixed(2)}K Cr`
  if (n >= 1e7)  return `₹${(n/1e7).toFixed(2)} Cr`
  return `₹${n.toLocaleString('en-IN')}`
}

const STOCK_TABS = ['Chart','Overview','Options','ML']
const COMM_TABS  = ['Chart','Details','ML']

export default function StockDetailPanel() {
  const { selectedSymbol, selectedExchange, selectedType, selectedMeta, quotes, backendOnline } = useStore()

  const isCommodity = selectedType === 'COMMODITY' || selectedExchange === 'MCX' || selectedExchange === 'NCDEX'
  const displayName = selectedMeta?.displayName || selectedMeta?.name || selectedSymbol

  const [tab,     setTab]   = useState('Chart')
  const [quote,   setQuote] = useState(null)
  const [fund,    setFund]  = useState(null)
  const [signal,  setSig]   = useState(null)
  const [options, setOpts]  = useState(null)
  const [pred,    setPred]  = useState(null)
  const [loading, setLoad]  = useState(false)

  const wsQuote = quotes[selectedSymbol]
  const q = wsQuote || quote || {}
  const price    = q.price      || 0
  const change   = q.change     || 0
  const changePct= q.change_pct || 0
  const isUp     = changePct >= 0
  const tabs     = isCommodity ? COMM_TABS : STOCK_TABS

  // Reset tab if switching between commodity and stock
  useEffect(() => {
    setTab('Chart')
    setQuote(null); setFund(null); setSig(null); setOpts(null); setPred(null)
  }, [selectedSymbol, selectedExchange])

  // Fetch data
  useEffect(() => {
    if (!selectedSymbol || !backendOnline) return
    setLoad(true)
    if (isCommodity) {
      // Commodity: fetch from /market/commodity/{name}
      const name = encodeURIComponent(displayName)
      ax.get(`/market/commodity/${name}`)
        .then(r => { if (r.data && !r.data.error) setQuote(r.data) })
        .catch(() => {})
        .finally(() => setLoad(false))
    } else {
      // Stock
      Promise.allSettled([
        ax.get(`/stock/quote/${selectedSymbol}`,        { params:{ exchange:selectedExchange } }),
        ax.get(`/stock/fundamentals/${selectedSymbol}`, { params:{ exchange:selectedExchange } }),
        ax.get(`/stock/signal/${selectedSymbol}`,       { params:{ exchange:selectedExchange } }),
      ]).then(([qr,fr,sr]) => {
        if (qr.status==='fulfilled') setQuote(qr.value.data)
        if (fr.status==='fulfilled') setFund(fr.value.data)
        if (sr.status==='fulfilled') setSig(sr.value.data)
      }).finally(() => setLoad(false))
    }
  }, [selectedSymbol, selectedExchange, isCommodity, backendOnline])

  // Auto-refresh
  useEffect(() => {
    if (!selectedSymbol || !backendOnline) return
    const id = setInterval(() => {
      if (isCommodity) {
        ax.get(`/market/commodity/${encodeURIComponent(displayName)}`)
          .then(r => { if (r.data && !r.data.error) setQuote(r.data) }).catch(()=>{})
      } else {
        ax.get(`/stock/quote/${selectedSymbol}`, { params:{exchange:selectedExchange} })
          .then(r => setQuote(r.data)).catch(()=>{})
      }
    }, 15000)
    return () => clearInterval(id)
  }, [selectedSymbol, selectedExchange, isCommodity, backendOnline])

  // Lazy-load tabs
  useEffect(() => {
    if (!backendOnline || isCommodity) return
    if (tab==='Options' && !options)
      ax.get(`/stock/options/${selectedSymbol}`, { params:{exchange:selectedExchange} })
        .then(r => setOpts(r.data)).catch(()=> setOpts({error:true}))
    if (tab==='ML' && !pred)
      ax.get(`/ml/predict/${selectedSymbol}`, { params:{exchange:selectedExchange} })
        .then(r => setPred(r.data)).catch(()=> setPred({error:true}))
  }, [tab, selectedSymbol, backendOnline, isCommodity])

  if (!backendOnline) return (
    <div className="panel" style={{ gridColumn:'1', gridRow:'1/3' }}>
      <div className="panel-header"><span className="panel-title">Detail Panel</span></div>
      <div className="loading" style={{ flexDirection:'column', gap:10, color:'var(--red)' }}>
        <span>Backend offline</span>
        <code style={{ fontSize:9, color:'var(--yellow)', background:'var(--bg-3)', padding:'3px 8px', borderRadius:3 }}>
          cd backend &amp;&amp; python run.py
        </code>
      </div>
    </div>
  )

  // Signal badge
  const sigMap = {
    'Strong Buy':{ color:'#00E5A0',bg:'rgba(0,229,160,0.12)'},
    'Buy':       { color:'#00E5A0',bg:'rgba(0,229,160,0.08)'},
    'Neutral':   { color:'#FFB800',bg:'rgba(255,184,0,0.10)'},
    'Sell':      { color:'#FF3B5C',bg:'rgba(255,59,92,0.08)'},
    'Strong Sell':{ color:'#FF3B5C',bg:'rgba(255,59,92,0.12)'},
  }
  const sigStyle = sigMap[signal?.signal] || sigMap['Neutral']

  // Commodity sector badge colors
  const sectorColors = {
    'Precious Metals':'#FFB800','Base Metals':'#8892A4',
    'Energy':'#FF6B2B','Agri':'#00E5A0','Softs':'#9C6FFF',
  }

  return (
    <div className="panel" style={{ gridColumn:'1', gridRow:'1/3', display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <div className="stock-header">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
          <div style={{ flex:1, minWidth:0 }}>
            {/* Name row */}
            <div style={{ fontSize:10, color:'var(--text-3)', marginBottom:3, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <span style={{ color:'var(--text-1)' }}>{isCommodity ? displayName : (fund?.name || displayName)}</span>
              <span style={{ padding:'1px 6px', borderRadius:2, fontSize:8, fontWeight:600,
                background: isCommodity ? `${sectorColors[q.sector]||'#FFB800'}18` : 'var(--bg-4)',
                color: isCommodity ? sectorColors[q.sector]||'#FFB800' : 'var(--text-3)',
              }}>
                {isCommodity ? (q.sector || selectedExchange) : (fund?.sector || selectedExchange)}
              </span>
              {isCommodity && q.unit && (
                <span style={{ fontSize:8, color:'var(--text-3)' }}>{q.unit}</span>
              )}
              {!isCommodity && (
                <span style={{ fontSize:8, padding:'1px 5px', background:'var(--bg-4)', color:'var(--text-3)', borderRadius:2 }}>
                  {selectedExchange}
                </span>
              )}
            </div>
            {/* Price row */}
            <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
              <span style={{ fontSize:28, fontWeight:600, color:'var(--text-0)', letterSpacing:'-0.02em' }}>
                {price > 0 ? (isCommodity
                  ? (price > 1000
                      ? price.toLocaleString('en-IN',{maximumFractionDigits:2})
                      : price.toFixed(4))
                  : `₹${fmt(price)}`)
                  : (loading ? '…' : '—')}
              </span>
              {price > 0 && (
                <span style={{ fontSize:13, color:isUp?'var(--green)':'var(--red)' }}>
                  {isUp?'▲':'▼'} {isCommodity ? Math.abs(change).toFixed(4) : fmt(Math.abs(change))} ({Math.abs(changePct).toFixed(2)}%)
                </span>
              )}
            </div>
          </div>
          {/* Signal / Exchange badge */}
          {!isCommodity && signal?.signal && (
            <div style={{ padding:'5px 12px', borderRadius:4, fontSize:11, fontWeight:600,
              color:sigStyle.color, background:sigStyle.bg, border:`1px solid ${sigStyle.color}40`,
              marginTop:4, whiteSpace:'nowrap', flexShrink:0,
            }}>
              {signal.signal}
            </div>
          )}
          {isCommodity && (
            <div style={{ padding:'4px 10px', borderRadius:4, fontSize:10, fontWeight:700,
              color:'#FFB800', background:'rgba(255,184,0,0.1)', border:'1px solid rgba(255,184,0,0.25)',
              marginTop:4, whiteSpace:'nowrap', flexShrink:0,
            }}>
              {selectedExchange}
            </div>
          )}
        </div>

        {/* OHLV row */}
        {price > 0 && (
          <div style={{ display:'flex', gap:16, marginTop:8, fontSize:10, color:'var(--text-2)', flexWrap:'wrap' }}>
            {[
              ['O',  q.open],
              ['H',  q.high || q.week_52_high && null],
              ['L',  q.low],
              ['P',  q.prev_close],
              ['52H',q.week_52_high],
              ['52L',q.week_52_low],
              ...(!isCommodity ? [['MCap', null, fmtMcap(q.market_cap || fund?.market_cap)]] : []),
            ].map(([label, val, custom]) => {
              const display = custom || (val > 0 ? (isCommodity ? val?.toFixed(val > 100 ? 2 : 4) : fmt(val)) : null)
              if (!display) return null
              return (
                <span key={label}>
                  <span style={{color:'var(--text-3)'}}>{label} </span>
                  <span style={{color:'var(--text-1)'}}>{display}</span>
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {tabs.map(t => (
          <div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</div>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex:1, minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>

        {/* CHART */}
        {tab === 'Chart' && (
          <CandlestickChart
            symbol={selectedSymbol}
            exchange={selectedExchange}
            isCommodity={isCommodity}
            commodityName={isCommodity ? displayName : null}
          />
        )}

        {/* OVERVIEW (stocks) */}
        {tab === 'Overview' && !isCommodity && (
          <div className="scroll-y" style={{ flex:1 }}>
            {loading && <div className="loading">Loading…</div>}
            {fund && (
              <>
                <div className="fund-grid">
                  {[
                    ['P/E',       fund.pe>0 ? fund.pe.toFixed(2):'—'],
                    ['Fwd P/E',   fund.forward_pe>0 ? fund.forward_pe.toFixed(2):'—'],
                    ['P/B',       fund.pb>0 ? fund.pb.toFixed(2):'—'],
                    ['EPS',       fund.eps!==0 ? `₹${fund.eps}`:'—'],
                    ['Div Yield', fund.div_yield>0 ? `${fund.div_yield}%`:'—'],
                    ['ROE',       fund.roe>0 ? `${fund.roe}%`:'—'],
                    ['D/E',       fund.debt_equity>0 ? fund.debt_equity.toFixed(2):'—'],
                    ['Beta',      fund.beta!==0 ? fund.beta.toFixed(2):'—'],
                    ['52W H',     fund.week_52_high>0 ? `₹${fmt(fund.week_52_high)}`:'—'],
                    ['52W L',     fund.week_52_low>0  ? `₹${fmt(fund.week_52_low)}`:'—'],
                    ['Revenue',   fmtMcap(fund.revenue)],
                    ['Net Inc.',  fmtMcap(fund.net_income)],
                    ['Mkt Cap',   fmtMcap(fund.market_cap)],
                    ['Margin',    fund.profit_margin>0 ? `${fund.profit_margin}%`:'—'],
                    ['Employees', fund.employees>0 ? fund.employees.toLocaleString('en-IN'):'—'],
                    ['Industry',  fund.industry||'—'],
                  ].map(([label,val]) => (
                    <div key={label} className="fund-cell">
                      <span className="fund-label">{label}</span>
                      <span className="fund-value">{val}</span>
                    </div>
                  ))}
                </div>
                {fund.description && (
                  <div style={{ padding:'10px 14px', fontSize:10, color:'var(--text-2)', lineHeight:1.7, fontFamily:'var(--font-sans)' }}>
                    {fund.description.slice(0,500)}{fund.description.length>500?'…':''}
                  </div>
                )}
                {signal?.indicators && Object.keys(signal.indicators).length > 0 && (
                  <div style={{ padding:'8px 14px 14px' }}>
                    <div style={{ fontSize:9, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Technical Indicators</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'var(--border)' }}>
                      {Object.entries(signal.indicators).filter(([,v])=>v!==null).map(([k,v]) => (
                        <div key={k} style={{ background:'var(--bg-2)', padding:'5px 10px', display:'flex', justifyContent:'space-between' }}>
                          <span style={{ fontSize:9, color:'var(--text-3)', textTransform:'uppercase' }}>{k.replace(/_/g,' ')}</span>
                          <span style={{ fontSize:10, color:'var(--text-0)' }}>{typeof v==='number'?v.toFixed(2):v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* COMMODITY DETAILS */}
        {tab === 'Details' && isCommodity && (
          <div className="scroll-y" style={{ flex:1 }}>
            {loading && <div className="loading">Loading…</div>}
            {quote && (
              <div className="fund-grid" style={{ margin:0 }}>
                {[
                  ['Name',         displayName],
                  ['Exchange',     selectedExchange],
                  ['Sector',       q.sector||'—'],
                  ['Unit',         q.unit||'—'],
                  ['Current Price',price > 0 ? price.toFixed(price>100?2:4):'—'],
                  ['Change',       changePct.toFixed(2)+'%'],
                  ['Day High',     q.high>0 ? q.high.toFixed(2):'—'],
                  ['Day Low',      q.low>0  ? q.low.toFixed(2):'—'],
                  ['Prev Close',   q.prev_close>0 ? q.prev_close.toFixed(2):'—'],
                  ['52W High',     q.week_52_high>0 ? q.week_52_high.toFixed(2):'—'],
                  ['52W Low',      q.week_52_low>0  ? q.week_52_low.toFixed(2):'—'],
                  ['Volume',       q.volume>0 ? q.volume.toLocaleString('en-IN'):'—'],
                ].map(([label,val]) => (
                  <div key={label} className="fund-cell">
                    <span className="fund-label">{label}</span>
                    <span className="fund-value">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* OPTIONS (stocks only) */}
        {tab === 'Options' && !isCommodity && (
          <div className="scroll-y" style={{ flex:1 }}>
            {!options && <div className="loading">Loading options chain…</div>}
            {options?.error && <div className="loading" style={{color:'var(--text-3)'}}>Options unavailable</div>}
            {options && !options.error && (
              <>
                <div style={{ padding:'6px 12px', fontSize:9, color:'var(--text-3)', display:'flex', gap:16 }}>
                  <span>Expiry: <span style={{color:'var(--orange)'}}>{options.expiries?.[0]||'—'}</span></span>
                  <span>Spot: <span style={{color:'var(--text-0)'}}>₹{fmt(options.spot)}</span></span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
                  {[['CALLS','calls','var(--green)'],['PUTS','puts','var(--red)']].map(([label,key,color])=>(
                    <div key={key}>
                      <div style={{ padding:'5px 10px', fontSize:9, color, fontWeight:600, background:'var(--bg-3)', borderBottom:'1px solid var(--border)' }}>{label}</div>
                      <table className="data-table"><thead><tr><th>Strike</th><th>LTP</th><th>OI</th><th>IV%</th></tr></thead>
                        <tbody>
                          {(options[key]||[]).slice(0,15).map((c,i)=>(
                            <tr key={i}>
                              <td style={{color:'var(--text-0)'}}>{c.strike}</td>
                              <td style={{color}}>{fmt(c.lastPrice)}</td>
                              <td>{c.openInterest?.toLocaleString('en-IN')||'—'}</td>
                              <td>{c.impliedVolatility?(c.impliedVolatility*100).toFixed(1)+'%':'—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ML */}
        {tab === 'ML' && (
          <div className="scroll-y" style={{ flex:1, padding:14 }}>
            {!pred && <div className="loading">Running ML model…</div>}
            {pred?.error && <div className="loading" style={{color:'var(--text-3)'}}>ML unavailable</div>}
            {pred && !pred.error && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { label:'5-Day Price Forecast', val:`${isCommodity?'':' ₹'}${typeof pred.predicted_price==='number'?pred.predicted_price.toFixed(2):'—'}`, color:pred.direction==='up'?'var(--green)':'var(--red)' },
                  { label:'Expected Move', val:`${pred.direction==='up'?'+':''}${typeof pred.predicted_pct==='number'?pred.predicted_pct.toFixed(2)+'%':'—'}`, color:pred.direction==='up'?'var(--green)':'var(--red)' },
                  { label:'Sentiment', val:pred.sentiment_score>0?'Positive':pred.sentiment_score<0?'Negative':'Neutral', color:pred.sentiment_score>0?'var(--green)':pred.sentiment_score<0?'var(--red)':'var(--yellow)' },
                  { label:'Confidence', val:pred.confidence?(pred.confidence*100).toFixed(1)+'%':'—', color:'var(--blue)' },
                ].map(({label,val,color})=>(
                  <div key={label} style={{ background:'var(--bg-3)', borderRadius:5, padding:'10px 14px', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:9, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>{label}</div>
                    <div style={{ fontSize:18, fontWeight:600, color }}>{val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
