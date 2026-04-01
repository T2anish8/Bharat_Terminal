import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../../store/useStore'

const TYPE_CFG = {
  EQUITY:    { badge:'EQ',  color:'#00E5A0', bg:'rgba(0,229,160,0.12)',  label:'Stocks'     },
  INDEX:     { badge:'IDX', color:'#FFB800', bg:'rgba(255,184,0,0.12)',  label:'Indices'    },
  COMMODITY: { badge:'COM', color:'#FF6B2B', bg:'rgba(255,107,43,0.12)', label:'Commodities'},
  CURRENCY:  { badge:'FX',  color:'#2979FF', bg:'rgba(41,121,255,0.12)', label:'Currencies' },
  ETF:       { badge:'ETF', color:'#9C6FFF', bg:'rgba(156,111,255,0.12)',label:'ETFs'       },
}

const QUICK = [
  { label:'NIFTY 50', symbol:'^NSEI',       exchange:'NSE', type:'INDEX',    displayName:'Nifty 50' },
  { label:'SENSEX',   symbol:'^BSESN',      exchange:'BSE', type:'INDEX',    displayName:'Sensex'   },
  { label:'RELIANCE', symbol:'RELIANCE',    exchange:'NSE', type:'EQUITY'   },
  { label:'TCS',      symbol:'TCS',         exchange:'NSE', type:'EQUITY'   },
  { label:'HDFCBANK', symbol:'HDFCBANK',    exchange:'NSE', type:'EQUITY'   },
  { label:'GOLD',     symbol:'GC=F',        exchange:'MCX', type:'COMMODITY',displayName:'Gold'     },
  { label:'SILVER',   symbol:'SI=F',        exchange:'MCX', type:'COMMODITY',displayName:'Silver'   },
  { label:'CRUDE',    symbol:'CL=F',        exchange:'MCX', type:'COMMODITY',displayName:'Crude Oil'},
  { label:'USD/INR',  symbol:'USDINR=X',    exchange:'NSE', type:'CURRENCY', displayName:'USD/INR'  },
  { label:'GOLDBEES', symbol:'GOLDBEES.NS', exchange:'NSE', type:'ETF',      displayName:'Nippon Gold ETF'},
]

