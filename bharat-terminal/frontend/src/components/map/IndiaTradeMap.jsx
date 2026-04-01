/**
 * BHARAT GLOBE — CesiumJS (CDN) photorealistic globe
 * Features:
 *  • Real satellite imagery (ArcGIS / OSM tiles)
 *  • Animated neon trade arcs Mumbai ↔ global hubs + inter-city
 *  • Live city markers with buy/sell glow rings
 *  • Live commodity exchange markers (NSE/BSE/MCX/NCDEX)
 *  • Live news pins — geocoded to city
 *  • Live trade flow ticker overlay
 *  • Bloomberg dark HUD panels
 *  • Click any entity → detail card
 */

import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

/* global Cesium */

// ── Constants ────────────────────────────────────────────────────────────
const INDIA_VIEW = { lon:78.9, lat:22.5, alt:4500000, heading:0, pitch:-45 }
const GLOBE_VIEW = { lon:78.9, lat:22.5, alt:16000000, heading:0, pitch:-60 }

// ── City data ─────────────────────────────────────────────────────────────
const CITIES = [
  { id:'mumbai',    name:'Mumbai',     lat:19.076, lon:72.877, color:'#FF6B2B', exchange:'BSE/NSE', sectors:'Banking·Finance·Energy',   stocks:['RELIANCE','HDFCBANK','SBIN'],  pop:'20.7M', type:'metro' },
  { id:'delhi',     name:'Delhi',      lat:28.613, lon:77.209, color:'#FF9500', exchange:'NSE',     sectors:'Telecom·Power·Infra',       stocks:['BHARTIARTL','NTPC','LT'],       pop:'32.9M', type:'metro' },
  { id:'bangalore', name:'Bangalore',  lat:12.971, lon:77.594, color:'#00E5A0', exchange:'NSE',     sectors:'IT·SaaS·Tech',              stocks:['INFY','WIPRO','TCS'],           pop:'13.2M', type:'metro' },
  { id:'hyderabad', name:'Hyderabad',  lat:17.385, lon:78.486, color:'#9C6FFF', exchange:'NSE',     sectors:'Pharma·Biotech·IT',         stocks:['DRREDDY','SUNPHARMA'],          pop:'10.5M', type:'metro' },
  { id:'chennai',   name:'Chennai',    lat:13.082, lon:80.270, color:'#FF5C8A', exchange:'BSE',     sectors:'Auto·FMCG·IT',             stocks:['MARUTI','HEROMOTOCO'],          pop:'11.2M', type:'metro' },
  { id:'kolkata',   name:'Kolkata',    lat:22.572, lon:88.363, color:'#2979FF', exchange:'CSE',     sectors:'Mining·Steel·FMCG',        stocks:['COALINDIA','ITC','SAIL'],        pop:'14.8M', type:'metro' },
  { id:'ahmedabad', name:'Ahmedabad',  lat:23.022, lon:72.571, color:'#FFB800', exchange:'NSE',     sectors:'Conglomerate·Cement',      stocks:['ADANIENT','ADANIPORTS'],         pop:'8.4M',  type:'metro' },
  { id:'pune',      name:'Pune',       lat:18.520, lon:73.856, color:'#FFB800', exchange:'BSE',     sectors:'NBFC·Auto·Finance',        stocks:['BAJFINANCE','BAJAJ-AUTO'],       pop:'7.4M',  type:'metro' },
  { id:'surat',     name:'Surat',      lat:21.170, lon:72.831, color:'#FF9500', exchange:'NSE',     sectors:'Metals·Textiles·Diamond',  stocks:['ADANIENT','VEDL'],              pop:'6.5M',  type:'city'  },
  { id:'jaipur',    name:'Jaipur',     lat:26.912, lon:75.787, color:'#FF3B5C', exchange:'NSE',     sectors:'Consumer·Gems·Tourism',    stocks:['TITAN','ASIANPAINT'],           pop:'3.9M',  type:'city'  },
  { id:'lucknow',   name:'Lucknow',    lat:26.846, lon:80.946, color:'#4FC3F7', exchange:'NSE',     sectors:'Sugar·FMCG·Banking',       stocks:['HINDUNILVR','ITC'],             pop:'3.7M',  type:'city'  },
  { id:'nagpur',    name:'Nagpur',     lat:21.145, lon:79.082, color:'#9C6FFF', exchange:'BSE',     sectors:'Steel·Cotton·Mining',      stocks:['JSWSTEEL','VEDL'],              pop:'2.9M',  type:'city'  },
  { id:'kochi',     name:'Kochi',      lat:9.931,  lon:76.267, color:'#00E5A0', exchange:'NSE',     sectors:'Spice·Port·Tourism',       stocks:['ITC','HDFCBANK'],               pop:'2.1M',  type:'city'  },
  { id:'vizag',     name:'Vizag',      lat:17.686, lon:83.218, color:'#4FC3F7', exchange:'NSE',     sectors:'Steel·Port·Pharma',        stocks:['JSWSTEEL','RITES'],             pop:'2.0M',  type:'city'  },
  { id:'indore',    name:'Indore',     lat:22.719, lon:75.857, color:'#FFB800', exchange:'NSE',     sectors:'Agri·FMCG·Textile',       stocks:['ITC','MARICO'],                 pop:'3.3M',  type:'city'  },
  { id:'chandigarh',name:'Chandigarh', lat:30.733, lon:76.779, color:'#4FC3F7', exchange:'NSE',     sectors:'FMCG·Banking·Pharma',      stocks:['BHARTIARTL','NESTLEIND'],        pop:'1.2M',  type:'city'  },
  { id:'patna',     name:'Patna',      lat:25.594, lon:85.137, color:'#FF9500', exchange:'NSE',     sectors:'Agri·FMCG·Sugar',          stocks:['ITC','DABUR'],                  pop:'2.4M',  type:'city'  },
  { id:'guwahati',  name:'Guwahati',   lat:26.144, lon:91.736, color:'#00E5A0', exchange:'NSE',     sectors:'Tea·Agri·Petroleum',       stocks:['ITC','HINDUNILVR'],             pop:'1.3M',  type:'city'  },
  { id:'bhopal',    name:'Bhopal',     lat:23.259, lon:77.412, color:'#4FC3F7', exchange:'BSE',     sectors:'Agri·FMCG·Industrial',    stocks:['HINDUNILVR','MARICO'],          pop:'2.4M',  type:'city'  },
  { id:'varanasi',  name:'Varanasi',   lat:25.317, lon:82.974, color:'#FF9500', exchange:'BSE',     sectors:'Textiles·Tourism·FMCG',    stocks:['ITC'],                          pop:'1.5M',  type:'city'  },
]

