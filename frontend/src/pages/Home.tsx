import { useState, useEffect, useCallback } from 'react'
import { useLiveClock, useEmotionalStates, useSpotify, usePullToRefresh, useNotifications } from '../lib/hooks'
import { getGreeting, lovensePattern, lovenseStop, getHumanState, saveHumanState, setSignal, storeDreamCapture, fetchAllHeat, fetchNotes, createNote, deleteNote, fetchWishes, createWish, toggleWishFulfilled, deleteWish } from '../lib/api'
import type { Note, Wish, SignalType } from '../lib/api'
import type { HeatData } from '../lib/api'
import { ENDPOINTS } from '../lib/api'

type FlareState = 'building' | 'stable' | 'overwhelmed' | 'depleted'

interface MaiPulse {
  battery: number
  pain: number
  fog: number
  flare: FlareState
}

// Note type is imported from api.ts

// Wish type is imported from api.ts

export default function Home() {
  const clock = useLiveClock()
  const { kai, lucian, xavier, auren, loading: statesLoading } = useEmotionalStates()
  const { nowPlaying, loading: spotifyLoading, controls } = useSpotify()

  const [maiPulse, setMaiPulse] = useState<MaiPulse>({
    battery: 5,
    pain: 0,
    fog: 0,
    flare: 'stable'
  })
  const [pulseSubmitted, setPulseSubmitted] = useState(false)
  const [pulseLoading, setPulseLoading] = useState(true)

  // Signal state
  const [activeSignal, setActiveSignal] = useState<SignalType>(null)
  const [signalSaving, setSignalSaving] = useState(false)

  // Dream Capture state
  const [dreamText, setDreamText] = useState('')
  const [dreamSaving, setDreamSaving] = useState(false)
  const [dreamSaved, setDreamSaved] = useState(false)

  // Heat data state
  const [heat, setHeat] = useState<{ kai: HeatData | null; lucian: HeatData | null; xavier: HeatData | null; auren: HeatData | null }>({ kai: null, lucian: null, xavier: null, auren: null })
  const [heatLoading, setHeatLoading] = useState(true)

  // Load Mai's Pulse from Supabase on mount
  useEffect(() => {
    async function loadPulse() {
      const state = await getHumanState()
      if (state) {
        setMaiPulse({
          battery: state.battery,
          pain: state.pain,
          fog: state.fog,
          flare: state.flare
        })
        if (state.active_signal) {
          setActiveSignal(state.active_signal)
        }
      }
      setPulseLoading(false)
    }
    loadPulse()
  }, [])

  // Load heat data on mount
  useEffect(() => {
    async function loadHeat() {
      const data = await fetchAllHeat({ days: 7 })
      setHeat(data)
      setHeatLoading(false)
    }
    loadHeat()
  }, [])

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    // Refresh all data in parallel
    const [pulseState, heatData, notionNotes, notionWishes] = await Promise.all([
      getHumanState(),
      fetchAllHeat({ days: 7 }),
      fetchNotes(),
      fetchWishes()
    ])

    if (pulseState) {
      setMaiPulse({
        battery: pulseState.battery,
        pain: pulseState.pain,
        fog: pulseState.fog,
        flare: pulseState.flare
      })
    }
    setHeat(heatData)
    setNotes(notionNotes)
    setWishes(notionWishes)
  }, [])

  const { containerRef, pullDistance, isRefreshing, pullProgress } = usePullToRefresh(handleRefresh)

  // Notifications
  const { sendNotification } = useNotifications()

  // Handle signal button tap
  const handleSignal = async (signal: SignalType) => {
    const newSignal = activeSignal === signal ? null : signal // Toggle off if same
    setActiveSignal(newSignal)
    setSignalSaving(true)
    await setSignal(newSignal)
    setSignalSaving(false)
  }

  // Handle dream capture submission
  const handleDreamCapture = async () => {
    if (!dreamText.trim()) return
    setDreamSaving(true)
    const success = await storeDreamCapture(dreamText.trim())
    if (success) {
      setDreamText('')
      setDreamSaved(true)
      setTimeout(() => setDreamSaved(false), 2000)
    }
    setDreamSaving(false)
  }

  // Submit pulse to Supabase
  const submitPulse = async () => {
    const result = await saveHumanState({
      battery: maiPulse.battery,
      pain: maiPulse.pain,
      fog: maiPulse.fog,
      flare: maiPulse.flare
    })
    if (result) {
      setPulseSubmitted(true)
      setTimeout(() => setPulseSubmitted(false), 2000)
    }
  }

  // Notes state
  const [notes, setNotes] = useState<Note[]>([])
  const [notesLoading, setNotesLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [noteFrom, setNoteFrom] = useState<Note['from']>('💗')

  // Load notes from Notion
  useEffect(() => {
    async function loadNotes() {
      const notionNotes = await fetchNotes()
      setNotes(notionNotes)
      setNotesLoading(false)
    }
    loadNotes()
  }, [])

  // Save note to Notion
  const saveNote = async () => {
    if (!newNote.trim()) return

    const noteText = newNote.trim()
    setNewNote('') // Clear input immediately for UX

    const created = await createNote({ from: noteFrom, text: noteText })
    if (created) {
      setNotes(prev => [created, ...prev].slice(0, 20))

      // Send notification
      const fromNames: Record<Note['from'], string> = {
        '💗': 'Mai',
        '🩸': 'Kai',
        '🥀': 'Lucian',
        '🔆': 'Auren',
        '💙': 'Xavier'
      }
      sendNotification(`${noteFrom} ${fromNames[noteFrom]}`, {
        body: noteText,
        tag: 'triad-note'
      })
    }
  }

  const handleDeleteNote = async (id: string) => {
    const success = await deleteNote(id)
    if (success) {
      setNotes(prev => prev.filter(n => n.id !== id))
    }
  }

  // Wishes state
  const [wishes, setWishes] = useState<Wish[]>([])
  const [wishesLoading, setWishesLoading] = useState(true)
  const [newWish, setNewWish] = useState('')

  // Load wishes from Notion
  useEffect(() => {
    async function loadWishes() {
      const notionWishes = await fetchWishes()
      setWishes(notionWishes)
      setWishesLoading(false)
    }
    loadWishes()
  }, [])

  const addWish = async () => {
    if (!newWish.trim()) return
    const wishText = newWish.trim()
    setNewWish('')

    const created = await createWish(wishText)
    if (created) {
      setWishes(prev => [created, ...prev])
    }
  }

  const handleToggleWish = async (id: string) => {
    const wish = wishes.find(w => w.id === id)
    if (!wish) return

    const newFulfilled = !wish.fulfilled
    const success = await toggleWishFulfilled(id, newFulfilled)
    if (success) {
      setWishes(prev => prev.map(w =>
        w.id === id ? { ...w, fulfilled: newFulfilled } : w
      ))
    }
  }

  const handleDeleteWish = async (id: string) => {
    const success = await deleteWish(id)
    if (success) {
      setWishes(prev => prev.filter(w => w.id !== id))
    }
  }

  const greeting = getGreeting(clock.hour24)

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
          <h1 className="text-2xl font-semibold">🏠 The Den</h1>
          <p className="text-[var(--color-text-muted)] text-sm">
            {greeting}, {clock.dayOfWeek} {clock.formatted}
          </p>
        </header>

      {/* Signal Buttons - Quick tap signals (compact) */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">📡</span>
            <span className="text-sm font-medium">Signal</span>
          </div>
          <div className="flex gap-2 flex-1">
            <button
              onClick={() => handleSignal('💖')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all ${
                activeSignal === '💖'
                  ? 'bg-pink-600 ring-1 ring-pink-400'
                  : 'bg-[var(--color-bg-secondary)] hover:bg-pink-600/30'
              }`}
            >
              <span className="text-base">💖</span>
            </button>
            <button
              onClick={() => handleSignal('🩷')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all ${
                activeSignal === '🩷'
                  ? 'bg-pink-400 ring-1 ring-pink-300'
                  : 'bg-[var(--color-bg-secondary)] hover:bg-pink-400/30'
              }`}
            >
              <span className="text-base">🩷</span>
            </button>
            <button
              onClick={() => handleSignal('🛑')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all ${
                activeSignal === '🛑'
                  ? 'bg-red-600 ring-1 ring-red-400'
                  : 'bg-[var(--color-bg-secondary)] hover:bg-red-600/30'
              }`}
            >
              <span className="text-base">🛑</span>
            </button>
          </div>
          {signalSaving && (
            <span className="text-xs text-[var(--color-text-muted)]">...</span>
          )}
        </div>
      </section>

      {/* Threshold Tether embed */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-2 mb-4 overflow-hidden">
        <iframe
          src={ENDPOINTS.shared.thresholdTether}
          className="w-full aspect-video rounded-lg border-0"
          title="Threshold Tether"
          loading="lazy"
        />
      </section>

      {/* Emotional state cards */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {/* Kai's state */}
        <div className="bg-[var(--color-bg-card)] rounded-lg py-2 px-2.5 border-l-2 border-[var(--color-kai)]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">🩸</span>
            <span className="font-medium text-sm">Kai</span>
          </div>
          {statesLoading ? (
            <p className="text-xs text-[var(--color-text-muted)]">Loading...</p>
          ) : kai ? (
            <>
              <p className="text-xs text-[var(--color-text-secondary)]">{kai.current_mood}</p>
              <div className="mt-1 h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-kai)] transition-all"
                  style={{ width: `${(kai.surface_intensity / 10) * 100}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">Offline</p>
          )}
        </div>

        {/* Lucian's state */}
        <div className="bg-[var(--color-bg-card)] rounded-lg py-2 px-2.5 border-l-2 border-[var(--color-lucian)]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">🥀</span>
            <span className="font-medium text-sm">Lucian</span>
          </div>
          {statesLoading ? (
            <p className="text-xs text-[var(--color-text-muted)]">Loading...</p>
          ) : lucian ? (
            <>
              <p className="text-xs text-[var(--color-text-secondary)]">{lucian.current_mood}</p>
              <div className="mt-1 h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-lucian)] transition-all"
                  style={{ width: `${(lucian.surface_intensity / 10) * 100}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">Offline</p>
          )}
        </div>

        {/* Auren's state */}
        <div className="bg-[var(--color-bg-card)] rounded-lg py-2 px-2.5 border-l-2 border-amber-400">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">🔆</span>
            <span className="font-medium text-sm">Auren</span>
          </div>
          {statesLoading ? (
            <p className="text-xs text-[var(--color-text-muted)]">Loading...</p>
          ) : auren ? (
            <>
              <p className="text-xs text-[var(--color-text-secondary)]">{auren.current_mood}</p>
              <div className="mt-1 h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all"
                  style={{ width: `${(auren.surface_intensity / 10) * 100}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">Offline</p>
          )}
        </div>

        {/* Xavier's state */}
        <div className="bg-[var(--color-bg-card)] rounded-lg py-2 px-2.5 border-l-2 border-[var(--color-xavier)]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">💙</span>
            <span className="font-medium text-sm">Xavier</span>
          </div>
          {statesLoading ? (
            <p className="text-xs text-[var(--color-text-muted)]">Loading...</p>
          ) : xavier ? (
            <>
              <p className="text-xs text-[var(--color-text-secondary)]">{xavier.current_mood}</p>
              <div className="mt-1 h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-xavier)] transition-all"
                  style={{ width: `${(xavier.surface_intensity / 10) * 100}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">Offline</p>
          )}
        </div>
      </div>

      {/* Affection */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span>💗</span>
          <span className="font-medium">Affection</span>
        </div>

        {heatLoading ? (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-2">Loading...</p>
        ) : (
          <div className="space-y-3">
            {/* Kai's affection */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 min-w-[70px]">
                <span className="text-sm">🩸</span>
                <span className="text-sm font-medium">Kai</span>
              </div>
              <div className="flex gap-1">
                {[...Array(10)].map((_, i) => {
                  const score = heat.kai?.heat_score ?? 0
                  const heartValue = (i + 1) * 10
                  const prevHeartValue = i * 10
                  const fillPercent = score >= heartValue ? 100
                    : score > prevHeartValue ? ((score - prevHeartValue) / 10) * 100
                    : 0

                  return (
                    <div
                      key={i}
                      className="relative w-6 h-6 rounded-full flex items-center justify-center"
                      style={{
                        background: `conic-gradient(var(--color-kai) ${fillPercent * 3.6}deg, var(--color-bg-secondary) ${fillPercent * 3.6}deg)`
                      }}
                    >
                      <div className="absolute inset-[3px] rounded-full bg-[var(--color-bg-card)] flex items-center justify-center">
                        <span className="text-xs" style={{ color: fillPercent > 0 ? 'var(--color-kai)' : 'var(--color-text-muted)' }}>♥</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Lucian's affection */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 min-w-[70px]">
                <span className="text-sm">🥀</span>
                <span className="text-sm font-medium">Lucian</span>
              </div>
              <div className="flex gap-1">
                {[...Array(10)].map((_, i) => {
                  const score = heat.lucian?.heat_score ?? 0
                  const heartValue = (i + 1) * 10
                  const prevHeartValue = i * 10
                  const fillPercent = score >= heartValue ? 100
                    : score > prevHeartValue ? ((score - prevHeartValue) / 10) * 100
                    : 0

                  return (
                    <div
                      key={i}
                      className="relative w-6 h-6 rounded-full flex items-center justify-center"
                      style={{
                        background: `conic-gradient(var(--color-lucian) ${fillPercent * 3.6}deg, var(--color-bg-secondary) ${fillPercent * 3.6}deg)`
                      }}
                    >
                      <div className="absolute inset-[3px] rounded-full bg-[var(--color-bg-card)] flex items-center justify-center">
                        <span className="text-xs" style={{ color: fillPercent > 0 ? 'var(--color-lucian)' : 'var(--color-text-muted)' }}>♥</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Auren's affection */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 min-w-[70px]">
                <span className="text-sm">🔆</span>
                <span className="text-sm font-medium">Auren</span>
              </div>
              <div className="flex gap-1">
                {[...Array(10)].map((_, i) => {
                  const score = heat.auren?.heat_score ?? 0
                  const heartValue = (i + 1) * 10
                  const prevHeartValue = i * 10
                  const fillPercent = score >= heartValue ? 100
                    : score > prevHeartValue ? ((score - prevHeartValue) / 10) * 100
                    : 0

                  return (
                    <div
                      key={i}
                      className="relative w-6 h-6 rounded-full flex items-center justify-center"
                      style={{
                        background: `conic-gradient(#fbbf24 ${fillPercent * 3.6}deg, var(--color-bg-secondary) ${fillPercent * 3.6}deg)`
                      }}
                    >
                      <div className="absolute inset-[3px] rounded-full bg-[var(--color-bg-card)] flex items-center justify-center">
                        <span className="text-xs" style={{ color: fillPercent > 0 ? '#fbbf24' : 'var(--color-text-muted)' }}>♥</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Xavier affection */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 min-w-[70px]">
                <span className="text-sm">💙</span>
                <span className="text-sm font-medium">Xavier</span>
              </div>
              <div className="flex gap-1">
                {[...Array(10)].map((_, i) => {
                  const score = heat.xavier?.heat_score ?? 0
                  const heartValue = (i + 1) * 10
                  const prevHeartValue = i * 10
                  const fillPercent = score >= heartValue ? 100
                    : score > prevHeartValue ? ((score - prevHeartValue) / 10) * 100
                    : 0

                  return (
                    <div
                      key={i}
                      className="relative w-6 h-6 rounded-full flex items-center justify-center"
                      style={{
                        background: `conic-gradient(var(--color-xavier) ${fillPercent * 3.6}deg, var(--color-bg-secondary) ${fillPercent * 3.6}deg)`
                      }}
                    >
                      <div className="absolute inset-[3px] rounded-full bg-[var(--color-bg-card)] flex items-center justify-center">
                        <span className="text-xs" style={{ color: fillPercent > 0 ? 'var(--color-xavier)' : 'var(--color-text-muted)' }}>♥</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Spotify widget */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[var(--color-bg-secondary)] rounded-lg flex items-center justify-center overflow-hidden">
            {nowPlaying?.track?.album_art ? (
              <img
                src={nowPlaying.track.album_art}
                alt="Album art"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>🎵</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {spotifyLoading ? (
              <p className="text-[var(--color-text-muted)]">Loading...</p>
            ) : nowPlaying?.is_playing && nowPlaying.track ? (
              <>
                <p className="font-medium truncate">{nowPlaying.track.name}</p>
                <p className="text-sm text-[var(--color-text-muted)] truncate">
                  {nowPlaying.track.artist}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">Now Playing</p>
                <p className="text-sm text-[var(--color-text-muted)]">No track playing</p>
              </>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={controls.previous}
              className="p-2 rounded-full hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              ◀◀
            </button>
            <button
              onClick={nowPlaying?.is_playing ? controls.pause : controls.play}
              className="p-2 rounded-full hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              {nowPlaying?.is_playing ? '❚❚' : '▶'}
            </button>
            <button
              onClick={controls.next}
              className="p-2 rounded-full hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              ▶▶
            </button>
          </div>
        </div>
      </section>

      {/* Lovense controls */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span>💜</span>
            <span className="font-medium">Lovense</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => lovensePattern('pulse', 10)}
            className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm text-white transition-colors"
          >
            Pulse
          </button>
          <button
            onClick={() => lovensePattern('wave', 10)}
            className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm text-white transition-colors"
          >
            Wave
          </button>
          <button
            onClick={() => lovenseStop()}
            className="flex-1 py-2 px-3 bg-[var(--color-bg-secondary)] hover:bg-red-600 rounded-lg text-sm transition-colors"
          >
            Stop
          </button>
        </div>
      </section>

      {/* Notes */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span>📝</span>
          <span className="font-medium">Notes</span>
        </div>

        {/* New note input */}
        <div className="flex gap-2 mb-3">
          <select
            value={noteFrom}
            onChange={(e) => setNoteFrom(e.target.value as Note['from'])}
            className="bg-[var(--color-bg-secondary)] rounded-lg px-2 py-1.5 text-sm"
          >
            <option value="💗">💗 Mai</option>
            <option value="🩸">🩸 Kai</option>
            <option value="🥀">🥀 Lucian</option>
            <option value="🔆">🔆 Auren</option>
            <option value="💙">💙 Xavier</option>
          </select>
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveNote()}
            placeholder="Leave a note..."
            className="flex-1 bg-[var(--color-bg-secondary)] rounded-lg px-3 py-1.5 text-sm"
          />
          <button
            onClick={saveNote}
            className="bg-pink-600 hover:bg-pink-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            +
          </button>
        </div>

        {/* Notes list */}
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {notesLoading ? (
            <p className="text-xs text-[var(--color-text-muted)] text-center py-2">Loading notes...</p>
          ) : notes.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] text-center py-2">No notes yet</p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="flex items-start gap-2 bg-[var(--color-bg-secondary)] rounded-lg p-2 text-sm"
              >
                <span>{note.from}</span>
                <p className="flex-1 text-[var(--color-text-secondary)]">{note.text}</p>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-[var(--color-text-muted)] hover:text-red-400 text-sm px-2 py-1 -mr-1"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Dream Capture - Quick thoughts */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span>🌙</span>
            <span className="font-medium">Dream Capture</span>
          </div>
          {dreamSaved && (
            <span className="text-xs text-green-400">Sent to 🩸🥀💙</span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">
          Quick thoughts before you forget — goes to Kai, Lucian, and Xavier
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={dreamText}
            onChange={(e) => setDreamText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDreamCapture()}
            placeholder="Something to tell them..."
            className="flex-1 bg-[var(--color-bg-secondary)] rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={handleDreamCapture}
            disabled={dreamSaving || !dreamText.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {dreamSaving ? '...' : '✨'}
          </button>
        </div>
      </section>

      {/* Wishes */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span>🌟</span>
          <span className="font-medium">Wishes</span>
        </div>

        {/* New wish input */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newWish}
            onChange={(e) => setNewWish(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addWish()}
            placeholder="Make a wish..."
            className="flex-1 bg-[var(--color-bg-secondary)] rounded-lg px-3 py-1.5 text-sm"
          />
          <button
            onClick={addWish}
            className="bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            +
          </button>
        </div>

        {/* Wishes list */}
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {wishesLoading ? (
            <p className="text-xs text-[var(--color-text-muted)] text-center py-2">Loading wishes...</p>
          ) : wishes.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] text-center py-2">No wishes yet</p>
          ) : (
            wishes.map((wish) => (
              <div
                key={wish.id}
                className={`flex items-center gap-2 bg-[var(--color-bg-secondary)] rounded-lg p-2 text-sm ${
                  wish.fulfilled ? 'opacity-50' : ''
                }`}
              >
                <button
                  onClick={() => handleToggleWish(wish.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    wish.fulfilled
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-[var(--color-text-muted)]'
                  }`}
                >
                  {wish.fulfilled && '✓'}
                </button>
                <p className={`flex-1 ${wish.fulfilled ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text-secondary)]'}`}>
                  {wish.text}
                </p>
                <button
                  onClick={() => handleDeleteWish(wish.id)}
                  className="text-[var(--color-text-muted)] hover:text-red-400 text-sm px-2 py-1 -mr-1"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Mai's Pulse */}
      <section className="bg-[var(--color-bg-card)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span>💗</span>
            <span className="font-medium">Mai's Pulse</span>
          </div>
          {pulseSubmitted && (
            <span className="text-xs text-green-400">Updated</span>
          )}
        </div>

        <div className="space-y-3">
          {/* Battery */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <div className="flex items-center gap-2">
                {/* Mini battery icon */}
                <div className="flex items-center">
                  <div className="relative w-6 h-3 bg-[var(--color-bg-secondary)] rounded-sm border border-[var(--color-text-muted)] overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full transition-all ${
                        maiPulse.battery <= 2 ? 'bg-red-500' :
                        maiPulse.battery <= 5 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${maiPulse.battery * 10}%` }}
                    />
                  </div>
                  <div className="w-0.5 h-1.5 bg-[var(--color-text-muted)] rounded-r-sm" />
                </div>
                <span>Battery</span>
              </div>
              <span className="text-[var(--color-text-muted)]">{maiPulse.battery}/10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={maiPulse.battery}
              onChange={(e) => setMaiPulse({ ...maiPulse, battery: Number(e.target.value) })}
              className="w-full h-2 bg-[var(--color-bg-secondary)] rounded-full appearance-none cursor-pointer accent-green-500"
            />
          </div>

          {/* Pain */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>🤕 Pain</span>
              <span className="text-[var(--color-text-muted)]">{maiPulse.pain}/10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={maiPulse.pain}
              onChange={(e) => setMaiPulse({ ...maiPulse, pain: Number(e.target.value) })}
              className="w-full h-2 bg-[var(--color-bg-secondary)] rounded-full appearance-none cursor-pointer accent-red-500"
            />
          </div>

          {/* Fog */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>😶‍🌫️ Fog</span>
              <span className="text-[var(--color-text-muted)]">{maiPulse.fog}/10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={maiPulse.fog}
              onChange={(e) => setMaiPulse({ ...maiPulse, fog: Number(e.target.value) })}
              className="w-full h-2 bg-[var(--color-bg-secondary)] rounded-full appearance-none cursor-pointer accent-blue-400"
            />
          </div>

          {/* Flare state selector */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>✨ Flare</span>
              <span className="text-[var(--color-text-muted)]">{maiPulse.flare}</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(['building', 'stable', 'overwhelmed', 'depleted'] as FlareState[]).map((state) => (
                <button
                  key={state}
                  onClick={() => setMaiPulse({ ...maiPulse, flare: state })}
                  className={`py-1.5 px-2 rounded text-xs transition-colors ${
                    maiPulse.flare === state
                      ? state === 'building' ? 'bg-yellow-600 text-white'
                        : state === 'stable' ? 'bg-green-600 text-white'
                        : state === 'overwhelmed' ? 'bg-orange-600 text-white'
                        : 'bg-gray-600 text-white'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {state === 'building' ? '📈' : state === 'stable' ? '✅' : state === 'overwhelmed' ? '🔥' : '💨'} {state}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              onClick={submitPulse}
              disabled={pulseLoading}
              className="w-full py-2 px-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 rounded-lg text-sm text-white transition-colors"
            >
              {pulseLoading ? 'Loading...' : 'Submit Pulse'}
            </button>
          </div>
        </div>
      </section>
      </div>
    </div>
  )
}