export default function SearchBar() {
  const { search, searchResults, clearSearch, selectSymbol } = useStore()
  const [query,   setQuery]   = useState('')
  const [open,    setOpen]    = useState(false)
  const [hovered, setHovered] = useState(-1)
  const inputRef = useRef(null)
  const wrapRef  = useRef(null)
  const debounce = useRef(null)

  /* ── Keyboard shortcut Ctrl+K ── */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey||e.metaKey) && e.key==='k') { e.preventDefault(); inputRef.current?.focus(); setOpen(true) }
      if (e.key==='Escape') { setOpen(false); clearSearch(); setQuery(''); inputRef.current?.blur() }
      if (e.key==='ArrowDown') setHovered(h => Math.min(h+1, searchResults.length-1))
      if (e.key==='ArrowUp')   setHovered(h => Math.max(h-1, 0))
      if (e.key==='Enter' && hovered >= 0 && searchResults[hovered]) pick(searchResults[hovered])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchResults, hovered])

  /* ── Close on outside click ── */
  useEffect(() => {
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const handleChange = (e) => {
    const v = e.target.value
    setQuery(v); setOpen(true); setHovered(-1)
    clearTimeout(debounce.current)
    if (v.trim().length >= 1) debounce.current = setTimeout(() => search(v), 220)
    else clearSearch()
  }

  const pick = useCallback((item) => {
    const sym  = item.symbol || item.sym || ''
    const ex   = item.exchange || 'NSE'
    const name = item.displayName || item.display_name || item.name || item.label || sym
    const type = item.type || 'EQUITY'
    selectSymbol(sym, ex, name, { ...item, type, displayName: name })
    setQuery(''); clearSearch(); setOpen(false)
  }, [])

  const grouped = {}
  ;(searchResults || []).forEach(r => {
    const t = r.type || 'EQUITY'
    if (!grouped[t]) grouped[t] = []
    grouped[t].push(r)
  })
  const flatList = searchResults || []
  let flatIdx = 0

  return (
    <div ref={wrapRef} style={{ position:'relative', background:'var(--bg-2)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>

      {/* ── Search row ── */}
      <div style={{ display:'flex', alignItems:'center', gap:0, padding:'5px 10px', gap:6 }}>

        {/* Main input */}
        <div style={{ flex:1, position:'relative', display:'flex', alignItems:'center' }}>
          <span style={{ position:'absolute', left:10, fontSize:14, color:'var(--text-3)', pointerEvents:'none', zIndex:1 }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            onFocus={(e) => { setOpen(true); e.target.style.borderColor = 'var(--orange)' }}
            onBlur={(e)  => { e.target.style.borderColor = 'var(--border)' }}
            placeholder="Search stocks, ETFs, indices, commodities…   Ctrl+K"
            style={{
              width:'100%', background:'var(--bg-3)', border:'1px solid var(--border)',
              borderRadius:5, padding:'7px 32px 7px 32px',
              fontSize:11, color:'var(--text-0)', outline:'none',
              fontFamily:'var(--font-mono)', transition:'border-color 0.15s',
            }}
          />
          {query && (
            <button onClick={() => { setQuery(''); clearSearch() }} style={{
              position:'absolute', right:8, background:'none', border:'none',
              color:'var(--text-3)', cursor:'pointer', fontSize:16, lineHeight:1, padding:0,
            }}>×</button>
          )}
        </div>

        {/* Quick pick chips */}
        <div style={{ display:'flex', gap:3, flexShrink:0, flexWrap:'nowrap', overflowX:'auto' }}>
          {QUICK.map(item => {
            const cfg = TYPE_CFG[item.type] || TYPE_CFG.EQUITY
            return (
              <button key={item.label}
                onMouseDown={e => { e.preventDefault(); pick(item) }}
                style={{
                  padding:'4px 9px', fontSize:9, borderRadius:4, cursor:'pointer',
                  fontWeight:700, letterSpacing:'0.03em', whiteSpace:'nowrap',
                  background:cfg.bg, color:cfg.color,
                  border:`1px solid ${cfg.color}35`,
                  transition:'all 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = cfg.color; e.currentTarget.style.color = '#0a0b0f' }}
                onMouseLeave={e => { e.currentTarget.style.background = cfg.bg;    e.currentTarget.style.color = cfg.color  }}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Dropdown ── */}
      {open && flatList.length > 0 && (
        <div style={{
          position:'absolute', top:'100%', left:10, right:10, zIndex:3000,
          background:'var(--bg-1)', border:'1px solid var(--border)',
          borderRadius:7, overflow:'hidden',
          boxShadow:'0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,107,43,0.08)',
          maxHeight:460, overflowY:'auto',
        }}>
          {/* Type group header tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--bg-3)', position:'sticky', top:0, zIndex:1 }}>
            {Object.entries(grouped).map(([type, items]) => {
              const cfg = TYPE_CFG[type] || TYPE_CFG.EQUITY
              return (
                <div key={type} style={{
                  padding:'5px 12px', fontSize:8, fontWeight:700, letterSpacing:'0.1em',
                  color:cfg.color, borderRight:'1px solid var(--border)',
                  background:`${cfg.color}08`,
                  display:'flex', alignItems:'center', gap:5,
                }}>
                  <span style={{ padding:'1px 4px', borderRadius:2, background:cfg.bg, fontSize:7 }}>{cfg.badge}</span>
                  {cfg.label} <span style={{ opacity:0.5 }}>({items.length})</span>
                </div>
              )
            })}
            <div style={{ marginLeft:'auto', padding:'5px 10px', fontSize:8, color:'var(--text-3)', display:'flex', alignItems:'center' }}>
              {flatList.length} results · ↑↓ navigate · ↵ select
            </div>
          </div>

          {/* Results */}
          {Object.entries(grouped).map(([type, items]) => {
            const cfg = TYPE_CFG[type] || TYPE_CFG.EQUITY
            return (
              <div key={type}>
                {items.map((item) => {
                  const myIdx = flatList.indexOf(item)
                  const isHov = hovered === myIdx
                  const sym   = (item.symbol||'').replace('.NS','').replace('.BO','').replace('^','')
                  const name  = item.displayName || item.display_name || item.name || sym
                  const px    = item.price   || 0
                  const pct   = item.change_pct || 0
                  return (
                    <div key={myIdx}
                      onMouseDown={e => { e.preventDefault(); pick(item) }}
                      onMouseEnter={() => setHovered(myIdx)}
                      style={{
                        padding:'8px 14px', cursor:'pointer',
                        display:'flex', justifyContent:'space-between', alignItems:'center',
                        borderBottom:'1px solid rgba(30,37,53,0.5)',
                        background: isHov ? 'rgba(255,107,43,0.06)' : 'transparent',
                        borderLeft: isHov ? '2px solid var(--orange)' : '2px solid transparent',
                        transition:'all 0.08s',
                      }}
                    >
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:8, padding:'2px 5px', borderRadius:3, fontWeight:800, background:cfg.bg, color:cfg.color, flexShrink:0, minWidth:24, textAlign:'center' }}>
                          {cfg.badge}
                        </span>
                        <div>
                          <div style={{ fontSize:12, color:'var(--text-0)', fontWeight:700, fontFamily:'var(--font-mono)' }}>
                            {sym}
                            {item.exchange && <span style={{ fontSize:9, color:'var(--text-3)', fontWeight:400, marginLeft:6 }}>{item.exchange}</span>}
                          </div>
                          {name !== sym && (
                            <div style={{ fontSize:9, color:'var(--text-3)', marginTop:1 }}>
                              {name}{item.sector && item.sector !== 'N/A' ? ` · ${item.sector}` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        {px > 0 && (
                          <>
                            <div style={{ fontSize:12, color:'var(--text-0)', fontFamily:'var(--font-mono)', fontWeight:600 }}>
                              ₹{px.toLocaleString('en-IN', { maximumFractionDigits: px < 10 ? 4 : 2 })}
                            </div>
                            <div style={{ fontSize:9, color: pct >= 0 ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>
                              {pct >= 0 ? '▲' : '▼'}{Math.abs(pct).toFixed(2)}%
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
