import { useEffect, useState } from 'react'
import axios from 'axios'
import { useStore } from '../../store/useStore'

const fmt = (n, dec=2) => n > 0 ? n.toLocaleString('en-IN',{minimumFractionDigits:dec,maximumFractionDigits:dec}) : '—'
const TABS = ['Indices','Nifty 50','Commodities','Currencies']
const COMM_SECTORS = ['All','Precious Metals','Base Metals','Energy','Agri']

export default function MarketOverviewPanel() {
  const { indices, fetchIndices, selectSymbol, marketOpen, marketTime } = useStore()
  const [tab,       setTab]     = useState('Indices')
  const [commSec,   setCommSec] = useState('All')
  const [allComm,   setAllComm] = useState([])
  const [currencies,setCur]     = useState([])
  const [nifty,     setNifty]   = useState([])
  const [loading,   setLoad]    = useState(false)

  useEffect(() => { fetchIndices() }, [])

  useEffect(() => {
    const load = async () => {
      setLoad(true)
      try {
        if (tab === 'Nifty 50') {
          const { data } = await axios.get('/api/market/nifty50', { timeout:25000 })
          setNifty(Array.isArray(data) ? data : [])
        } else if (tab === 'Commodities') {
          const { data } = await axios.get('/api/market/commodities', { timeout:25000 })
          setAllComm(Array.isArray(data) ? data : [])
        } else if (tab === 'Currencies') {
          const { data } = await axios.get('/api/market/currencies', { timeout:15000 })
          setCur(Array.isArray(data) ? data : [])
        } else {
          fetchIndices()
        }
      } catch {}
      setLoad(false)
    }
    load()
    const id = setInterval(load, 60000)
    return () => clearInterval(id)
  }, [tab])

  const commodities = commSec === 'All' ? allComm : allComm.filter(c => c.sector === commSec)

  const list = tab === 'Indices' ? indices
    : tab === 'Nifty 50' ? nifty
    : tab === 'Currencies' ? currencies
    : commodities

  const sectorColors = {
    'Precious Metals':'#FFB800','Base Metals':'#8892A4',
    'Energy':'#FF6B2B','Agri':'#00E5A0','Softs':'#9C6FFF',
  }

  return (
    <div className="panel" style={{ gridColumn:'2', gridRow:'1', display:'flex', flexDirection:'column' }}>
      <div className="panel-header">
        <span className="panel-title">Market Overview</span>
        <span style={{ fontSize:9, color:marketOpen?'var(--green)':'var(--red)' }}>
          {marketOpen?'● LIVE':'● CLOSED'} {marketTime}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        {TABS.map(t => (
          <div key={t} onClick={() => setTab(t)} style={{
            flex:1, padding:'5px 2px', textAlign:'center', fontSize:9, cursor:'pointer', fontWeight:600,
            color:tab===t?'var(--orange)':'var(--text-3)',
            borderBottom:tab===t?'2px solid var(--orange)':'2px solid transparent',
            background:tab===t?'var(--bg-3)':'transparent',
          }}>{t}</div>
        ))}
      </div>

      {/* Commodity sector filter */}
      {tab === 'Commodities' && (
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', flexShrink:0, overflowX:'auto' }}>
          {COMM_SECTORS.map(s => (
            <div key={s} onClick={() => setCommSec(s)} style={{
              padding:'4px 8px', fontSize:8, cursor:'pointer', fontWeight:600,
              whiteSpace:'nowrap', flexShrink:0,
              color:commSec===s?'var(--orange)':'var(--text-3)',
              borderBottom:commSec===s?'2px solid var(--orange)':'2px solid transparent',
              background:commSec===s?'rgba(255,107,43,0.05)':'transparent',
            }}>{s}</div>
          ))}
        </div>
      )}

      <div className="scroll-y" style={{ flex:1, minHeight:0 }}>
        {loading && <div style={{ padding:'12px', fontSize:10, color:'var(--text-3)', textAlign:'center' }}>Loading…</div>}
        {!loading && list.length === 0 && (
          <div style={{ padding:'12px', fontSize:10, color:'var(--text-3)', textAlign:'center' }}>No data</div>
        )}

        {list.map((item, i) => {
          const price  = item.price || 0
          const pct    = item.change_pct || 0
          const isComm = tab === 'Commodities'
          const isCur  = tab === 'Currencies'
          return (
            <div key={i}
              onClick={() => item.symbol && (tab==='Nifty 50'
                ? selectSymbol(item.symbol, 'NSE')
                : isComm
                  ? selectSymbol(item.symbol, item.exchange||'MCX', item.name, {...item, type:'COMMODITY'})
                  : null
              )}
              style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'5px 12px', borderBottom:'1px solid var(--border)',
                cursor: (tab==='Nifty 50'||isComm) ? 'pointer':'default',
              }}
            >
              <div>
                <div style={{ fontSize:11, color:'var(--text-0)', fontWeight:500 }}>
                  {(item.name||item.symbol||'').replace(' Index','').slice(0,22)}
                </div>
                <div style={{ fontSize:8, color: isComm ? sectorColors[item.sector]||'var(--text-3)' : 'var(--text-3)', marginTop:1 }}>
                  {isComm ? (item.sector||'') : (item.sector||'')}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-0)' }}>
                  {price > 0
                    ? isCur ? `₹${price.toFixed(4)}`
                      : isComm ? (price > 1000 ? price.toLocaleString('en-IN',{maximumFractionDigits:2}) : price.toFixed(4))
                        : price > 1000 ? price.toLocaleString('en-IN',{maximumFractionDigits:0}) : price.toFixed(2)
                    : '—'}
                </div>
                {price > 0 && (
                  <div style={{ fontSize:10, color:pct>=0?'var(--green)':'var(--red)' }}>
                    {pct>=0?'▲':'▼'}{Math.abs(pct).toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
