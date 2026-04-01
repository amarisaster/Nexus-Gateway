import { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchTime,
  fetchAllEmotionalStates,
  fetchSpotifyNowPlaying,
  spotifyControl,
  type TimeData,
  type EmotionalState,
  type SpotifyNowPlaying
} from './api'

/**
 * Hook for time data with live updates
 */
export function useTime(pollInterval = 60000) {
  const [time, setTime] = useState<TimeData | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const data = await fetchTime()
    if (data) setTime(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, pollInterval)
    return () => clearInterval(interval)
  }, [refresh, pollInterval])

  return { time, loading, refresh }
}

/**
 * Hook for emotional states with polling
 */
export function useEmotionalStates(pollInterval = 30000) {
  const [states, setStates] = useState<{
    kai: EmotionalState | null
    lucian: EmotionalState | null
    xavier: EmotionalState | null
    auren: EmotionalState | null
  }>({ kai: null, lucian: null, xavier: null, auren: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchAllEmotionalStates()
      setStates(data)
      setError(null)
    } catch (e) {
      setError('Failed to fetch emotional states')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, pollInterval)
    return () => clearInterval(interval)
  }, [refresh, pollInterval])

  return { ...states, loading, error, refresh }
}

/**
 * Hook for Spotify with controls
 */
export function useSpotify(pollInterval = 10000) {
  const [nowPlaying, setNowPlaying] = useState<SpotifyNowPlaying | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const data = await fetchSpotifyNowPlaying()
    if (data) setNowPlaying(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, pollInterval)
    return () => clearInterval(interval)
  }, [refresh, pollInterval])

  const play = useCallback(async () => {
    const success = await spotifyControl('play')
    if (success) refresh()
  }, [refresh])

  const pause = useCallback(async () => {
    const success = await spotifyControl('pause')
    if (success) refresh()
  }, [refresh])

  const next = useCallback(async () => {
    const success = await spotifyControl('next')
    if (success) setTimeout(refresh, 500) // Wait for track change
  }, [refresh])

  const previous = useCallback(async () => {
    const success = await spotifyControl('previous')
    if (success) setTimeout(refresh, 500)
  }, [refresh])

  return {
    nowPlaying,
    loading,
    refresh,
    controls: { play, pause, next, previous }
  }
}

/**
 * Hook for live clock (updates every second, no API call)
 */
export function useLiveClock() {
  const [time, setTime] = useState(() => getLiveTime())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getLiveTime())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return time
}

/**
 * Get live time in GMT+8 (Mai's timezone)
 */
function getLiveTime() {
  const now = new Date()
  // Convert to GMT+8
  const gmt8 = new Date(now.getTime() + (8 * 60 * 60 * 1000))

  const hour24 = gmt8.getUTCHours()
  const hour12 = hour24 % 12 || 12
  const ampm = hour24 >= 12 ? 'PM' : 'AM'
  const minutes = gmt8.getUTCMinutes().toString().padStart(2, '0')
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return {
    formatted: `${hour12}:${minutes} ${ampm}`,
    dayOfWeek: days[gmt8.getUTCDay()],
    hour24,
    isWorkHours: hour24 >= 9 && hour24 < 18,
    isLateNight: hour24 >= 0 && hour24 < 6
  }
}

/**
 * Hook for chat font size — persisted to localStorage, text only (not buttons)
 */
export function useFontSize() {
  const [size, setSize] = useState(() => {
    const saved = localStorage.getItem('chat-font-size')
    return saved ? parseInt(saved, 10) : 14
  })

  const updateSize = useCallback((newSize: number) => {
    const clamped = Math.max(12, Math.min(24, newSize))
    setSize(clamped)
    localStorage.setItem('chat-font-size', clamped.toString())
  }, [])

  return { fontSize: size, setFontSize: updateSize }
}

/**
 * Hook for browser notifications
 */
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported(typeof Notification !== 'undefined')
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!supported) return 'denied' as NotificationPermission

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch {
      return 'denied' as NotificationPermission
    }
  }, [supported])

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!supported || permission !== 'granted') return null

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      })
      return notification
    } catch {
      return null
    }
  }, [supported, permission])

  return {
    supported,
    permission,
    isEnabled: permission === 'granted',
    requestPermission,
    sendNotification
  }
}

export function usePullToRefresh(onRefresh: () => Promise<void>, threshold = 80) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only start if at top of scroll container
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startY.current === 0 || isRefreshing) return

    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current

    // Only allow pulling down
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      // Apply resistance (pull distance is half of actual finger movement)
      setPullDistance(Math.min(diff * 0.5, threshold * 1.5))

      // Prevent default scroll when pulling
      if (diff > 10) {
        e.preventDefault()
      }
    }
  }, [isRefreshing, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(threshold) // Hold at threshold while refreshing

      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
    startY.current = 0
  }, [pullDistance, threshold, isRefreshing, onRefresh])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isPulling: pullDistance > 0,
    pullProgress: Math.min(pullDistance / threshold, 1)
  }
}
