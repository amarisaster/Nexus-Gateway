import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../lib/auth'
import { getConnectionStatuses, runDecay } from '../lib/api'
import type { ConnectionStatus } from '../lib/api'
import { usePullToRefresh, useNotifications, useFontSize } from '../lib/hooks'
import WallpaperPicker from '../components/chat/WallpaperPicker'

export default function Settings() {
  const { user, signOut } = useAuth()
  const [connections, setConnections] = useState<ConnectionStatus[]>([])
  const [connectionsLoading, setConnectionsLoading] = useState(true)
  const [decayStatus, setDecayStatus] = useState<{ kai?: string; lucian?: string; xavier?: string; auren?: string }>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Load connection statuses
  useEffect(() => {
    async function loadConnections() {
      setConnectionsLoading(true)
      const statuses = await getConnectionStatuses()
      setConnections(statuses)
      setConnectionsLoading(false)
      setLastRefresh(new Date())
    }
    loadConnections()
  }, [])

  // Refresh connections
  const refreshConnections = useCallback(async () => {
    setConnectionsLoading(true)
    const statuses = await getConnectionStatuses()
    setConnections(statuses)
    setConnectionsLoading(false)
    setLastRefresh(new Date())
  }, [])

  // Pull to refresh
  const { containerRef, pullDistance, isRefreshing, pullProgress } = usePullToRefresh(refreshConnections)

  // Font size
  const { fontSize, setFontSize } = useFontSize()

  // Wallpaper
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem('chat-wallpaper') || '')
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false)
  const handleWallpaperChange = (wp: string) => {
    setWallpaper(wp)
    if (wp) localStorage.setItem('chat-wallpaper', wp)
    else localStorage.removeItem('chat-wallpaper')
    setShowWallpaperPicker(false)
  }

  // Notifications
  const { supported: notifSupported, permission: notifPermission, isEnabled: notifEnabled, requestPermission } = useNotifications()

  // Run decay for a companion
  const handleDecay = async (companion: 'kai' | 'lucian' | 'xavier' | 'auren') => {
    setActionLoading(`decay-${companion}`)
    const result = await runDecay(companion)
    setDecayStatus(prev => ({ ...prev, [companion]: result.message }))
    setActionLoading(null)

    // Clear status after 3 seconds
    setTimeout(() => {
      setDecayStatus(prev => ({ ...prev, [companion]: undefined }))
    }, 3000)
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      {/* Pull to refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all"
          style={{ height: pullDistance }}
        >
          <div
            className={`flex items-center gap-2 text-sm text-[var(--color-text-muted)] ${isRefreshing ? 'animate-pulse' : ''}`}
            style={{ transform: `rotate(${pullProgress * 360}deg)` }}
          >
            {isRefreshing ? '✨' : pullProgress >= 1 ? '↓' : '↻'}
          </div>
          <span className="ml-2 text-xs text-[var(--color-text-muted)]">
            {isRefreshing ? 'Refreshing...' : pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">⚙️ Settings</h1>
        </header>

      {/* Connections */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Connections</h2>
          <button
            onClick={refreshConnections}
            disabled={connectionsLoading}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] disabled:opacity-50"
          >
            {connectionsLoading ? '...' : '↻ Refresh'}
          </button>
        </div>

        {connectionsLoading && connections.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">Checking connections...</p>
        ) : (
          <div className="space-y-3">
            {connections.map((conn) => (
              <div key={conn.name} className="flex justify-between items-center">
                <span className="text-sm">{conn.name}</span>
                <span className={`text-sm ${conn.connected ? 'text-green-400' : 'text-red-400'}`}>
                  {conn.connected ? '●' : '○'} {conn.details}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-4 mb-4">
        <h2 className="font-medium mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleDecay('kai')}
            disabled={actionLoading === 'decay-kai'}
            className="py-3 px-4 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-kai)]/20 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {actionLoading === 'decay-kai' ? '...' : decayStatus.kai || 'Run Decay 🩸'}
          </button>
          <button
            onClick={() => handleDecay('lucian')}
            disabled={actionLoading === 'decay-lucian'}
            className="py-3 px-4 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-lucian)]/20 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {actionLoading === 'decay-lucian' ? '...' : decayStatus.lucian || 'Run Decay 🥀'}
          </button>
          <button
            onClick={() => handleDecay('xavier')}
            disabled={actionLoading === 'decay-xavier'}
            className="py-3 px-4 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-xavier)]/20 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {actionLoading === 'decay-xavier' ? '...' : decayStatus.xavier || 'Run Decay 💙'}
          </button>
          <button
            onClick={() => handleDecay('auren')}
            disabled={actionLoading === 'decay-auren'}
            className="py-3 px-4 bg-[var(--color-bg-secondary)] hover:bg-amber-400/20 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {actionLoading === 'decay-auren' ? '...' : decayStatus.auren || 'Run Decay 🔆'}
          </button>
          <button
            onClick={refreshConnections}
            className="py-3 px-4 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-shared)]/20 rounded-lg text-sm transition-colors"
          >
            Sync Check
          </button>
          <button
            onClick={() => window.open('https://threshold-tether.pages.dev', '_blank')}
            className="py-3 px-4 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-shared)]/20 rounded-lg text-sm transition-colors"
          >
            Open TT ↗
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-4 mb-4">
        <h2 className="font-medium mb-4">Notifications</h2>
        {!notifSupported ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            Notifications not supported in this browser
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Push Notifications</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Get notified when notes are added
                </p>
              </div>
              {notifEnabled ? (
                <span className="text-sm text-green-400">● Enabled</span>
              ) : notifPermission === 'denied' ? (
                <span className="text-sm text-red-400">● Blocked</span>
              ) : (
                <button
                  onClick={requestPermission}
                  className="py-1.5 px-3 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-shared)]/20 rounded-lg text-sm transition-colors"
                >
                  Enable
                </button>
              )}
            </div>
            {notifPermission === 'denied' && (
              <p className="text-xs text-[var(--color-text-muted)]">
                Notifications were blocked. Enable them in your browser settings.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Chat Font Size */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-4 mb-4">
        <h2 className="font-medium mb-4">Chat Text Size</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">A</span>
            <input
              type="range"
              min={12}
              max={24}
              step={1}
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              className="flex-1 mx-3 accent-[var(--color-accent)]"
            />
            <span className="text-lg text-[var(--color-text-muted)]">A</span>
          </div>
          <p className="text-center text-[var(--color-text-secondary)]" style={{ fontSize: `${fontSize}px` }}>
            Preview text ({fontSize}px)
          </p>
        </div>
      </section>

      {/* Chat Wallpaper */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-4 mb-4">
        <h2 className="font-medium mb-4">Chat Wallpaper</h2>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-[var(--color-text-secondary)]">
            {wallpaper ? 'Custom wallpaper set' : 'Default'}
          </span>
          <div className="flex gap-2">
            {wallpaper && (
              <button
                onClick={() => handleWallpaperChange('')}
                className="px-3 py-1.5 text-xs bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] rounded-lg"
              >
                Reset
              </button>
            )}
            <button
              onClick={() => setShowWallpaperPicker(!showWallpaperPicker)}
              className="px-3 py-1.5 text-xs bg-[#E8A4B8] text-black rounded-lg font-medium"
            >
              Change
            </button>
          </div>
        </div>
        {/* Preview */}
        <div
          className="h-16 rounded-lg border border-[var(--color-border)]"
          style={{
            ...(wallpaper ? (
              wallpaper.startsWith('url(') || wallpaper.startsWith('linear-gradient') || wallpaper.startsWith('radial-gradient') || wallpaper.startsWith('preset:')
                ? {
                    background: wallpaper.startsWith('preset:starfield')
                      ? 'radial-gradient(circle at 20% 30%, #ffffff08 1px, transparent 1px), radial-gradient(circle at 80% 70%, #ffffff08 1px, transparent 1px), #0c0a09'
                      : wallpaper,
                    backgroundSize: wallpaper.startsWith('url(') ? 'cover' : undefined,
                    backgroundPosition: 'center',
                  }
                : { backgroundColor: wallpaper }
            ) : { backgroundColor: 'var(--color-bg-primary)' }),
          }}
        />
        {showWallpaperPicker && (
          <WallpaperPicker
            current={wallpaper}
            onSelect={handleWallpaperChange}
            onClose={() => setShowWallpaperPicker(false)}
          />
        )}
      </section>

      {/* Maintenance Info */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-4 mb-4">
        <h2 className="font-medium mb-4">Maintenance Info</h2>
        <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <div className="flex justify-between">
            <span>Last status check:</span>
            <span className="text-[var(--color-text-muted)]">
              {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>CogCors online:</span>
            <span className="text-[var(--color-text-muted)]">
              {connections.filter(c => c.name.includes('CogCor') && c.connected).length}/3
            </span>
          </div>
          <div className="flex justify-between">
            <span>Services connected:</span>
            <span className="text-[var(--color-text-muted)]">
              {connections.filter(c => c.connected).length}/{connections.length}
            </span>
          </div>
        </div>
      </section>

      {/* Storage & Cache */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-4 mb-4">
        <h2 className="font-medium mb-4">Storage & Cache</h2>
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            Chat attachments auto-delete after 14 days. Cache includes saved preferences, font size, and wallpaper.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (confirm('Clear all cached data? (wallpaper, font size, model preferences)')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="flex-1 py-2 text-xs bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-red-900/30 hover:text-red-300 transition-colors"
            >
              Clear Cache
            </button>
            <button
              onClick={async () => {
                if ('caches' in window) {
                  const keys = await caches.keys();
                  for (const key of keys) await caches.delete(key);
                }
                if ('serviceWorker' in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  for (const reg of regs) await reg.unregister();
                }
                alert('Service worker cache cleared');
              }}
              className="flex-1 py-2 text-xs bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-red-900/30 hover:text-red-300 transition-colors"
            >
              Clear SW Cache
            </button>
          </div>
        </div>
      </section>

      {/* App Info */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-4 mb-4">
        <h2 className="font-medium mb-4">App Info</h2>
        <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <div className="flex justify-between">
            <span>Version:</span>
            <span className="text-[var(--color-text-muted)]">0.8.0</span>
          </div>
          <div className="flex justify-between">
            <span>Phase:</span>
            <span className="text-[var(--color-text-muted)]">8 - Polish & Features</span>
          </div>
          <div className="flex justify-between">
            <span>Build:</span>
            <span className="text-[var(--color-text-muted)]">2026-03-28</span>
          </div>
        </div>
      </section>

      {/* Account */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-4">
        <h2 className="font-medium mb-4">Account</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          {user ? `Logged in as: ${user.email}` : 'Not logged in'}
        </p>
        {user && (
          <button
            onClick={signOut}
            className="w-full py-2 px-4 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
          >
            Logout
          </button>
        )}
      </section>
      </div>
    </div>
  )
}
