import { useEffect, useState } from 'react'
import { useStore } from '../../store/useStore'
import axios from 'axios'

const TABS = [
  { id:'NSE',    label:'NSE' },
  { id:'BSE',    label:'BSE' },
  { id:'MCX',    label:'MCX' },
  { id:'NCDEX',  label:'NCDEX' },
  { id:'INDICES',label:'IDX' },
  { id:'FX',     label:'FX' },
  { id:'ETF',    label:'ETF' },
]

const COMM_SECTORS = ['All','Precious Metals','Base Metals','Energy','Agri','Softs']

export default function Sidebar() {
  const { selectSymbol, selectedSymbol, marketOpen, marketTime, backendOnline } = useStore()
  const [tab,     setTab]     = useState('NSE')
  const [subTab,  setSubTab]  = useState('NIFTY 50')
  const [items,   setItems]   = useState([])
  const [sector,  setSector]  = useState('All')
  const [loading, setLoading] = useState(false)

  const fetchData = async (t, sub, sec) => {
    if (!backendOnline) return
    setLoading(true)
    try {
      let url = '/api/market/nifty50'
      if (t === 'NSE') {
        if (sub === 'NIFTY 50')    url = '/api/market/nifty50'
        else if (sub === 'NEXT 50') url = '/api/market/niftynext50'
        else                        url = '/api/market/midcap'
      } else if (t === 'BSE')      url = '/api/market/bse'
      else if (t === 'INDICES')    url = '/api/market/indices'
      else if (t === 'FX')         url = '/api/market/currencies'
      else if (t === 'ETF') url = '/api/market/etfs'
      else if (t === 'MCX' || t === 'NCDEX') {
        url = sec && sec !== 'All'
          ? `/api/market/commodities?sector=${encodeURIComponent(sec)}`
          : '/api/market/commodities'
      }
      const { data } = await axios.get(url, { timeout: 25000 })
      let list = Array.isArray(data) ? data : []
      // For MCX/NCDEX, filter by exchange
      if (t === 'ETF')   {} // no filter needed
      else if (t === 'MCX')   list = list.filter(c => c.exchange === 'MCX')
      if (t === 'NCDEX') list = list.filter(c => c.exchange === 'NCDEX')
      setItems(list)
    } catch (e) {
      console.warn('Sidebar fetch:', e.message)
      setItems([])
    }
    setLoading(false)
  }

  useEffect(() => { fetchData(tab, subTab, sector) }, [tab, subTab, sector, backendOnline])

  const handleSelect = (item) => {
    if (!item) return
    const sym = item.symbol || item.name
    const ex  = item.exchange || 'NSE'
    // For commodities pass the display name so chart can use it
    selectSymbol(sym, ex, item.name || sym, item)
  }

  const isCommodityTab = tab === 'MCX' || tab === 'NCDEX' || tab === 'ETF'
  const isNSE = tab === 'NSE'

  return (
    <div className="sidebar">
      {/* Status */}
      <div style={{ padding:'7px 10px 5px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:7,height:7,borderRadius:'50%',
            background:marketOpen?'var(--green)':'var(--red)',display:'inline-block',
            boxShadow:marketOpen?'0 0 6px var(--green)':undefined }}/>
          <span style={{ fontSize:10, color:marketOpen?'var(--green)':'var(--red)', fontWeight:600 }}>
            NSE {marketOpen?'OPEN':'CLOSED'}
          </span>
        </div>
        <div style={{ fontSize:9, color:'var(--text-3)', marginTop:1 }}>{marketTime} IST</div>
      </div>

      {/* Exchange tabs */}
      <div style={{ display:'flex', flexWrap:'wrap', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        {TABS.map(t => (
          <div key={t.id} onClick={() => { setTab(t.id); setSector('All') }} style={{
            flex:'0 0 33.33%', padding:'6px 0', textAlign:'center', fontSize:9,
            cursor:'pointer', fontWeight:700, letterSpacing:'0.04em',
            color:     tab===t.id?'var(--orange)':'var(--text-3)',
            background:tab===t.id?'var(--bg-3)':'transparent',
            borderBottom:tab===t.id?'2px solid var(--orange)':'2px solid transparent',
          }}>{t.label}</div>
        ))}
      </div>

      {/* NSE sub-tabs */}
      {isNSE && (
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          {['NIFTY 50','NEXT 50','MIDCAP'].map(s => (
            <div key={s} onClick={() => setSubTab(s)} style={{
              flex:1, padding:'5px 2px', textAlign:'center', fontSize:8,
              cursor:'pointer', fontWeight:600,
              color:subTab===s?'var(--yellow)':'var(--text-3)',
              borderBottom:subTab===s?'2px solid var(--yellow)':'2px solid transparent',
              background:subTab===s?'var(--bg-3)':'transparent',
            }}>{s}</div>
          ))}
        </div>
      )}

      {/* Commodity sector filter */}
      {isCommodityTab && (
        <div className="scroll-y" style={{ flexShrink:0, borderBottom:'1px solid var(--border)', maxHeight:32 }}>
          <div style={{ display:'flex', gap:0, padding:'0', overflowX:'auto', whiteSpace:'nowrap' }}>
            {COMM_SECTORS.map(s => (
              <div key={s} onClick={() => setSector(s)} style={{
                padding:'5px 8px', fontSize:8, cursor:'pointer', fontWeight:600,
                flexShrink:0, letterSpacing:'0.03em',
                color:sector===s?'var(--orange)':'var(--text-3)',
                borderBottom:sector===s?'2px solid var(--orange)':'2px solid transparent',
                background:sector===s?'rgba(255,107,43,0.05)':'transparent',
              }}>{s}</div>
            ))}
          </div>
        </div>
      )}

      {/* Item list */}
      <div className="scroll-y" style={{ flex:1, minHeight:0 }}>
        {loading && <div style={{ padding:'14px', fontSize:10, color:'var(--text-3)', textAlign:'center' }}>Loading…</div>}
        {!loading && !backendOnline && <div style={{ padding:'14px', fontSize:10, color:'var(--red)', textAlign:'center' }}>Backend offline</div>}
        {!loading && backendOnline && items.length === 0 && (
          <div style={{ padding:'14px', fontSize:10, color:'var(--text-3)', textAlign:'center' }}>No data</div>
        )}
        {items.map((item, i) => {
          const sym    = item.symbol || item.name || ''
          const name   = item.name   || item.symbol || sym
          const price  = item.price  || 0
          const pct    = item.change_pct || 0
          const isSelected = selectedSymbol === sym || selectedSymbol === (item.display_name || '')
          const isUp   = pct >= 0

          return (
            <div key={i} onClick={() => handleSelect(item)} style={{
              padding:'5px 10px', borderBottom:'1px solid var(--border)',
              cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center',
              background: isSelected ? 'rgba(255,107,43,0.07)' : 'transparent',
              borderLeft: isSelected ? '2px solid var(--orange)' : '2px solid transparent',
            }}>
              <div style={{ minWidth:0, flex:1, marginRight:4 }}>
                <div style={{
                  fontSize:10, color:'var(--text-0)', fontWeight:isSelected?600:400,
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                }}>
                  {isCommodityTab ? name.slice(0,16) : sym.slice(0,12)}
                </div>
                <div style={{ fontSize:8, color:'var(--text-3)', marginTop:1 }}>
                  {isCommodityTab ? item.sector || '' : (item.sector && item.sector !== 'N/A' ? item.sector : '')}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                {price > 0 ? (
                  <>
                    <div style={{ fontSize:10, color:'var(--text-0)', fontFamily:'var(--font-mono)' }}>
                      {isCommodityTab
                        ? price.toFixed(price > 100 ? 2 : 4)
                        : price > 1000
                          ? price.toLocaleString('en-IN',{maximumFractionDigits:0})
                          : price.toFixed(2)}
                    </div>
                    <div style={{ fontSize:9, color:isUp?'var(--green)':'var(--red)' }}>
                      {isUp?'▲':'▼'}{Math.abs(pct).toFixed(2)}%
                    </div>
                  </>
                ) : <div style={{ fontSize:9, color:'var(--text-3)' }}>—</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
// ETF tab handler patch applied via routes_market /api/market/etfs
