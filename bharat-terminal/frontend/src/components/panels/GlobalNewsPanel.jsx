import { useEffect, useState } from 'react'
import axios from 'axios'

const REGIONS = ['All','India','Global']
const SENTIMENTS = ['All','Positive','Negative','Neutral']

const S_STYLE = {
  Positive:{ color:'#00E5A0', bg:'rgba(0,229,160,0.1)'  },
  Negative:{ color:'#FF3B5C', bg:'rgba(255,59,92,0.1)'  },
  Neutral: { color:'#FFB800', bg:'rgba(255,184,0,0.08)' },
}

const SOURCE_REGION = {
  'Economic Times':'India','Moneycontrol':'India','Business Standard':'India',
  'LiveMint':'India','CNBCTV18':'India','Financial Express':'India',
  'Hindu Business':'India','Zee Business':'India',
  'Reuters':'Global','Bloomberg':'Global','CNBC World':'Global',
  'FT Markets':'Global','WSJ Markets':'Global','Investing.com':'Global','Yahoo Finance':'Global',
}

export default function GlobalNewsPanel() {
  const [articles,   setArticles]  = useState([])
  const [summary,    setSummary]   = useState(null)
  const [loading,    setLoading]   = useState(false)
  const [region,     setRegion]    = useState('All')
  const [sentiment,  setSentiment] = useState('All')
  const [searchQ,    setSearchQ]   = useState('')
  const [activeTab,  setActiveTab] = useState('feed')  // feed | heatmap

  const loadNews = async () => {
    setLoading(true)
    try {
      const [indiaRes, globalRes] = await Promise.allSettled([
        axios.get('/api/news', { params:{ limit:40 }, timeout:15000 }),
        axios.get('/api/news/global', { params:{ limit:20 }, timeout:15000 }),
      ])
      const india  = indiaRes.status  === 'fulfilled' ? (indiaRes.value.data.articles  || []) : []
      const global = globalRes.status === 'fulfilled' ? (globalRes.value.data.articles || []) : []
      const seen   = new Set()
      const all    = []
      for (const a of [...india, ...global]) {
        if (!seen.has(a.url)) { seen.add(a.url); all.push(a) }
      }
      all.sort((a,b) => (b.published||'').localeCompare(a.published||''))
      setArticles(all)
      // Overall sentiment
      const scores = all.map(a => a.score || 0)
      const avg = scores.length ? scores.reduce((s,v)=>s+v,0)/scores.length : 0
      setSummary({
        score: avg.toFixed(3),
        label: avg > 0.1 ? 'Bullish' : avg < -0.1 ? 'Bearish' : 'Neutral',
        india:  india.length,
        global: global.length,
        pos: all.filter(a=>a.sentiment==='Positive').length,
        neg: all.filter(a=>a.sentiment==='Negative').length,
      })
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadNews() }, [])
  useEffect(() => {
    const id = setInterval(loadNews, 120000)
    return () => clearInterval(id)
  }, [])

  let shown = articles
  if (region !== 'All')    shown = shown.filter(a => (a.region || SOURCE_REGION[a.source] || 'Global') === region)
  if (sentiment !== 'All') shown = shown.filter(a => a.sentiment === sentiment)
  if (searchQ)             shown = shown.filter(a => a.title?.toLowerCase().includes(searchQ.toLowerCase()) || a.source?.toLowerCase().includes(searchQ.toLowerCase()))

  // Source breakdown for heatmap
  const sourceMap = {}
  articles.forEach(a => {
    const src = a.source || 'Unknown'
    if (!sourceMap[src]) sourceMap[src] = { pos:0, neg:0, neu:0, total:0 }
    sourceMap[src].total++
    if (a.sentiment==='Positive') sourceMap[src].pos++
    else if (a.sentiment==='Negative') sourceMap[src].neg++
    else sourceMap[src].neu++
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg-2)' }}>
      {/* Header */}
      <div className="panel-header">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span className="panel-title">Global Market News</span>
          {summary && (
            <span style={{
              fontSize:9, padding:'2px 8px', borderRadius:3, fontWeight:700,
              ...S_STYLE[summary.label] || S_STYLE.Neutral,
              background: summary.label==='Bullish' ? S_STYLE.Positive.bg : summary.label==='Bearish' ? S_STYLE.Negative.bg : S_STYLE.Neutral.bg,
              color:      summary.label==='Bullish' ? S_STYLE.Positive.color : summary.label==='Bearish' ? S_STYLE.Negative.color : S_STYLE.Neutral.color,
            }}>{summary.label} {summary.score}</span>
          )}
        </div>
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          <button onClick={loadNews} className="btn" style={{ fontSize:9, padding:'2px 8px' }}>
            {loading ? '↻' : '↺'} Refresh
          </button>
          {['feed','sources'].map(t => (
            <button key={t} className={`btn ${activeTab===t?'active':''}`}
              onClick={() => setActiveTab(t)} style={{ fontSize:9, padding:'2px 8px', textTransform:'uppercase' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      {summary && (
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--bg-3)', flexShrink:0 }}>
          {[
            { label:'India', val:summary.india,  color:'#FF6B2B' },
            { label:'Global',val:summary.global, color:'#2979FF' },
            { label:'Positive',val:summary.pos,  color:'#00E5A0' },
            { label:'Negative',val:summary.neg,  color:'#FF3B5C' },
            { label:'Total',val:articles.length, color:'var(--text-0)' },
          ].map(({label,val,color}) => (
            <div key={label} style={{ flex:1, padding:'5px 4px', textAlign:'center', borderRight:'1px solid var(--border)' }}>
              <div style={{ fontSize:13, fontWeight:700, color, fontFamily:'var(--font-mono)' }}>{val}</div>
              <div style={{ fontSize:8, color:'var(--text-3)' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:8, padding:'6px 10px', borderBottom:'1px solid var(--border)', background:'var(--bg-3)', flexShrink:0, alignItems:'center' }}>
        {/* Region filter */}
        <div style={{ display:'flex', gap:2 }}>
          {REGIONS.map(r => (
            <button key={r} className={`btn ${region===r?'active':''}`}
              onClick={() => setRegion(r)} style={{ fontSize:8, padding:'2px 7px' }}>
              {r === 'India' ? '🇮🇳 ' : r === 'Global' ? '🌐 ' : ''}{r}
            </button>
          ))}
        </div>
        <div style={{ width:'1px', height:14, background:'var(--border)' }}/>
        {/* Sentiment filter */}
        <div style={{ display:'flex', gap:2 }}>
          {SENTIMENTS.map(s => (
            <button key={s} className={`btn ${sentiment===s?'active':''}`}
              onClick={() => setSentiment(s)} style={{
                fontSize:8, padding:'2px 7px',
                color: sentiment===s && s!=='All' ? (S_STYLE[s]?.color||'#fff') : undefined,
                background: sentiment===s && s!=='All' ? S_STYLE[s]?.bg : undefined,
              }}>
              {s}
            </button>
          ))}
        </div>
        {/* Search */}
        <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
          placeholder="Search news…"
          style={{
            marginLeft:'auto', background:'var(--bg-4)', border:'1px solid var(--border)',
            borderRadius:3, padding:'3px 8px', fontSize:9, color:'var(--text-0)',
            outline:'none', width:140, fontFamily:'var(--font-mono)',
          }}
        />
      </div>

      {/* Content */}
      {activeTab === 'feed' && (
        <div className="scroll-y" style={{ flex:1, minHeight:0 }}>
          {loading && shown.length === 0 && <div className="loading">Fetching global news…</div>}
          {!loading && shown.length === 0 && <div className="loading" style={{ color:'var(--text-3)' }}>No articles found</div>}
          {shown.map((a, i) => {
            const ss = S_STYLE[a.sentiment] || S_STYLE.Neutral
            const aRegion = a.region || SOURCE_REGION[a.source] || 'Global'
            return (
              <div key={i}
                onClick={() => a.url && a.url !== '#' && window.open(a.url,'_blank')}
                style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', cursor:'pointer', display:'flex', gap:10 }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                {/* Sentiment stripe */}
                <div style={{ width:3, flexShrink:0, alignSelf:'stretch', borderRadius:2, background:ss.color, opacity:0.7 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, color:'var(--text-0)', lineHeight:1.5, marginBottom:5, fontFamily:'var(--font-sans)' }}>
                    {a.title}
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                    {/* Region badge */}
                    <span style={{
                      fontSize:8, padding:'1px 5px', borderRadius:2, fontWeight:600,
                      background: aRegion==='India' ? 'rgba(255,107,43,0.12)':'rgba(41,121,255,0.12)',
                      color:      aRegion==='India' ? '#FF6B2B':'#2979FF',
                    }}>
                      {aRegion==='India'?'🇮🇳':'🌐'} {aRegion}
                    </span>
                    <span style={{ fontSize:9, color:'var(--text-2)', fontWeight:500 }}>{a.source}</span>
                    <span style={{ fontSize:9, color:'var(--text-3)' }}>{a.published}</span>
                    <span style={{ fontSize:8, padding:'1px 6px', borderRadius:2, fontWeight:700, background:ss.bg, color:ss.color }}>
                      {a.sentiment}
                    </span>
                    <span style={{ fontSize:8, color:'var(--text-3)' }}>
                      {a.score>0?'+':''}{a.score?.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
          {shown.length > 0 && (
            <div style={{ padding:'8px', textAlign:'center', fontSize:9, color:'var(--text-3)' }}>
              Showing {shown.length} of {articles.length} articles · Auto-refreshes every 2 min
            </div>
          )}
        </div>
      )}

      {/* Sources tab */}
      {activeTab === 'sources' && (
        <div className="scroll-y" style={{ flex:1, minHeight:0, padding:'10px' }}>
          <div style={{ fontSize:9, color:'var(--text-3)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.1em' }}>
            Sentiment by Source — {articles.length} total articles
          </div>
          {Object.entries(sourceMap).sort((a,b)=>b[1].total-a[1].total).map(([src, data]) => {
            const posPct = data.total > 0 ? data.pos/data.total*100 : 0
            const negPct = data.total > 0 ? data.neg/data.total*100 : 0
            const aRegion = SOURCE_REGION[src] || 'Global'
            return (
              <div key={src} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <span style={{ fontSize:8, padding:'1px 4px', borderRadius:2,
                      background: aRegion==='India'?'rgba(255,107,43,0.12)':'rgba(41,121,255,0.12)',
                      color:      aRegion==='India'?'#FF6B2B':'#2979FF', fontWeight:600 }}>
                      {aRegion==='India'?'🇮🇳':'🌐'}
                    </span>
                    <span style={{ fontSize:10, color:'var(--text-0)', fontWeight:500 }}>{src}</span>
                  </div>
                  <div style={{ fontSize:9, color:'var(--text-3)' }}>
                    {data.total} · <span style={{color:'#00E5A0'}}>{data.pos}▲</span> <span style={{color:'#FF3B5C'}}>{data.neg}▼</span>
                  </div>
                </div>
                <div style={{ height:6, background:'var(--bg-4)', borderRadius:3, overflow:'hidden', display:'flex' }}>
                  <div style={{ width:`${posPct}%`, background:'var(--green)', transition:'width 0.3s' }}/>
                  <div style={{ width:`${negPct}%`, background:'var(--red)', transition:'width 0.3s' }}/>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
