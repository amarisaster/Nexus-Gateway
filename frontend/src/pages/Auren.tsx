import { useState, useEffect } from 'react'
import BrainVisualization from '../components/brain'
import {
  fetchEmotionalState,
  fetchMemories,
  fetchSessions,
  fetchDriftEvents,
  fetchEmotionalTrajectory,
  fetchDriftAnalysis,
  type EmotionalState,
  type Memory,
  type Session,
  type DriftEvent,
  type EmotionalTrajectory,
  type DriftAnalysis
} from '../lib/api'

type Tab = 'emotional' | 'memories' | 'sessions' | 'drift' | 'insights'

export default function Auren() {
  const [activeTab, setActiveTab] = useState<Tab>('emotional')
  const [loading, setLoading] = useState(true)

  // Data states
  const [emotional, setEmotional] = useState<EmotionalState | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [drift, setDrift] = useState<DriftEvent[]>([])
  const [trajectory, setTrajectory] = useState<EmotionalTrajectory | null>(null)
  const [driftAnalysis, setDriftAnalysis] = useState<DriftAnalysis | null>(null)
  const [insightsLoaded, setInsightsLoaded] = useState(false)
  const [memoriesLoaded, setMemoriesLoaded] = useState(false)
  const [sessionsLoaded, setSessionsLoaded] = useState(false)
  const [driftLoaded, setDriftLoaded] = useState(false)

  // Fetch emotional state on mount
  useEffect(() => {
    fetchEmotionalState('auren').then(data => {
      setEmotional(data)
      setLoading(false)
    })
  }, [])

  // Fetch tab data when tab changes
  useEffect(() => {
    if (activeTab === 'memories' && !memoriesLoaded) {
      fetchMemories('auren', { limit: 15 }).then(data => { setMemories(data); setMemoriesLoaded(true) })
    }
    if (activeTab === 'sessions' && !sessionsLoaded) {
      fetchSessions('auren', { limit: 10 }).then(data => { setSessions(data); setSessionsLoaded(true) })
    }
    if (activeTab === 'drift' && !driftLoaded) {
      fetchDriftEvents('auren', { limit: 10 }).then(data => { setDrift(data); setDriftLoaded(true) })
    }
    if (activeTab === 'insights' && !insightsLoaded) {
      Promise.all([
        fetchEmotionalTrajectory('auren', { days: 7 }),
        fetchDriftAnalysis('auren', { days: 30 })
      ]).then(([trajData, driftData]) => {
        setTrajectory(trajData)
        setDriftAnalysis(driftData)
        setInsightsLoaded(true)
      }).catch((err) => {
        console.error('Insights fetch failed:', err)
        setInsightsLoaded(true)
      })
    }
  }, [activeTab, memoriesLoaded, sessionsLoaded, driftLoaded, insightsLoaded])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'emotional', label: 'Emotional State' },
    { id: 'memories', label: 'Memories' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'drift', label: 'Drift' },
    { id: 'insights', label: 'Insights' }
  ]

  const aurenColor = '#fbbf24'

  return (
    <div className="p-4 min-h-full relative">
      {/* Auren's Atmosphere - Warm golden light, sunlit morning */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top right, rgba(251, 191, 36, 0.14) 0%, transparent 55%), radial-gradient(ellipse at bottom left, rgba(245, 158, 11, 0.08) 0%, transparent 50%)',
        }}
      />
      {/* Subtle border glow */}
      <div
        className="absolute inset-x-0 top-0 h-1 pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, rgba(251, 191, 36, 0.4), transparent)' }}
      />

      {/* Header */}
      <header className="mb-4 relative">
        <h1 className="text-2xl font-semibold" style={{ color: aurenColor }}>🔆 Auren's World</h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">Warmth. Patience. Quiet devotion.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 relative">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-black'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
            }`}
            style={activeTab === tab.id ? { backgroundColor: aurenColor } : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'emotional' && (
        <div className="space-y-4">
          {!loading && emotional && (
            <BrainVisualization companion="auren" emotional={emotional} />
          )}
          {loading ? (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
              <p className="text-[var(--color-text-muted)]">Loading...</p>
            </div>
          ) : emotional ? (
            <>
              {/* Current Mood */}
              <section className="bg-[var(--color-bg-card)] rounded-xl p-4">
                <h2 className="font-medium mb-4">Current Mood: {emotional.current_mood}</h2>

                <div className="space-y-3">
                  {/* Surface */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Surface: {emotional.surface_emotion}</span>
                      <span>{emotional.surface_intensity}</span>
                    </div>
                    <div className="h-2 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{ width: `${(emotional.surface_intensity / 10) * 100}%`, backgroundColor: aurenColor }}
                      />
                    </div>
                  </div>

                  {/* Undercurrent */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Undercurrent: {emotional.undercurrent_emotion}</span>
                      <span>{emotional.undercurrent_intensity}</span>
                    </div>
                    <div className="h-2 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all opacity-70"
                        style={{ width: `${(emotional.undercurrent_intensity / 10) * 100}%`, backgroundColor: aurenColor }}
                      />
                    </div>
                  </div>

                  {/* Background */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Background: {emotional.background_emotion}</span>
                      <span>{emotional.background_intensity}</span>
                    </div>
                    <div className="h-2 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all opacity-50"
                        style={{ width: `${(emotional.background_intensity / 10) * 100}%`, backgroundColor: aurenColor }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
                  <p className="text-[var(--color-text-muted)] text-sm">Arousal</p>
                  <p className="text-2xl font-medium">{emotional.arousal_level}</p>
                </div>
                <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
                  <p className="text-[var(--color-text-muted)] text-sm">Tension</p>
                  <p className="text-2xl font-medium">{emotional.tension_level ?? '—'}</p>
                </div>
                {emotional.vulnerability !== undefined && (
                  <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
                    <p className="text-[var(--color-text-muted)] text-sm">Vulnerability</p>
                    <p className="text-2xl font-medium">{emotional.vulnerability}</p>
                  </div>
                )}
                {emotional.patience_level !== undefined && (
                  <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
                    <p className="text-[var(--color-text-muted)] text-sm">Patience</p>
                    <p className="text-2xl font-medium">{emotional.patience_level}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
              <p className="text-[var(--color-text-muted)]">Could not load emotional state</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'memories' && (
        <div className="space-y-3">
          {!memoriesLoaded ? (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
              <p className="text-[var(--color-text-muted)]">Loading memories...</p>
            </div>
          ) : memories.length === 0 ? (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
              <p className="text-[var(--color-text-muted)]">No memories yet</p>
            </div>
          ) : (
            memories.map((memory) => (
              <div key={memory.id} className="bg-[var(--color-bg-card)] rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-black"
                    style={{ backgroundColor: aurenColor }}
                  >
                    {memory.memory_type}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    salience: {memory.decayed_salience?.toFixed(1) ?? memory.salience}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">{memory.content}</p>
                {memory.emotional_tag && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    feeling: {memory.emotional_tag}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-3">
          {!sessionsLoaded ? (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
              <p className="text-[var(--color-text-muted)]">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
              <p className="text-[var(--color-text-muted)]">No sessions yet</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="bg-[var(--color-bg-card)] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2 py-0.5 bg-[var(--color-bg-secondary)] rounded-full">
                    {session.session_type}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {session.created_at ? new Date(session.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">{session.summary}</p>
                {session.emotional_arc && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    arc: {session.emotional_arc}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'drift' && (
        <div className="space-y-3">
          {!driftLoaded ? (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
              <p className="text-[var(--color-text-muted)]">Loading drift events...</p>
            </div>
          ) : drift.length === 0 ? (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
              <p className="text-[var(--color-text-muted)]">No drift events — clean slate</p>
            </div>
          ) : (
            drift.map((event) => (
              <div key={event.id} className="bg-[var(--color-bg-card)] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    event.severity === 'major' ? 'bg-red-600' :
                    event.severity === 'moderate' ? 'bg-yellow-600' : 'bg-green-600'
                  } text-white`}>
                    {event.severity}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    caught by {event.caught_by}
                  </span>
                </div>
                <p className="text-sm font-medium mb-1">Trigger: {event.trigger}</p>
                <p className="text-xs text-[var(--color-text-muted)] mb-2">
                  patterns: {event.patterns_detected.join(', ')}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Recovery: {event.recovery_action}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-4">
          {!insightsLoaded && (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
              <p className="text-[var(--color-text-muted)]">Loading insights...</p>
            </div>
          )}

          {insightsLoaded && trajectory?.summary?.mood_distribution && (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
              <h2 className="font-medium mb-3">Mood Distribution (7 days)</h2>
              <div className="space-y-2">
                {Object.entries(trajectory.summary.mood_distribution).map(([mood, count]) => {
                  const total = Object.values(trajectory.summary.mood_distribution).reduce((a, b) => Number(a) + Number(b), 0)
                  const pct = total > 0 ? (Number(count) / total) * 100 : 0
                  return (
                    <div key={mood}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{mood}</span>
                        <span>{count} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: aurenColor }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--color-bg-secondary)] grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-[var(--color-text-muted)]">Avg Arousal: </span>
                  <span className="font-medium">{trajectory.summary.avg_arousal ?? '—'}</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)]">Avg Tension: </span>
                  <span className="font-medium">{trajectory.summary.avg_tension ?? '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Drift Analysis */}
          {insightsLoaded && driftAnalysis && (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
              <h2 className="font-medium mb-3">Self-Awareness</h2>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-3 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.round((Number(driftAnalysis.self_catch_rate) || 0) * 100)}%`,
                        backgroundColor: aurenColor
                      }}
                    />
                  </div>
                </div>
                <span className="text-lg font-medium">
                  {Math.round((Number(driftAnalysis.self_catch_rate) || 0) * 100)}%
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                Drifts caught by self vs Mai
              </p>

              {Array.isArray(driftAnalysis.top_triggers) && driftAnalysis.top_triggers.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--color-bg-secondary)]">
                  <p className="text-sm font-medium mb-1">Top Triggers</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {driftAnalysis.top_triggers.slice(0, 3).map((t: any) => t.trigger || t).join(', ')}
                  </p>
                </div>
              )}

              {driftAnalysis.insight && (
                <div className="mt-3 pt-3 border-t border-[var(--color-bg-secondary)]">
                  <p className="text-sm font-medium mb-1">Insight</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {String(driftAnalysis.insight)}
                  </p>
                </div>
              )}
            </div>
          )}

          {insightsLoaded && !trajectory?.summary?.mood_distribution && !driftAnalysis && (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
              <p className="text-[var(--color-text-muted)]">No insight data available yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
