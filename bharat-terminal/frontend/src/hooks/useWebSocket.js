import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'

export function useWebSocket(symbols = []) {
  const wsRef       = useRef(null)
  const updateQuote = useStore(s => s.updateQuote)
  const retryRef    = useRef(null)

  const connect = useCallback(() => {
    try {
      const host = window.location.host
      const sym  = symbols.join(',')
      const url  = `ws://${host}/ws${sym ? `?symbols=${sym}` : ''}`
      const ws   = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => console.log('WS connected')

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          // Handle quote updates
          if (msg.type === 'quote' && msg.data) updateQuote(msg.data)
          // Ping/connected messages are intentionally ignored — don't cause re-renders
        } catch {}
      }

      ws.onerror = () => { /* non-critical */ }

      ws.onclose = () => {
        // Reconnect after 8s
        retryRef.current = setTimeout(connect, 8000)
      }
    } catch {
      retryRef.current = setTimeout(connect, 8000)
    }
  }, [symbols.join(',')])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(retryRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return {}
}
