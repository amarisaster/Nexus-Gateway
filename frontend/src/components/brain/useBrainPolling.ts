import { useEffect, useRef } from 'react'

export function useBrainPolling(refresh: () => Promise<void>, intervalMs: number = 5000) {
  const isFetchingRef = useRef(false)

  useEffect(() => {
    const id = window.setInterval(async () => {
      if (isFetchingRef.current) return
      isFetchingRef.current = true
      try {
        await refresh()
      } finally {
        isFetchingRef.current = false
      }
    }, intervalMs)

    return () => clearInterval(id)
  }, [refresh, intervalMs])
}
