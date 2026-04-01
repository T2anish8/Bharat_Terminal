import { useEffect, useState } from 'react'
import { useStore } from './store/useStore'
import { useWebSocket } from './hooks/useWebSocket'
import TickerBar           from './components/widgets/TickerBar'
import SearchBar           from './components/widgets/SearchBar'
import Sidebar             from './components/panels/Sidebar'
import StockDetailPanel    from './components/panels/StockDetailPanel'
import MarketOverviewPanel from './components/panels/MarketOverviewPanel'
import NewsPanel           from './components/panels/NewsPanel'
import GlobalNewsPanel     from './components/panels/GlobalNewsPanel'
import LiveTradeTracker    from './components/panels/LiveTradeTracker'
import IndiaTradeMap       from './components/map/IndiaTradeMap'

const WS_SYMS = ['RELIANCE','TCS','HDFCBANK','INFY','ICICIBANK','SBIN','BHARTIARTL','KOTAKBANK','LT','AXISBANK']
const VIEWS   = ['Terminal','Trades','News','Map']

export default function App() {
  const { fetchIndices, checkBackend, backendOnline } = useStore()
  const [view, setView] = useState('Terminal')
  useWebSocket(WS_SYMS)

  useEffect(() => {
    checkBackend()
    const id = setInterval(checkBackend, 15000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (backendOnline) {
      fetchIndices()
      const id = setInterval(fetchIndices, 30000)
      return () => clearInterval(id)
    }
  }, [backendOnline])

  return (
    <div className="terminal-shell">

      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-logo">
          <span className="flag">🇮🇳</span>
          BHARAT TERMINAL
          <span style={{ color:'var(--text-3)', fontWeight:300, fontSize:10 }}>v2.0</span>
        </div>
        <div style={{ display:'flex', gap:3 }}>
          {VIEWS.map(v => (
            <button key={v} className={`btn ${view===v?'active':''}`} onClick={() => setView(v)}>
              {v === 'Trades' ? '⚡ ' : v === 'News' ? '🌐 ' : ''}{v}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center', fontSize:10 }}>
          <span style={{ color:'var(--orange)', fontSize:9 }}>NSE · BSE · MCX · NCDEX · MSE</span>
          <span style={{ display:'flex', alignItems:'center', gap:5,
            color: backendOnline ? 'var(--green)':'var(--red)' }}>
            <span style={{
              width:6, height:6, borderRadius:'50%',
              background: backendOnline ? 'var(--green)':'var(--red)',
              display:'inline-block',
              boxShadow: backendOnline ? '0 0 8px var(--green)':undefined,
            }}/>
            {backendOnline ? 'API Online':'API Offline'}
          </span>
          <span style={{ color:'var(--text-3)' }}>
            {new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
          </span>
        </div>
      </div>

      {!backendOnline && (
        <div style={{
          background:'rgba(255,59,92,0.08)', borderBottom:'1px solid rgba(255,59,92,0.25)',
          padding:'4px 16px', fontSize:10, color:'var(--red)',
          display:'flex', alignItems:'center', gap:8,
        }}>
          ⚠ Backend offline —
          <code style={{ color:'var(--yellow)', background:'var(--bg-3)', padding:'1px 8px', borderRadius:3 }}>
            cd backend &amp;&amp; python run.py
          </code>
        </div>
      )}

      <TickerBar />

      <div className="main-layout">
        <Sidebar />
        <div className="content-area">
          <SearchBar />

          {/* TERMINAL VIEW */}
          {view === 'Terminal' && (
            <div className="panel-grid">
              <StockDetailPanel />
              <MarketOverviewPanel />
              <NewsPanel />
            </div>
          )}

          {/* LIVE TRADES VIEW */}
          {view === 'Trades' && (
            <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0, height:'100%', gap:1, background:'var(--border)' }}>
              <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', height:'100%' }}>
                <LiveTradeTracker />
              </div>
              <div style={{ width:340, minWidth:340, overflow:'hidden', display:'flex', flexDirection:'column', height:'100%' }}>
                <MarketOverviewPanel />
              </div>
            </div>
          )}

          {/* GLOBAL NEWS VIEW */}
          {view === 'News' && (
            <div style={{ flex:1, overflow:'hidden' }}>
              <GlobalNewsPanel />
            </div>
          )}

          {/* MAP VIEW */}
          {view === 'Map' && (
            <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0, height:'100%', gap:1, background:'var(--border)' }}>
              <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', height:'100%' }}>
                <IndiaTradeMap />
              </div>
              <div style={{ width:320, minWidth:320, overflow:'hidden', display:'flex', flexDirection:'column', gap:1 }}>
                <MarketOverviewPanel />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