// ── Exchanges ──────────────────────────────────────────────────────────────
const EXCHANGES = [
  { name:'NSE',   fullName:'National Stock Exchange',  lat:19.110, lon:72.886, color:'#FF6B2B', type:'equity',    volume:'₹1.2L Cr/day',  icon:'📈' },
  { name:'BSE',   fullName:'Bombay Stock Exchange',    lat:18.929, lon:72.834, color:'#FFB800', type:'equity',    volume:'₹85K Cr/day',   icon:'🏛' },
  { name:'MCX',   fullName:'Multi Commodity Exchange', lat:19.060, lon:72.878, color:'#00E5A0', type:'commodity', volume:'₹45K Cr/day',   icon:'🥇' },
  { name:'NCDEX', fullName:'National Commodity Exchange',lat:19.115,lon:72.890,color:'#9C6FFF', type:'commodity', volume:'₹8K Cr/day',    icon:'🌾' },
  { name:'IIFCL', fullName:'India INX (GIFT City)',   lat:23.162, lon:72.678, color:'#4FC3F7', type:'intl',      volume:'$2.1B/day',     icon:'🌐' },
  { name:'DGCX',  fullName:'India Gold Exchange',     lat:22.308, lon:70.800, color:'#FFB800', type:'commodity', volume:'₹3K Cr/day',    icon:'💰' },
]

// ── Global hubs ────────────────────────────────────────────────────────────
const HUBS = [
  { name:'New York',   lat:40.712, lon:-74.006, color:'#4FC3F7' },
  { name:'London',     lat:51.507, lon:-0.127,  color:'#81C784' },
  { name:'Tokyo',      lat:35.689, lon:139.691, color:'#FF3B5C' },
  { name:'Singapore',  lat:1.352,  lon:103.820, color:'#FFB800' },
  { name:'Hong Kong',  lat:22.302, lon:114.177, color:'#FF6B2B' },
  { name:'Dubai',      lat:25.204, lon:55.270,  color:'#9C6FFF' },
  { name:'Frankfurt',  lat:50.110, lon:8.682,   color:'#00E5A0' },
  { name:'Shanghai',   lat:31.230, lon:121.473, color:'#FF3B5C' },
  { name:'Sydney',     lat:-33.868,lon:151.209, color:'#4FC3F7' },
  { name:'Seoul',      lat:37.566, lon:126.978, color:'#81C784' },
]

// ── Helpers ────────────────────────────────────────────────────────────────
const hex2cesium = (hex, a=1.0) => {
  const r=parseInt(hex.slice(1,3),16)/255
  const g=parseInt(hex.slice(3,5),16)/255
  const b=parseInt(hex.slice(5,7),16)/255
  return new Cesium.Color(r,g,b,a)
}
const FMT  = n => n>=1e6?`${(n/1e6).toFixed(2)}M`:n>=1e3?`${(n/1e3).toFixed(1)}K`:String(n||0)
const FMTV = v => v>=1000?`₹${(v/1000).toFixed(1)}K Cr`:`₹${(+v||0).toFixed(0)} Cr`

