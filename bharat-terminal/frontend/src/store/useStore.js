import { create } from 'zustand'
import axios from 'axios'

export const API = '/api'
const ax = axios.create({ baseURL: API, timeout: 15000 })

export const useStore = create((set, get) => ({
  quotes:           {},
  indices:          [],
  selectedSymbol:   'RELIANCE',
  selectedExchange: 'NSE',
  selectedType:     'EQUITY',   // EQUITY | COMMODITY | INDEX | CURRENCY
  selectedMeta:     null,       // extra info (commodity unit, etc)
  marketOpen:       false,
  marketTime:       '',
  news:             [],
  searchResults:    [],
  backendOnline:    false,

  updateQuote: (q) => {
    if (!q?.symbol || !q?.price) return
    set(s => ({ quotes: { ...s.quotes, [q.symbol]: q } }))
  },

  // selectSymbol supports stocks, commodities, indices, currencies
  selectSymbol: (symbol, exchange='NSE', displayName=null, meta=null) => {
    const type = meta?.type || (exchange==='MCX'||exchange==='NCDEX' ? 'COMMODITY' : 'EQUITY')
    set({
      selectedSymbol:   symbol,
      selectedExchange: exchange,
      selectedType:     type,
      selectedMeta:     meta ? { ...meta, displayName: displayName || symbol } : null,
    })
  },

  _failCount: 0,
  checkBackend: async () => {
    try {
      await ax.get('/market/status', { timeout: 6000 })
      get()._failCount = 0
      set({ backendOnline: true })
    } catch {
      const fc = (get()._failCount || 0) + 1
      get()._failCount = fc
      // Only go offline after 3 consecutive failures to avoid flicker
      if (fc >= 3) set({ backendOnline: false })
    }
  },

  fetchIndices: async () => {
    try {
      const [idxRes, statRes] = await Promise.all([
        ax.get('/market/indices'),
        ax.get('/market/status'),
      ])
      set({
        indices:    Array.isArray(idxRes.data) ? idxRes.data : [],
        marketOpen: statRes.data.market_open,
        marketTime: statRes.data.time_ist,
      })
    } catch (e) {
      console.warn('Indices:', e.message)
    }
  },

  fetchNews: async (symbol='') => {
    try {
      const { data } = await ax.get('/news', { params: { symbol, limit: 40 } })
      set({ news: data.articles || [] })
    } catch {}
  },

  search: async (q) => {
    if (!q.trim()) return set({ searchResults: [] })
    try {
      const { data } = await ax.get('/search', { params: { q } })
      set({ searchResults: Array.isArray(data) ? data : [] })
    } catch {}
  },
  clearSearch: () => set({ searchResults: [] }),
}))
