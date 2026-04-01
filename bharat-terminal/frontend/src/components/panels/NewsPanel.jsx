import { useEffect, useState } from 'react'
import { useStore } from '../../store/useStore'
import axios from 'axios'

const SENT_STYLE = {
  Positive:{ color:'#00E5A0', bg:'rgba(0,229,160,0.1)'  },
  Negative:{ color:'#FF3B5C', bg:'rgba(255,59,92,0.1)'  },
  Neutral: { color:'#FFB800', bg:'rgba(255,184,0,0.08)' },
}

export default function NewsPanel({ style }) {
  const { selectedSymbol } = useStore()
  const [articles, setArticles] = useState([])
  const [summary,  setSummary]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [filter,   setFilter]   = useState('All')

  const load = async (sym) => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/news', { params:{ symbol:sym||'', limit:50 }, timeout:15000 })
      setArticles(data.articles || [])
      setSummary(data.summary   || null)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load(selectedSymbol) }, [selectedSymbol])
  useEffect(() => {
    const id = setInterval(() => load(selectedSymbol), 120000)
    return () => clearInterval(id)
  }, [selectedSymbol])

  const filtered = filter === 'All' ? articles
    : articles.filter(a => a.sentiment === filter)

  const sentLabel = summary?.label || 'Neutral'
  const sentScore = summary?.score || 0

  return (
    <div className="panel" style={{ display:'flex', flexDirection:'column', ...style }}>
      <div className="panel-header">
        <span className="panel-title">News & Sentiment{selectedSymbol ? ` — ${selectedSymbol}` : ''}</span>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {summary && (
            <span style={{
              fontSize:9, padding:'2px 8px', borderRadius:3, fontWeight:700,
              ...SENT_STYLE[sentLabel] || SENT_STYLE.Neutral,
            }}>
              {sentLabel} {sentScore > 0 ? '+':''}{sentScore.toFixed(3)}
            </span>
          )}
          <span style={{ fontSize:9, color:'var(--text-3)' }}>{articles.length} articles</span>
        </div>
      </div>

      {/* Sentiment breakdown + filter */}
      {summary?.breakdown && (
        <div style={{
          display:'flex', gap:0, borderBottom:'1px solid var(--border)',
          background:'var(--bg-3)', flexShrink:0,
        }}>
          {[['All', articles.length, 'var(--text-3)'],
            ['Positive', summary.breakdown.positive, '#00E5A0'],
            ['Negative', summary.breakdown.negative, '#FF3B5C'],
            ['Neutral',  summary.breakdown.neutral,  '#FFB800'],
          ].map(([label, count, color]) => (
            <div key={label} onClick={() => setFilter(label)} style={{
              flex:1, padding:'5px 4px', textAlign:'center', cursor:'pointer',
              borderBottom: filter===label ? `2px solid ${color}` : '2px solid transparent',
              background: filter===label ? `${color}10` : 'transparent',
            }}>
              <div style={{ fontSize:12, fontWeight:700, color }}>{count}</div>
              <div style={{ fontSize:8, color:'var(--text-3)' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="scroll-y" style={{ flex:1 }}>
        {loading && <div className="loading">Fetching news…</div>}
        {!loading && filtered.length === 0 && (
          <div className="loading" style={{ color:'var(--text-3)' }}>
            {articles.length === 0 ? 'No news — backend may be loading' : 'No articles for this filter'}
          </div>
        )}
        {filtered.map((a, i) => {
          const ss = SENT_STYLE[a.sentiment] || SENT_STYLE.Neutral
          return (
            <div key={i} onClick={() => a.url && a.url !== '#' && window.open(a.url,'_blank')}
              style={{
                padding:'10px 14px', borderBottom:'1px solid var(--border)',
                cursor: a.url && a.url !== '#' ? 'pointer':'default',
                display:'flex', gap:10, alignItems:'flex-start',
              }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-3)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              {/* Sentiment bar */}
              <div style={{
                width:3, flexShrink:0, alignSelf:'stretch', borderRadius:2,
                background:ss.color, opacity:0.7,
              }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{
                  fontSize:11, color:'var(--text-0)', lineHeight:1.5, marginBottom:5,
                  fontFamily:'var(--font-sans)', fontWeight:400,
                }}>
                  {a.title}
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ fontSize:9, color:'var(--orange)', fontWeight:600 }}>{a.source}</span>
                  <span style={{ fontSize:9, color:'var(--text-3)' }}>{a.published}</span>
                  <span style={{
                    fontSize:8, padding:'1px 6px', borderRadius:2, fontWeight:700,
                    background:ss.bg, color:ss.color,
                  }}>{a.sentiment}</span>
                  {a.score !== undefined && (
                    <span style={{ fontSize:8, color:'var(--text-3)' }}>
                      {a.score > 0 ? '+':''}{a.score.toFixed(3)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