// Arc midpoint elevated
function arcPositions(lat1,lon1,lat2,lon2,steps=80,height=800000){
  const pts=[]
  for(let i=0;i<=steps;i++){
    const t=i/steps
    const lat=lat1+(lat2-lat1)*t
    const lon=lon1+(lon2-lon1)*t
    const h=Math.sin(t*Math.PI)*height
    pts.push(Cesium.Cartesian3.fromDegrees(lon,lat,h))
  }
  return pts
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function IndiaTradeMap() {
  const cesiumContainer = useRef(null)
  const viewerRef  = useRef(null)
  const wsRef      = useRef(null)
  const arcTimers  = useRef([])

  const [cityStats,  setCityStats]  = useState({})
  const [indices,    setIndices]    = useState([])
  const [news,       setNews]       = useState([])
  const [tradeFlow,  setTradeFlow]  = useState([])
  const [selEntity,  setSelEntity]  = useState(null)  // {type,data,stats}
  const [sortBy,     setSortBy]     = useState('volume')
  const [liveArcs,   setLiveArcs]   = useState(true)
  const [showExch,   setShowExch]   = useState(true)
  const [showNews,   setShowNews]   = useState(true)
  const [viewMode,   setViewMode]   = useState('india')
  const [tradeCount, setTradeCount] = useState(0)
  const [commodities,setCommodities]= useState([])

  const liveArcsRef  = useRef(true)
  const showExchRef  = useRef(true)
  const showNewsRef  = useRef(true)
  useEffect(()=>{ liveArcsRef.current=liveArcs },[liveArcs])
  useEffect(()=>{ showExchRef.current=showExch },[showExch])
  useEffect(()=>{ showNewsRef.current=showNews },[showNews])

  // ── Init Cesium ──────────────────────────────────────────────────────────
  useEffect(()=>{
    if(!cesiumContainer.current || viewerRef.current) return
    if(typeof Cesium === 'undefined'){
      console.error('[BharatGlobe] Cesium not loaded — check CDN in index.html')
      return
    }

    // No Ion token needed - using free tile providers only

    // Use UrlTemplateImageryProvider — works with any XYZ tile URL, no deprecated APIs
    const osmProvider = new Cesium.UrlTemplateImageryProvider({
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      maximumLevel: 19,
      credit: new Cesium.Credit('© OpenStreetMap contributors'),
    })

    const viewer = new Cesium.Viewer(cesiumContainer.current, {
      imageryProvider:      osmProvider,
      terrainProvider:      new Cesium.EllipsoidTerrainProvider(),
      baseLayerPicker:      false,
      geocoder:             false,
      homeButton:           false,
      sceneModePicker:      false,
      navigationHelpButton: false,
      animation:            false,
      timeline:             false,
      fullscreenButton:     false,
      infoBox:              false,
      selectionIndicator:   false,
      shadows:              false,
      shouldAnimate:        true,
    })

    viewer.resolutionScale = Math.min(window.devicePixelRatio || 1.0, 2.0)
    viewer.useDefaultRenderLoop = true

    // ── Try upgrading to satellite tiles async (won't crash if fails) ───
    setTimeout(()=>{
      try {
        const satProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maximumLevel: 19,
          credit: new Cesium.Credit('Esri World Imagery'),
        })
        const satLayer = viewer.imageryLayers.addImageryProvider(satProvider)
        satLayer.alpha = 1.0
        // Once satellite loads, hide OSM
        satProvider.readyPromise?.then?.(()=>{
          if(viewer.imageryLayers.length > 1) {
            viewer.imageryLayers.get(0).show = false
          }
        }).catch(()=>{})
      } catch(e) { /* keep OSM */ }
    }, 500)

    // ── Globe visual settings ──────────────────────────────────────────
    viewer.scene.backgroundColor        = Cesium.Color.fromCssColorString('#000510')
    viewer.scene.globe.enableLighting   = false   // always fully lit, no dark side
    viewer.scene.globe.showGroundAtmosphere = true
    viewer.scene.globe.baseColor        = Cesium.Color.fromCssColorString('#1a4a8a')
    viewer.scene.skyAtmosphere.show     = true
    viewer.scene.fog.enabled            = false
    viewer.scene.skyBox.show            = true
    viewer.scene.sun.show               = true
    viewer.scene.moon.show              = false
    viewer.scene.globe.showWaterEffect  = false

    viewerRef.current = viewer

    // ── Fly to India on load
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(INDIA_VIEW.lon, INDIA_VIEW.lat, INDIA_VIEW.alt),
      orientation: { heading:Cesium.Math.toRadians(0), pitch:Cesium.Math.toRadians(INDIA_VIEW.pitch), roll:0 },
      duration: 2,
    })

    // ── Add city markers
    CITIES.forEach(city=>{
      const c = hex2cesium(city.color)

      // Glowing point
      viewer.entities.add({
        id: `city_${city.id}`,
        name: city.name,
        position: Cesium.Cartesian3.fromDegrees(city.lon, city.lat, 0),
        point: {
          pixelSize: city.type==='metro' ? 14 : 9,
          color: c,
          outlineColor: Cesium.Color.WHITE.withAlpha(0.6),
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.8, 1.5e8, 0.4),
        },
        label: {
          text: city.name,
          font: city.type==='metro' ? 'bold 13px IBM Plex Mono, monospace' : '11px IBM Plex Mono, monospace',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          translucencyByDistance: new Cesium.NearFarScalar(2e6, 1.0, 1.2e7, 0.0),
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.2, 1.5e7, 0.5),
        },
        _bharat: { type:'city', data:city },
      })

      // Pulse ring — outer circle
      viewer.entities.add({
        id: `pulse_${city.id}`,
        position: Cesium.Cartesian3.fromDegrees(city.lon, city.lat, 0),
        ellipse: {
          semiMajorAxis: city.type==='metro' ? 45000 : 28000,
          semiMinorAxis: city.type==='metro' ? 45000 : 28000,
          material: hex2cesium(city.color, 0.15),
          outline: true,
          outlineColor: hex2cesium(city.color, 0.7),
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      })
    })

    // ── Add exchange markers
    EXCHANGES.forEach(ex=>{
      viewer.entities.add({
        id: `exchange_${ex.name}`,
        name: `${ex.name} — ${ex.fullName}`,
        position: Cesium.Cartesian3.fromDegrees(ex.lon, ex.lat, 0),
        billboard: {
          image: createExchangeIcon(ex.icon, ex.color),
          width: 36,
          height: 36,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(5e5, 1.5, 5e7, 0.3),
        },
        label: {
          text: ex.name,
          font: 'bold 11px IBM Plex Mono, monospace',
          fillColor: hex2cesium(ex.color),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -42),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          translucencyByDistance: new Cesium.NearFarScalar(1e6, 1.0, 8e6, 0.0),
        },
        _bharat: { type:'exchange', data:ex },
      })
    })

    // ── Add global hub markers (small dots)
    HUBS.forEach(hub=>{
      viewer.entities.add({
        id: `hub_${hub.name}`,
        name: hub.name,
        position: Cesium.Cartesian3.fromDegrees(hub.lon, hub.lat, 0),
        point: {
          pixelSize: 8,
          color: hex2cesium(hub.color),
          outlineColor: Cesium.Color.WHITE.withAlpha(0.4),
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.5, 2e8, 0.6),
        },
        label: {
          text: hub.name,
          font: '10px IBM Plex Mono, monospace',
          fillColor: hex2cesium(hub.color),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          translucencyByDistance: new Cesium.NearFarScalar(5e6, 1.0, 5e7, 0.0),
        },
        _bharat: { type:'hub', data:hub },
      })
    })

    // ── Initial trade arcs Mumbai → all hubs
    const mum = CITIES[0]
    HUBS.forEach((hub, i)=>{
      setTimeout(()=> spawnArc(viewer, mum, hub, hub.color, 900000, 8000), i*400)
    })

    // ── Periodic new arcs
    const arcInterval = setInterval(()=>{
      if(!liveArcsRef.current) return
      const hub = HUBS[Math.floor(Math.random()*HUBS.length)]
      spawnArc(viewer, mum, hub, hub.color, 900000, 7000)
      // random inter-city arc
      const c1=CITIES[Math.floor(Math.random()*8)], c2=CITIES[1+Math.floor(Math.random()*7)]
      if(c1.id!==c2.id) spawnArc(viewer, c1, c2, c1.color, 250000, 5000)
    }, 3000)
    arcTimers.current.push(arcInterval)

    // ── Click handler
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction(movement=>{
      const picked = viewer.scene.pick(movement.position)
      if(Cesium.defined(picked) && picked.id && picked.id._bharat){
        const {type,data} = picked.id._bharat
        setSelEntity({type,data})
      } else {
        setSelEntity(null)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    return ()=>{
      arcTimers.current.forEach(clearInterval)
      handler.destroy()
      if(!viewer.isDestroyed()) viewer.destroy()
      viewerRef.current = null
    }
  },[])

  // ── Animate pulse rings ──────────────────────────────────────────────────
  useEffect(()=>{
    const interval = setInterval(()=>{
      if(!viewerRef.current) return
      const viewer = viewerRef.current
      CITIES.forEach((city,i)=>{
        const ent = viewer.entities.getById(`pulse_${city.id}`)
        if(!ent) return
        const t = (Date.now()/1000 + i*0.3) % 1
        const scale = 0.5 + t*1.5
        const alpha = (1-t)*0.4
        const base = city.type==='metro' ? 45000 : 28000
        ent.ellipse.semiMajorAxis = base * scale
        ent.ellipse.semiMinorAxis = base * scale
        ent.ellipse.material = hex2cesium(city.color, alpha)
        ent.ellipse.outlineColor = hex2cesium(city.color, (1-t)*0.8)
      })
    }, 60)
    return ()=> clearInterval(interval)
  },[])

  // ── Update city point glow from live stats ──────────────────────────────
  useEffect(()=>{
    if(!viewerRef.current || Object.keys(cityStats).length===0) return
    const viewer = viewerRef.current
    CITIES.forEach(city=>{
      const ent = viewer.entities.getById(`city_${city.id}`)
      if(!ent) return
      const s = cityStats[city.name]
      if(!s) return
      const bp = s.buy_pct||50
      const glowColor = bp>52 ? '#00E5A0' : bp<48 ? '#FF3B5C' : city.color
      ent.point.color = hex2cesium(glowColor)
    })
  },[cityStats])

  // ── News pins ────────────────────────────────────────────────────────────
  useEffect(()=>{
    if(!viewerRef.current || news.length===0) return
    const viewer = viewerRef.current
    // Remove old news pins
    const toRemove = viewer.entities.values.filter(e=>e.id?.startsWith?.('news_'))
    toRemove.forEach(e=> viewer.entities.remove(e))
    if(!showNewsRef.current) return

    news.slice(0,12).forEach((item,i)=>{
      // Geocode to closest city keyword match
      const city = CITIES.find(c=> (item.title||'').toLowerCase().includes(c.name.toLowerCase()))
        || CITIES[i % CITIES.length]
      const offset = (i % 4)*0.4
      viewer.entities.add({
        id: `news_${i}`,
        position: Cesium.Cartesian3.fromDegrees(city.lon+offset, city.lat+0.3, 80000),
        billboard: {
          image: createNewsIcon(),
          width: 22, height: 22,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 2.0, 1e7, 0.5),
        },
        label: {
          text: (item.title||'').slice(0,28)+'…',
          font: '9px IBM Plex Mono, monospace',
          fillColor: Cesium.Color.fromCssColorString('#FFB800'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -28),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          translucencyByDistance: new Cesium.NearFarScalar(5e5, 1.0, 3e6, 0.0),
        },
        _bharat: { type:'news', data:item },
      })
    })
  },[news, showNews])

  // ── Exchange visibility ──────────────────────────────────────────────────
  useEffect(()=>{
    if(!viewerRef.current) return
    const viewer = viewerRef.current
    EXCHANGES.forEach(ex=>{
      const ent = viewer.entities.getById(`exchange_${ex.name}`)
      if(ent) { ent.show = showExch }
    })
  },[showExch])

  // ── View buttons ─────────────────────────────────────────────────────────
  useEffect(()=>{
    if(!viewerRef.current) return
    const viewer = viewerRef.current
    if(viewMode==='india'){
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(INDIA_VIEW.lon, INDIA_VIEW.lat, INDIA_VIEW.alt),
        orientation: { heading:0, pitch:Cesium.Math.toRadians(INDIA_VIEW.pitch), roll:0 },
        duration: 2,
      })
    } else {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(GLOBE_VIEW.lon, GLOBE_VIEW.lat, GLOBE_VIEW.alt),
        orientation: { heading:0, pitch:Cesium.Math.toRadians(GLOBE_VIEW.pitch), roll:0 },
        duration: 2.5,
      })
    }
  },[viewMode])

  // ── Data polling ─────────────────────────────────────────────────────────
  useEffect(()=>{
    const fetchAll = ()=>{
      axios.get('/api/trades/city-stats',{timeout:5000}).then(r=>r.data&&setCityStats(r.data)).catch(()=>{})
      axios.get('/api/market/indices',{timeout:12000}).then(r=>setIndices(Array.isArray(r.data)?r.data.slice(0,8):[])).catch(()=>{})
      axios.get('/api/news',{timeout:8000}).then(r=>setNews(Array.isArray(r.data)?r.data.slice(0,12):[])).catch(()=>{})
      axios.get('/api/market/commodities',{timeout:8000}).then(r=>setCommodities(Array.isArray(r.data)?r.data.slice(0,8):[])).catch(()=>{})
    }
    fetchAll()
    const id = setInterval(fetchAll, 5000)
    return ()=> clearInterval(id)
  },[])

  // ── Live trade WebSocket ──────────────────────────────────────────────────
  useEffect(()=>{
    let t=0
    const connect=()=>{
      const ws=new WebSocket(`ws://${window.location.host}/api/trades/ws`)
      wsRef.current=ws
      ws.onmessage=e=>{
        try{
          const msg=JSON.parse(e.data); if(msg.type!=='trades') return
          setTradeCount(c=>c+(msg.data?.length||0)); t++
          if(t%4!==0 || !liveArcsRef.current || !viewerRef.current) return
          const viewer=viewerRef.current
          for(const tr of (msg.data||[])){
            if(tr.value>300000&&Math.random()<0.2){
              const fc=CITIES.find(c=>c.name===tr.city)||CITIES[0]
              const tc=CITIES[1+Math.floor(Math.random()*7)]
              if(fc.id!==tc.id) spawnArc(viewer,fc,tc,fc.color,200000,4500)
            }
          }
          // Keep rolling trade flow
          setTradeFlow(prev=>[...(msg.data||[]).slice(0,3),...prev].slice(0,12))
        }catch{}
      }
      ws.onclose=()=>setTimeout(connect,3000)
    }
    connect()
    return()=>wsRef.current?.close()
  },[])

  // ── Sorted leaderboard ────────────────────────────────────────────────────
  const sorted = Object.entries(cityStats).sort((a,b)=>
    sortBy==='volume' ? (b[1].volume_cr||0)-(a[1].volume_cr||0) :
    sortBy==='trades' ? (b[1].trades||0)-(a[1].trades||0) :
    (b[1].buy_pct||50)-(a[1].buy_pct||50))
  const totT = Object.values(cityStats).reduce((s,c)=>s+(c.trades||0),0)
  const totV = Object.values(cityStats).reduce((s,c)=>s+(c.volume_cr||0),0)

  // ── UI helpers ────────────────────────────────────────────────────────────
  const selCity = selEntity?.type==='city' ? selEntity.data : null
  const selCityStats = selCity ? cityStats[selCity.name] : null
  const selEx   = selEntity?.type==='exchange' ? selEntity.data : null
  const selNews = selEntity?.type==='news' ? selEntity.data : null

  const panel = (ex={}) => ({
    position:'absolute', zIndex:100,
    background:'rgba(4,8,20,0.90)',
    border:'1px solid rgba(255,255,255,0.09)',
    borderRadius:10,
    backdropFilter:'blur(18px)',
    fontFamily:'IBM Plex Mono,monospace',
    boxShadow:'0 8px 40px rgba(0,0,0,0.8)',
    ...ex,
  })
  const btn = (on, c='#FF6B2B') => ({
    padding:'4px 11px', fontSize:9, borderRadius:4, cursor:'pointer',
    fontWeight:700, fontFamily:'monospace', letterSpacing:'0.04em', border:'none',
    background: on ? `${c}28` : 'rgba(255,255,255,0.05)',
    color: on ? c : 'rgba(255,255,255,0.38)',
    outline: `1px solid ${on ? c : 'rgba(255,255,255,0.10)'}`,
  })

  return (
    <div style={{width:'100%',height:'100%',position:'relative',background:'#000510',overflow:'hidden'}}>

      {/* ── Cesium container ── */}
      <div ref={cesiumContainer} style={{position:'absolute',inset:0,zIndex:1}}/>

      {/* ── TOPBAR ── */}
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:200,
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'6px 14px',gap:8,
        background:'rgba(4,8,20,0.92)',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'#FF6B2B',boxShadow:'0 0 10px #FF6B2B'}}/>
            <span style={{fontSize:12,fontWeight:800,color:'#FF6B2B',letterSpacing:'0.07em'}}>BHARAT GLOBE 3D</span>
          </div>
          <span style={{fontSize:9,color:'#FF3B5C',display:'flex',alignItems:'center',gap:4}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:'#FF3B5C',display:'inline-block',animation:'blink 1s infinite'}}/>
            LIVE · {FMT(tradeCount)}
          </span>
        </div>
        <div style={{display:'flex',gap:3,alignItems:'center'}}>
          <button style={btn(viewMode==='india')}       onClick={()=>setViewMode('india')}>🇮🇳 India</button>
          <button style={btn(viewMode==='globe','#4FC3F7')} onClick={()=>setViewMode('globe')}>🌍 Globe</button>
          <div style={{width:1,height:16,background:'rgba(255,255,255,0.1)',margin:'0 3px'}}/>
          <button style={btn(liveArcs,'#00E5A0')}   onClick={()=>setLiveArcs(p=>!p)}>⚡ ARCS</button>
          <button style={btn(showExch,'#FFB800')}   onClick={()=>setShowExch(p=>!p)}>🏛 EXCH</button>
          <button style={btn(showNews,'#FF9500')}   onClick={()=>setShowNews(p=>!p)}>📰 NEWS</button>
        </div>
      </div>

      {/* ── LEFT: NSE Indices + Commodities ── */}
      <div style={panel({top:54,left:12,padding:'12px 14px',minWidth:200,maxHeight:'55vh',overflowY:'auto'})}>
        <div style={{fontSize:8,color:'#FF6B2B',marginBottom:8,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.16em',
          display:'flex',alignItems:'center',gap:6}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:'#FF6B2B',boxShadow:'0 0 7px #FF6B2B',display:'inline-block'}}/>
          NSE Indices
        </div>
        {indices.length===0 && <div style={{fontSize:9,color:'rgba(255,255,255,0.22)',marginBottom:8}}>Connecting…</div>}
        {indices.map((idx,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',gap:10,marginBottom:5,
            paddingBottom:4,borderBottom:'1px solid rgba(255,255,255,0.04)',alignItems:'center'}}>
            <span style={{fontSize:9,color:'rgba(255,255,255,0.45)',maxWidth:90,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {(idx.name||'').replace(/NIFTY /i,'').slice(0,10)}
            </span>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:9,color:'#E8F0FF',fontWeight:700}}>
                {(+idx.price||0).toLocaleString('en-IN',{maximumFractionDigits:0})}
              </div>
              <div style={{fontSize:8,fontWeight:700,color:(idx.change_pct||0)>=0?'#00E5A0':'#FF3B5C'}}>
                {(idx.change_pct||0)>=0?'▲':'▼'}{Math.abs(idx.change_pct||0).toFixed(2)}%
              </div>
            </div>
          </div>
        ))}

        {/* Commodities */}
        {commodities.length>0&&<>
          <div style={{fontSize:8,color:'#00E5A0',margin:'10px 0 6px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.14em',
            display:'flex',alignItems:'center',gap:6}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#00E5A0',boxShadow:'0 0 6px #00E5A0',display:'inline-block'}}/>
            MCX Commodities
          </div>
          {commodities.map((c,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',gap:8,marginBottom:4,
              paddingBottom:3,borderBottom:'1px solid rgba(255,255,255,0.04)',alignItems:'center'}}>
              <span style={{fontSize:9,color:'rgba(255,255,255,0.45)',maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {c.name||c.symbol||''}
              </span>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:9,color:'#E8F0FF',fontWeight:700}}>
                  {(+c.price||0).toLocaleString('en-IN',{maximumFractionDigits:0})}
                </div>
                <div style={{fontSize:8,fontWeight:700,color:(c.change_pct||0)>=0?'#00E5A0':'#FF3B5C'}}>
                  {(c.change_pct||0)>=0?'▲':'▼'}{Math.abs(c.change_pct||0).toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </>}

        <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          {[{l:'Trades',v:FMT(totT),c:'#E8F0FF'},{l:'Volume',v:FMTV(totV),c:'#FF6B2B'}].map(({l,v,c})=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontSize:8,color:'rgba(255,255,255,0.28)'}}>{l}</span>
              <span style={{fontSize:9,fontWeight:700,color:c}}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: City Leaderboard ── */}
      <div style={panel({top:54,right:12,padding:'12px 13px',minWidth:225,maxHeight:'72vh',display:'flex',flexDirection:'column'})}>
        <div style={{fontSize:8,color:'#FF6B2B',marginBottom:7,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.14em',
          display:'flex',alignItems:'center',gap:6}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:'#FF6B2B',boxShadow:'0 0 7px #FF6B2B',display:'inline-block'}}/>
          City Leaderboard
        </div>
        <div style={{display:'flex',gap:2,marginBottom:7}}>
          {[['volume','VOL'],['trades','TRD'],['buy','BUY%']].map(([k,l])=>(
            <button key={k} onClick={()=>setSortBy(k)} style={{
              flex:1,padding:'3px 0',fontSize:7,borderRadius:3,cursor:'pointer',fontWeight:700,
              fontFamily:'monospace',letterSpacing:'0.05em',border:'none',
              background:sortBy===k?'#FF6B2B':'rgba(255,255,255,0.05)',
              color:sortBy===k?'#fff':'rgba(255,255,255,0.35)',
            }}>{l}</button>
          ))}
        </div>
        <div style={{overflowY:'auto',flex:1}}>
          {sorted.slice(0,16).map(([city,s],rank)=>{
            const bp=s.buy_pct||50
            const meta=CITIES.find(c=>c.name===city)
            const isSel=selCity?.name===city
            return(
              <div key={city}
                onClick={()=>{
                  setSelEntity(isSel?null:{type:'city',data:meta})
                  if(!isSel&&meta&&viewerRef.current){
                    viewerRef.current.camera.flyTo({
                      destination:Cesium.Cartesian3.fromDegrees(meta.lon,meta.lat,800000),
                      orientation:{heading:0,pitch:Cesium.Math.toRadians(-40),roll:0},
                      duration:1.5,
                    })
                  }
                }}
                style={{padding:'5px 7px',marginBottom:2,borderRadius:6,cursor:'pointer',
                  background:isSel?'rgba(255,107,43,0.13)':'rgba(255,255,255,0.03)',
                  outline:`1px solid ${isSel?'rgba(255,107,43,0.45)':'rgba(255,255,255,0.05)'}`,
                  transition:'background 0.1s'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'}
                onMouseLeave={e=>e.currentTarget.style.background=isSel?'rgba(255,107,43,0.13)':'rgba(255,255,255,0.03)'}
              >
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <span style={{fontSize:8,color:'rgba(255,255,255,0.22)',minWidth:16}}>#{rank+1}</span>
                    <span style={{width:7,height:7,borderRadius:'50%',background:meta?.color||'#FF6B2B',
                      display:'inline-block',boxShadow:`0 0 6px ${meta?.color||'#FF6B2B'}`}}/>
                    <span style={{fontSize:10,fontWeight:700,color:'#F0F8FF'}}>{city}</span>
                  </div>
                  <span style={{fontSize:9,fontWeight:800,
                    color:bp>52?'#00E5A0':bp<48?'#FF3B5C':'#FFB800'}}>{bp}%</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontSize:7,color:'rgba(255,255,255,0.28)'}}>{FMT(s.trades||0)} trades</span>
                  <span style={{fontSize:7,color:'#FF9500',fontWeight:600}}>{FMTV(s.volume_cr||0)}</span>
                </div>
                <div style={{height:2.5,background:'rgba(255,255,255,0.08)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${bp}%`,borderRadius:2,transition:'width 0.5s',
                    background:bp>52?'linear-gradient(90deg,#00E5A0,#00b870)':
                               bp<48?'linear-gradient(90deg,#FF3B5C,#cc2040)':
                               'linear-gradient(90deg,#FFB800,#ff9000)'}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:2}}>
                  <span style={{fontSize:7,color:'rgba(255,255,255,0.22)'}}>{s.hot_stock||'—'}</span>
                  <span style={{fontSize:7,color:'rgba(255,150,60,0.7)'}}>{s.hot_sector||'—'}</span>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:6,marginTop:4}}>
          {[['#00E5A0','Bullish (>52%)'],['#FF3B5C','Bearish (<48%)'],['#FFB800','Neutral']].map(([c,l])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:c,display:'inline-block',boxShadow:`0 0 5px ${c}`}}/>
              <span style={{fontSize:7,color:'rgba(255,255,255,0.30)'}}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM LEFT: Live Trade Flow ── */}
      <div style={panel({bottom:12,left:12,padding:'10px 14px',minWidth:300,maxWidth:380})}>
        <div style={{fontSize:8,color:'#00E5A0',marginBottom:7,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.14em',
          display:'flex',alignItems:'center',gap:6}}>
          <span style={{width:5,height:5,borderRadius:'50%',background:'#00E5A0',boxShadow:'0 0 6px #00E5A0',display:'inline-block',animation:'blink 1s infinite'}}/>
          Live Trade Flow
        </div>
        {tradeFlow.length===0 && <div style={{fontSize:9,color:'rgba(255,255,255,0.22)'}}>Waiting for trades…</div>}
        {tradeFlow.slice(0,8).map((tr,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
            marginBottom:3,fontSize:9,opacity:1-i*0.09,
            paddingBottom:3,borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
            <span style={{color:'rgba(255,255,255,0.5)',minWidth:80}}>{tr.city||'—'}</span>
            <span style={{color:'#E8F0FF',fontWeight:700,minWidth:60,textAlign:'right'}}>{tr.symbol||'—'}</span>
            <span style={{color:tr.side==='BUY'?'#00E5A0':'#FF3B5C',fontWeight:700,minWidth:30,textAlign:'right'}}>
              {tr.side||'—'}
            </span>
            <span style={{color:'#FF9500',fontWeight:600,minWidth:60,textAlign:'right'}}>
              ₹{((tr.value||0)/1e5).toFixed(1)}L
            </span>
          </div>
        ))}
      </div>

      {/* ── BOTTOM CENTER: Exchange legend ── */}
      <div style={panel({bottom:12,left:'50%',transform:'translateX(-50%)',padding:'8px 16px'})}>
        <div style={{display:'flex',gap:14,alignItems:'center'}}>
          {EXCHANGES.map(ex=>(
            <div key={ex.name} style={{display:'flex',alignItems:'center',gap:4,fontSize:8}}>
              <span style={{fontSize:12}}>{ex.icon}</span>
              <div>
                <div style={{fontWeight:700,color:ex.color}}>{ex.name}</div>
                <div style={{fontSize:7,color:'rgba(255,255,255,0.3)'}}>{ex.volume}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM RIGHT: News ticker ── */}
      <div style={panel({bottom:12,right:12,padding:'10px 14px',minWidth:300,maxWidth:360})}>
        <div style={{fontSize:8,color:'#FFB800',marginBottom:7,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.14em',
          display:'flex',alignItems:'center',gap:6}}>
          <span style={{width:5,height:5,borderRadius:'50%',background:'#FFB800',boxShadow:'0 0 6px #FFB800',display:'inline-block'}}/>
          Live News Feed
        </div>
        {news.length===0 && <div style={{fontSize:9,color:'rgba(255,255,255,0.22)'}}>Fetching news…</div>}
        {news.slice(0,6).map((item,i)=>(
          <div key={i} style={{marginBottom:5,paddingBottom:4,borderBottom:'1px solid rgba(255,255,255,0.04)',cursor:'pointer'}}
            onClick={()=>setSelEntity({type:'news',data:item})}>
            <div style={{fontSize:9,color:'#F0F8FF',lineHeight:1.3,marginBottom:2,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title||'—'}</div>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span style={{fontSize:7,color:'#FFB800',opacity:0.7}}>{item.source||'—'}</span>
              <span style={{fontSize:7,color:'rgba(255,255,255,0.2)'}}>{item.published_ago||'—'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── DETAIL CARD: City ── */}
      {selCity&&(
        <div style={panel({
          top:'50%',left:'50%',transform:'translate(-50%,-50%)',
          padding:'20px 24px',width:560,zIndex:300,
          borderTop:`3px solid ${selCity.color}`,
          boxShadow:`0 32px 100px rgba(0,0,0,0.95), 0 0 60px ${selCity.color}18`
        })}>
          <button onClick={()=>setSelEntity(null)} style={{position:'absolute',top:12,right:16,
            background:'none',border:'none',color:'rgba(255,255,255,0.35)',cursor:'pointer',fontSize:22}}>×</button>
          <div style={{display:'flex',gap:14,alignItems:'flex-start',marginBottom:14}}>
            <div style={{width:52,height:52,borderRadius:12,flexShrink:0,
              background:`${selCity.color}18`,border:`2px solid ${selCity.color}40`,
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,
              boxShadow:`0 0 24px ${selCity.color}25`}}>📍</div>
            <div style={{flex:1}}>
              <div style={{fontSize:20,fontWeight:900,color:'#F0F8FF',letterSpacing:'-0.02em'}}>{selCity.name}</div>
              <div style={{fontSize:9,color:'rgba(255,255,255,0.38)',marginTop:3}}>{selCity.sectors}</div>
              <div style={{fontSize:8,color:selCity.color,marginTop:2}}>🏛 {selCity.exchange} · 👥 {selCity.pop}</div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontSize:26,fontWeight:900,lineHeight:1,
                color:(selCityStats?.buy_pct||50)>52?'#00E5A0':(selCityStats?.buy_pct||50)<48?'#FF3B5C':'#FFB800'}}>
                {selCityStats?.buy_pct||50}%
              </div>
              <div style={{fontSize:8,color:'rgba(255,255,255,0.28)',textTransform:'uppercase',letterSpacing:'0.08em',marginTop:2}}>Buy Pressure</div>
            </div>
          </div>
          <div style={{height:6,background:'rgba(255,255,255,0.07)',borderRadius:3,marginBottom:14,overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:3,transition:'width 0.6s',
              width:`${selCityStats?.buy_pct||50}%`,
              background:(selCityStats?.buy_pct||50)>52?'linear-gradient(90deg,#00E5A0,#00b870)':
                         (selCityStats?.buy_pct||50)<48?'linear-gradient(90deg,#FF3B5C,#cc2040)':
                         'linear-gradient(90deg,#FFB800,#ff9000)'}}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:1,
            background:'rgba(255,255,255,0.04)',borderRadius:8,overflow:'hidden',marginBottom:12}}>
            {[['Trades',FMT(selCityStats?.trades||0),'#F0F8FF'],
              ['Volume',FMTV(selCityStats?.volume_cr||0),'#FF6B2B'],
              ['Retail',`${selCityStats?.retail_pct||65}%`,'#00E5A0'],
              ['FII',`${selCityStats?.fii_pct||10}%`,'#2979FF']].map(([l,v,c])=>(
              <div key={l} style={{background:'rgba(3,6,18,0.7)',padding:'10px 8px',textAlign:'center'}}>
                <div style={{fontSize:15,fontWeight:900,color:c}}>{v}</div>
                <div style={{fontSize:7,color:'rgba(255,255,255,0.28)',marginTop:3,textTransform:'uppercase',letterSpacing:'0.1em'}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {(selCity.stocks||[]).map(s=>(
              <span key={s} style={{fontSize:8,padding:'3px 9px',borderRadius:4,
                background:'rgba(255,184,0,0.10)',color:'#FFB800',
                border:'1px solid rgba(255,184,0,0.22)',fontWeight:700}}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── DETAIL CARD: Exchange ── */}
      {selEx&&!selCity&&(
        <div style={panel({
          top:'50%',left:'50%',transform:'translate(-50%,-50%)',
          padding:'20px 24px',width:400,zIndex:300,
          borderTop:`3px solid ${selEx.color}`,
        })}>
          <button onClick={()=>setSelEntity(null)} style={{position:'absolute',top:12,right:16,
            background:'none',border:'none',color:'rgba(255,255,255,0.35)',cursor:'pointer',fontSize:22}}>×</button>
          <div style={{fontSize:22,marginBottom:8}}>{selEx.icon}</div>
          <div style={{fontSize:20,fontWeight:900,color:'#F0F8FF'}}>{selEx.name}</div>
          <div style={{fontSize:10,color:selEx.color,marginBottom:12}}>{selEx.fullName}</div>
          {[['Type',selEx.type.toUpperCase(),'#E8F0FF'],
            ['Daily Volume',selEx.volume,selEx.color],
            ['Segment',selEx.type==='equity'?'Equity & Derivatives':selEx.type==='commodity'?'Commodities':'International','#9C6FFF']].map(([l,v,c])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',marginBottom:8,
              paddingBottom:7,borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <span style={{fontSize:9,color:'rgba(255,255,255,0.35)'}}>{l}</span>
              <span style={{fontSize:10,fontWeight:700,color:c}}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── DETAIL CARD: News ── */}
      {selNews&&!selCity&&!selEx&&(
        <div style={panel({
          top:'50%',left:'50%',transform:'translate(-50%,-50%)',
          padding:'20px 24px',width:440,zIndex:300,
          borderTop:'3px solid #FFB800',
        })}>
          <button onClick={()=>setSelEntity(null)} style={{position:'absolute',top:12,right:16,
            background:'none',border:'none',color:'rgba(255,255,255,0.35)',cursor:'pointer',fontSize:22}}>×</button>
          <div style={{fontSize:8,color:'#FFB800',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.1em'}}>📰 Market News</div>
          <div style={{fontSize:14,fontWeight:700,color:'#F0F8FF',lineHeight:1.4,marginBottom:10}}>{selNews.title}</div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
            <span style={{fontSize:9,color:'#FFB800'}}>{selNews.source}</span>
            <span style={{fontSize:9,color:'rgba(255,255,255,0.3)'}}>{selNews.published_ago}</span>
          </div>
          {selNews.summary&&<div style={{fontSize:9,color:'rgba(255,255,255,0.5)',lineHeight:1.6}}>{selNews.summary}</div>}
          {selNews.url&&<a href={selNews.url} target="_blank" rel="noopener noreferrer"
            style={{display:'inline-block',marginTop:12,fontSize:9,color:'#FF6B2B',textDecoration:'none',
              border:'1px solid rgba(255,107,43,0.3)',padding:'4px 12px',borderRadius:4}}>
            Read full article →
          </a>}
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .cesium-widget-credits { display:none !important; }
        .cesium-viewer-bottom { display:none !important; }
      `}</style>
    </div>
  )
}

// ── Helpers to spawn arcs ─────────────────────────────────────────────────
function spawnArc(viewer, from, to, colorHex, height=600000, duration=6000) {
  const pts = arcPositions(from.lat, from.lon, to.lat, to.lon, 80, height)
  const r=parseInt(colorHex.slice(1,3),16)/255
  const g=parseInt(colorHex.slice(3,5),16)/255
  const b=parseInt(colorHex.slice(5,7),16)/255
  const color = new Cesium.Color(r,g,b,0.85)

  const arcId = `arc_${Date.now()}_${Math.random().toString(36).slice(2)}`
  viewer.entities.add({
    id: arcId,
    polyline: {
      positions: pts,
      width: 2.0,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.25,
        color: color,
      }),
      clampToGround: false,
      arcType: Cesium.ArcType.NONE,
    },
  })

  // Fade out and remove
  setTimeout(()=>{
    if(!viewer.isDestroyed()){
      const ent = viewer.entities.getById(arcId)
      if(ent) viewer.entities.remove(ent)
    }
  }, duration)
}

// ── Canvas icon generators ────────────────────────────────────────────────
function createExchangeIcon(emoji, colorHex) {
  const cv = document.createElement('canvas'); cv.width=64; cv.height=64
  const ctx = cv.getContext('2d')
  // Glow circle
  const r=parseInt(colorHex.slice(1,3),16)
  const g=parseInt(colorHex.slice(3,5),16)
  const b=parseInt(colorHex.slice(5,7),16)
  const grd = ctx.createRadialGradient(32,32,4,32,32,28)
  grd.addColorStop(0,`rgba(${r},${g},${b},0.9)`)
  grd.addColorStop(1,`rgba(${r},${g},${b},0.1)`)
  ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(32,32,28,0,Math.PI*2); ctx.fill()
  ctx.strokeStyle=`rgba(${r},${g},${b},0.8)`; ctx.lineWidth=2
  ctx.beginPath(); ctx.arc(32,32,26,0,Math.PI*2); ctx.stroke()
  // Emoji
  ctx.font='26px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'
  ctx.fillText(emoji,32,33)
  return cv.toDataURL()
}

function createNewsIcon() {
  const cv = document.createElement('canvas'); cv.width=32; cv.height=32
  const ctx = cv.getContext('2d')
  const grd = ctx.createRadialGradient(16,16,2,16,16,14)
  grd.addColorStop(0,'rgba(255,184,0,0.9)'); grd.addColorStop(1,'rgba(255,184,0,0.1)')
  ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(16,16,14,0,Math.PI*2); ctx.fill()
  ctx.font='16px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'
  ctx.fillText('📰',16,17)
  return cv.toDataURL()
}
