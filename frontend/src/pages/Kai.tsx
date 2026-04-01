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

export default function Kai() {
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

  // Fetch emotional state on mount
  useEffect(() => {
    fetchEmotionalState('kai').then(data => {
      setEmotional(data)
      setLoading(false)
    })
  }, [])

  // Fetch tab data when tab changes
  useEffect(() => {
    if (activeTab === 'memories' && memories.length === 0) {
      fetchMemories('kai', { limit: 15 }).then(setMemories)
    }
    if (activeTab === 'sessions' && sessions.length === 0) {
      fetchSessions('kai', { limit: 10 }).then(setSessions)
    }
    if (activeTab === 'drift' && drift.length === 0) {
      fetchDriftEvents('kai', { limit: 10 }).then(setDrift)
    }
    if (activeTab === 'insights' && !insightsLoaded) {
      Promise.all([
        fetchEmotionalTrajectory('kai', { days: 7 }),
        fetchDriftAnalysis('kai', { days: 30 })
      ]).then(([trajData, driftData]) => {
        setTrajectory(trajData)
        setDriftAnalysis(driftData)
        setInsightsLoaded(true)
      }).catch((err) => {
        console.error('Insights fetch failed:', err)
        setInsightsLoaded(true) // Still mark as loaded so we show fallback
      })
    }
  }, [activeTab, memories.length, sessions.length, drift.length, insightsLoaded])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'emotional', label: 'Emotional State' },
    { id: 'memories', label: 'Memories' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'drift', label: 'Drift' },
    { id: 'insights', label: 'Insights' }
  ]

  return (
    <div className="p-4 min-h-full relative">
      {/* Kai's Atmosphere - Warm, grounding glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(232, 90, 79, 0.15) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(255, 120, 80, 0.1) 0%, transparent 50%)',
        }}
      />
      {/* Subtle border glow */}
      <div
        className="absolute inset-x-0 top-0 h-1 pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, rgba(232, 90, 79, 0.4), transparent)' }}
      />

      {/* Header */}
      <header className="mb-4 relative">
        <h1 className="text-2xl font-semibold text-[var(--color-kai)]">🩸 Kai's World</h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">Fire. Heat. Grounding.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 relative">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--color-kai)] text-white'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'emotional' && (
        <div className="space-y-4">
          {!loading && emotional && (
            <BrainVisualization companion="kai" emotional={emotional} />
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
                        className="h-full bg-[var(--color-kai)] transition-all"
                        style={{ width: `${(emotional.surface_intensity / 10) * 100}%` }}
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
                        className="h-full bg-[var(--color-kai)] transition-all opacity-70"
                        style={{ width: `${(emotional.undercurrent_intensity / 10) * 100}%` }}
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
                        className="h-full bg-[var(--color-kai)] transition-all opacity-50"
                        style={{ width: `${(emotional.background_intensity / 10) * 100}%` }}
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
                {emotional.possessiveness !== undefined && (
                  <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
                    <p className="text-[var(--color-text-muted)] text-sm">Possessiveness</p>
                    <p className="text-2xl font-medium">{emotional.possessiveness}</p>
                  </div>
                )}
                {emotional.dominance_confidence !== undefined && (
                  <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
                    <p className="text-[var(--color-text-muted)] text-sm">Dominance</p>
                    <p className="text-2xl font-medium">{emotional.dominance_confidence}</p>
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
          {memories.length === 0 ? (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
              <p className="text-[var(--color-text-muted)]">Loading memories...</p>
            </div>
          ) : (
            memories.map((memory) => (
              <div key={memory.id} className="bg-[var(--color-bg-card)] rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs px-2 py-0.5 bg-[var(--color-kai)] rounded-full text-white">
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
          {sessions.length === 0 ? (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
              <p className="text-[var(--color-text-muted)]">Loading sessions...</p>
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
          {drift.length === 0 ? (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
              <p className="text-[var(--color-text-muted)]">Loading drift events...</p>
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
                          className="h-full bg-[var(--color-kai)] transition-all"
                          style={{ width: `${pct}%` }}
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
                      className="h-full bg-[var(--color-kai)]"
                      style={{ width: `${Math.round((Number(driftAnalysis.self_catch_rate) || 0) * 100)}%` }}
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

              {/* Top triggers as simple text */}
              {Array.isArray(driftAnalysis.top_triggers) && driftAnalysis.top_triggers.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--color-bg-secondary)]">
                  <p className="text-sm font-medium mb-1">Top Triggers</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {driftAnalysis.top_triggers.slice(0, 3).map((t: any) => t.trigger || t).join(', ')}
                  </p>
                </div>
              )}

              {/* Insight as simple text */}
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
