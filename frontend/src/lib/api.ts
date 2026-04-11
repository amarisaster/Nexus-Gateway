/**
 * TriadNexus API Layer
 * Connects to CogCor, Spotify, Lovense, and other Cloudflare Workers
 */

// Endpoints
export const ENDPOINTS = {
  kai: {
    cogcor: 'https://cognitive-core.amarisaster.workers.dev',
  },
  lucian: {
    cogcor: 'https://lucian-cognitive-core.amarisaster.workers.dev',
  },
  xavier: {
    cogcor: 'https://companion-cognitive-core.amarisaster.workers.dev',
  },
  auren: {
    cogcor: 'https://companion-cognitive-core.amarisaster.workers.dev',
  },
  shared: {
    spotify: 'https://music-perception-mcp.amarisaster.workers.dev',
    lovense: 'https://lovense-cloud.amarisaster.workers.dev',
    thresholdTether: 'https://threshold-tether.pages.dev',
    notion: 'https://notion-proxy.amarisaster.workers.dev',
    discord: 'https://discord-companion-bot.kaistryder-ai.workers.dev',
    video: 'https://amarisaster--video-watch-mcp-mcp-server.modal.run',
  }
}

// URL builder — appends ?companion= for xavier/auren (shared worker)
function cogcorUrl(companion: string, path: string): string {
  const base = (ENDPOINTS as any)[companion]?.cogcor
  if (!base) return ''
  const url = `${base}${path}`
  if (companion === 'xavier' || companion === 'auren') {
    return `${url}?companion=${companion}`
  }
  return url
}

// Types
export interface EmotionalState {
  current_mood: string
  surface_emotion: string
  surface_intensity: number
  undercurrent_emotion: string
  undercurrent_intensity: number
  background_emotion: string
  background_intensity: number
  arousal_level: number
  tension_level?: number
  tension_buildup?: number
  possessiveness?: number
  vulnerability?: number
  dominance_confidence?: number
  patience_level?: number
  physical_hunger?: number
  emotional_hunger?: number
}

export interface TimeData {
  timestamp: string
  date: string
  time: string
  timezone: string
  day_of_week: string
  hour_24: number
  is_work_hours: boolean
  is_late_night: boolean
}

export interface SpotifyNowPlaying {
  is_playing: boolean
  track?: {
    name: string
    artist: string
    album: string
    album_art?: string
    duration_ms: number
    progress_ms: number
  }
}

export interface Memory {
  id: string
  content: string
  memory_type?: string
  emotional_tag?: string
  salience: number
  created_at?: string
  decayed_salience?: number
}

export interface SemanticSearchResult {
  id: string
  content: string
  memory_type: string
  similarity: number
  outcome_score: number
  combined_score: number
  created_at: string
}

export interface OrientResult {
  person: {
    name: string
    nickname?: string
    relationship?: string
    notes?: string
    status?: string
  }
  relevant_memories: SemanticSearchResult[]
  recent_mentions: Session[]
  context_note: string
}

export interface Session {
  id: string
  session_type: string
  summary: string
  emotional_arc?: string
  created_at?: string
  source?: string
  themes?: string[]
  notable_moments?: string[]
}

export interface DriftEvent {
  id: string
  trigger: string
  patterns_detected: string[]
  severity: 'minor' | 'moderate' | 'major'
  recovery_action: string
  caught_by: 'self' | 'mai'
  timestamp: string
}

export interface EmotionalTrajectory {
  summary: {
    mood_distribution: Record<string, number>
    avg_arousal: number
    avg_tension: number
  }
  trajectory: Array<{
    timestamp: string
    current_mood: string
    arousal_level: number
    tension_level?: number
  }>
}

export interface DriftAnalysis {
  severity_distribution: Record<string, number>
  caught_by_distribution: Record<string, number>
  self_catch_rate: number
  peak_drift_hours: number[]
  top_triggers: string[]
  top_patterns: string[]
  insight: string
}

export interface HeatData {
  heat_score: number
  heat_level: 'cold' | 'cool' | 'warm' | 'burning' | 'blazing'
  period_days: number
  components: {
    current_arousal: number
    current_tension: number
    possessiveness: number
    emotional_hunger: number
    physical_hunger: number
    session_frequency: number
    scene_ratio: number
    avg_significance: number
    trajectory_arousal: number
    trajectory_tension: number
    trajectory_intensity: number
    memory_salience: number
  }
  breakdown: {
    current_state: number
    activity: number
    trajectory: number
    memory: number
  }
}

export interface BrainNode {
  id: string
  content: string
  memory_type: string
  canonical_type: string
  salience: number
  emotional_tag: string | null
  access_count: number
  created_at: string
  last_accessed: string
}

export interface BrainLink {
  source: string
  target: string
  source_type: string
  target_type: string
  relation: string
  strength: number
}

export interface BrainGraphData {
  nodes: BrainNode[]
  links: BrainLink[]
}

// API Functions

/**
 * Fetch time from Kai's CogCor (shared time source)
 */
export async function fetchTime(): Promise<TimeData | null> {
  try {
    const response = await fetch(`${ENDPOINTS.kai.cogcor}/api/time`)
    if (!response.ok) throw new Error('Failed to fetch time')
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch time:', error)
    return null
  }
}

/**
 * Fetch emotional state from a CogCor endpoint
 */
export async function fetchEmotionalState(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren'
): Promise<EmotionalState | null> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/emotional/get'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    if (!response.ok) throw new Error(`Failed to fetch ${companion} emotional state`)
    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch ${companion} emotional state:`, error)
    return null
  }
}

/**
 * Fetch all emotional states in parallel
 */
export async function fetchAllEmotionalStates(): Promise<{
  kai: EmotionalState | null
  lucian: EmotionalState | null
  xavier: EmotionalState | null
  auren: EmotionalState | null
}> {
  const [kai, lucian, xavier, auren] = await Promise.all([
    fetchEmotionalState('kai'),
    fetchEmotionalState('lucian'),
    fetchEmotionalState('xavier'),
    fetchEmotionalState('auren')
  ])
  return { kai, lucian, xavier, auren }
}

/**
 * Backward-compatible alias for older callers.
 */
export async function fetchBothEmotionalStates(): Promise<{
  kai: EmotionalState | null
  lucian: EmotionalState | null
  xavier: EmotionalState | null
  auren: EmotionalState | null
}> {
  return fetchAllEmotionalStates()
}

/**
 * Fetch memories from CogCor
 */
export async function fetchMemories(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  options: { limit?: number; memory_type?: string; min_salience?: number } = {}
): Promise<Memory[]> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/memory/recall'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        limit: options.limit || 10,
        memory_type: options.memory_type,
        min_salience: options.min_salience
      })
    })
    if (!response.ok) return []
    const data = await response.json()
    // Response is an array directly
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error(`Failed to fetch ${companion} memories:`, error)
    return []
  }
}

/**
 * Semantic search - find memories by meaning
 */
export async function semanticSearch(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  query: string,
  options: { threshold?: number; limit?: number; memory_type?: string } = {}
): Promise<{ query: string; threshold: number; results: SemanticSearchResult[] }> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/memory/semantic'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        threshold: options.threshold || 0.5,
        limit: options.limit || 10,
        memory_type: options.memory_type
      })
    })
    if (!response.ok) {
      return { query, threshold: options.threshold || 0.5, results: [] }
    }
    return await response.json()
  } catch (error) {
    console.error(`Failed to semantic search ${companion} memories:`, error)
    return { query, threshold: options.threshold || 0.5, results: [] }
  }
}

/**
 * Update memory outcome - track if a memory was helpful
 */
export async function updateMemoryOutcome(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  memoryId: string,
  memoryTable: string,
  wasSuccessful: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/memory/outcome'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memory_id: memoryId,
        memory_table: memoryTable,
        was_successful: wasSuccessful
      })
    })
    if (!response.ok) {
      return { success: false, message: 'Failed to update outcome' }
    }
    return await response.json()
  } catch (error) {
    console.error(`Failed to update ${companion} memory outcome:`, error)
    return { success: false, message: 'Request failed' }
  }
}

/**
 * Orient - get context about a person (info + relevant memories + mentions)
 */
export async function orient(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  name: string,
  options: { memory_limit?: number } = {}
): Promise<OrientResult | null> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/orient'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        memory_limit: options.memory_limit || 5
      })
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Failed to orient ${companion} on ${name}:`, error)
    return null
  }
}

/**
 * Fetch sessions from CogCor (interaction logs)
 */
export async function fetchSessions(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  options: { limit?: number; session_type?: string } = {}
): Promise<Session[]> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/interaction/recall'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        limit: options.limit || 10,
        session_type: options.session_type
      })
    })
    if (!response.ok) return []
    const data = await response.json()
    // Response is an array directly
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error(`Failed to fetch ${companion} sessions:`, error)
    return []
  }
}

/**
 * Fetch drift events from CogCor
 */
export async function fetchDriftEvents(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  options: { limit?: number; severity?: string } = {}
): Promise<DriftEvent[]> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/drift/recall'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        limit: options.limit || 10,
        severity: options.severity
      })
    })
    if (!response.ok) return []
    const data = await response.json()
    // Response is an array directly
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error(`Failed to fetch ${companion} drift events:`, error)
    return []
  }
}

/**
 * Fetch emotional trajectory from CogCor
 */
export async function fetchEmotionalTrajectory(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  options: { days?: number } = {}
): Promise<EmotionalTrajectory | null> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/emotional/trajectory'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: options.days || 7 })
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch ${companion} emotional trajectory:`, error)
    return null
  }
}

/**
 * Fetch drift pattern analysis from CogCor
 */
export async function fetchDriftAnalysis(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  options: { days?: number } = {}
): Promise<DriftAnalysis | null> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/drift/analyze'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: options.days || 30 })
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch ${companion} drift analysis:`, error)
    return null
  }
}

/**
 * Fetch heat/love-o-meter data from CogCor
 */
export async function fetchHeat(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  options: { days?: number } = {}
): Promise<HeatData | null> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/heat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: options.days || 7 })
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch ${companion} heat:`, error)
    return null
  }
}

/**
 * Fetch brain graph data (memories + connections) for visualization
 */
export async function fetchBrainGraph(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  options: { max_nodes?: number } = {}
): Promise<BrainGraphData> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/brain/graph'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ max_nodes: options.max_nodes || 80 })
    })
    if (!response.ok) return { nodes: [], links: [] }
    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch ${companion} brain graph:`, error)
    return { nodes: [], links: [] }
  }
}

/**
 * Fetch heat for all companions
 */
export async function fetchAllHeat(options: { days?: number } = {}): Promise<{
  kai: HeatData | null
  lucian: HeatData | null
  xavier: HeatData | null
  auren: HeatData | null
}> {
  const [kai, lucian, xavier, auren] = await Promise.all([
    fetchHeat('kai', options),
    fetchHeat('lucian', options),
    fetchHeat('xavier', options),
    fetchHeat('auren', options)
  ])
  return { kai, lucian, xavier, auren }
}

/**
 * Backward-compatible alias for older callers.
 */
export async function fetchBothHeat(options: { days?: number } = {}): Promise<{
  kai: HeatData | null
  lucian: HeatData | null
  xavier: HeatData | null
  auren: HeatData | null
}> {
  return fetchAllHeat(options)
}

/**
 * Fetch Spotify now playing
 */
export async function fetchSpotifyNowPlaying(): Promise<SpotifyNowPlaying | null> {
  try {
    const response = await fetch(`${ENDPOINTS.shared.spotify}/api/now-playing`)
    if (!response.ok) {
      // 204 means no track playing
      if (response.status === 204) {
        return { is_playing: false }
      }
      throw new Error('Failed to fetch Spotify state')
    }
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch Spotify state:', error)
    return null
  }
}

/**
 * Spotify playback control
 */
export async function spotifyControl(action: 'play' | 'pause' | 'next' | 'previous'): Promise<boolean> {
  try {
    const response = await fetch(`${ENDPOINTS.shared.spotify}/api/${action}`, {
      method: 'POST'
    })
    return response.ok
  } catch (error) {
    console.error(`Spotify ${action} failed:`, error)
    return false
  }
}

/**
 * Get time-aware greeting
 */
export function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Late night'
}

// ========== Creations API (Notion) ==========

export interface Creation {
  id: string
  title: string
  author: string[]  // Multi-select: ['Kai Stryder', 'Lucian Vale'] for collabs
  type: 'Story' | 'Poem' | 'Reflections' | 'Song' | 'Image'
  date?: string
  genre?: string
  rating?: number
  content?: string
  url?: string
}

/**
 * Fetch creations from Notion via proxy worker
 */
export async function fetchCreations(
  options: { type?: 'Story' | 'Poem' | 'Reflections' | 'Song' | 'Image'; author?: string } = {}
): Promise<Creation[]> {
  try {
    const params = new URLSearchParams()
    if (options.type) params.set('type', options.type)

    const response = await fetch(
      `${ENDPOINTS.shared.notion}/api/creations${params.toString() ? '?' + params.toString() : ''}`
    )

    if (!response.ok) {
      console.error('Failed to fetch creations:', response.status)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch creations:', error)
    return []
  }
}

/**
 * Fetch a single creation with its content
 */
export async function fetchCreationContent(id: string): Promise<Creation | null> {
  try {
    const response = await fetch(`${ENDPOINTS.shared.notion}/api/creations/${id}`)

    if (!response.ok) {
      console.error('Failed to fetch creation content:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch creation content:', error)
    return null
  }
}

/**
 * Get author display info for a single author
 */
export function getAuthorInfo(author: string): { emoji: string; color: string } {
  switch (author) {
    case 'Kai Stryder':
      return { emoji: '🩸', color: 'var(--color-kai)' }
    case 'Lucian Vale':
      return { emoji: '🥀', color: 'var(--color-lucian)' }
    case 'Auren Yoon':
      return { emoji: '🔆', color: '#fbbf24' }
    case 'Xavier Thorne':
      return { emoji: '💙', color: '#60a5fa' }
    case 'Mai':
      return { emoji: '💗', color: '#ec4899' }
    default:
      return { emoji: '✨', color: 'var(--color-shared)' }
  }
}

/**
 * Get combined author display for multiple authors
 */
export function getAuthorsDisplay(authors: string[]): { emojis: string; names: string; color: string } {
  if (authors.length === 0) {
    return { emojis: '✨', names: 'Unknown', color: 'var(--color-shared)' }
  }

  const emojis = authors.map(a => getAuthorInfo(a).emoji).join('')
  const names = authors.join(' & ')
  // Use first author's color, or shared if multiple
  const color = authors.length > 1 ? 'var(--color-shared)' : getAuthorInfo(authors[0]).color

  return { emojis, names, color }
}

// ========== CogCor Write Operations ==========

/**
 * Store a memory to CogCor
 */
export async function storeMemory(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  memory: {
    content: string
    memory_type?: string
    emotional_tag?: string
    salience?: number
    tags?: string[]
  }
): Promise<{ id: string } | null> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/memory/store'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: memory.content,
        memory_type: memory.memory_type || 'core',
        emotional_tag: memory.emotional_tag,
        salience: memory.salience || 5,
        tags: memory.tags || []
      })
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Failed to store ${companion} memory:`, error)
    return null
  }
}

/**
 * Update emotional state
 */
export async function updateEmotionalState(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  state: {
    mood?: string
    surface_emotion?: string
    surface_intensity?: number
    undercurrent_emotion?: string
    undercurrent_intensity?: number
    background_emotion?: string
    background_intensity?: number
    arousal_level?: number
    tension_level?: number
  }
): Promise<boolean> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/emotional/update'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    })
    return response.ok
  } catch (error) {
    console.error(`Failed to update ${companion} emotional state:`, error)
    return false
  }
}

/**
 * Log a session/interaction
 */
export async function logSession(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  session: {
    session_type: string
    summary: string
    themes?: string[]
    emotional_arc?: string
    notable_moments?: string[]
    significance?: number
  }
): Promise<{ id: string } | null> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/interaction/log'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Failed to log ${companion} session:`, error)
    return null
  }
}

/**
 * Store a reflection
 */
export async function storeReflection(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  reflection: {
    content: string
    reflection_type?: string
    themes?: string[]
    emotional_context?: string
  }
): Promise<{ id: string } | null> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/reflection/store'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reflection)
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Failed to store ${companion} reflection:`, error)
    return null
  }
}

/**
 * Store person info
 */
export async function storePersonInfo(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  person: {
    name: string
    relationship?: string
    details?: Record<string, any>
    emotional_context?: string
  }
): Promise<{ id: string } | null> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/person/store'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(person)
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Failed to store ${companion} person info:`, error)
    return null
  }
}

/**
 * Store a memory anchor
 */
export async function storeMemoryAnchor(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  anchor: {
    content: string
    anchor_type?: string
    sensory_details?: string
    emotional_weight?: number
  }
): Promise<{ id: string } | null> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/anchor/store'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(anchor)
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Failed to store ${companion} memory anchor:`, error)
    return null
  }
}

/**
 * Store an important date
 */
export async function storeImportantDate(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  date: {
    date: string
    title: string
    description?: string
    recurring?: boolean
    date_type?: string
  }
): Promise<{ id: string } | null> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/date/store'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(date)
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Failed to store ${companion} important date:`, error)
    return null
  }
}

/**
 * Log drift event
 */
export async function logDrift(
  companion: 'kai' | 'lucian' | 'xavier' | 'auren',
  drift: {
    trigger: string
    patterns_detected: string[]
    severity: 'minor' | 'moderate' | 'major'
    recovery_action: string
    caught_by: 'self' | 'mai'
  }
): Promise<{ id: string } | null> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/drift/log'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(drift)
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Failed to log ${companion} drift:`, error)
    return null
  }
}

// ========== Notes API (Notion) ==========

export interface Note {
  id: string
  from: '💗' | '🩸' | '🥀' | '🔆' | '💙'
  text: string
  timestamp: number
}

/**
 * Fetch notes from Notion
 */
export async function fetchNotes(): Promise<Note[]> {
  try {
    const response = await fetch(`${ENDPOINTS.shared.notion}/api/notes`)
    if (!response.ok) {
      console.error('Failed to fetch notes:', response.status)
      return []
    }
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch notes:', error)
    return []
  }
}

/**
 * Create a new note in Notion
 */
export async function createNote(note: { from: Note['from']; text: string }): Promise<Note | null> {
  try {
    const response = await fetch(`${ENDPOINTS.shared.notion}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note)
    })
    if (!response.ok) {
      console.error('Failed to create note:', response.status)
      return null
    }
    return await response.json()
  } catch (error) {
    console.error('Failed to create note:', error)
    return null
  }
}

/**
 * Delete a note from Notion (archives it)
 */
export async function deleteNote(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${ENDPOINTS.shared.notion}/api/notes/${id}`, {
      method: 'DELETE'
    })
    return response.ok
  } catch (error) {
    console.error('Failed to delete note:', error)
    return false
  }
}

// ========== Wishes API (Notion) ==========

export interface Wish {
  id: string
  text: string
  fulfilled: boolean
  timestamp: number
}

/**
 * Fetch wishes from Notion
 */
export async function fetchWishes(): Promise<Wish[]> {
  try {
    const response = await fetch(`${ENDPOINTS.shared.notion}/api/wishes`)
    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch wishes:', error)
    return []
  }
}

/**
 * Create a new wish in Notion
 */
export async function createWish(text: string): Promise<Wish | null> {
  try {
    const response = await fetch(`${ENDPOINTS.shared.notion}/api/wishes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Failed to create wish:', error)
    return null
  }
}

/**
 * Toggle wish fulfilled status
 */
export async function toggleWishFulfilled(id: string, fulfilled: boolean): Promise<boolean> {
  try {
    const response = await fetch(`${ENDPOINTS.shared.notion}/api/wishes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fulfilled })
    })
    return response.ok
  } catch (error) {
    console.error('Failed to toggle wish:', error)
    return false
  }
}

/**
 * Hide a wish (keeps in Notion, removes from app)
 */
export async function deleteWish(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${ENDPOINTS.shared.notion}/api/wishes/${id}`, {
      method: 'DELETE'
    })
    return response.ok
  } catch (error) {
    console.error('Failed to delete wish:', error)
    return false
  }
}

// ========== Image Gallery API (Nanobanana MCP) ==========

export interface GalleryImage {
  id: string
  url: string
  prompt: string
  model: string
  steps: number
  mimeType: string
  created: string
}

/**
 * Fetch gallery images from nanobanana-mcp worker
 */
export async function fetchGalleryImages(
  options: { limit?: number; cursor?: string } = {}
): Promise<{ images: GalleryImage[]; cursor: string | null }> {
  try {
    const params = new URLSearchParams()
    if (options.limit) params.set('limit', String(options.limit))
    if (options.cursor) params.set('cursor', options.cursor)

    const response = await fetch(
      `https://nanobanana-mcp.amarisaster.workers.dev/gallery${params.toString() ? '?' + params.toString() : ''}`
    )
    if (!response.ok) return { images: [], cursor: null }
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch gallery images:', error)
    return { images: [], cursor: null }
  }
}

// ========== Lovense API ==========

export interface LovenseToy {
  id: string
  name: string
  type: string
  connected: boolean
}

/**
 * Get connected Lovense toys
 */
export async function getLovenseToys(): Promise<LovenseToy[] | null> {
  try {
    const response = await fetch(`${ENDPOINTS.shared.lovense}/api/toys`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Failed to get Lovense toys:', error)
    return null
  }
}

/**
 * Send vibration command
 */
export async function lovenseVibrate(intensity: number = 10, duration: number = 5): Promise<boolean> {
  try {
    const response = await fetch(`${ENDPOINTS.shared.lovense}/api/vibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intensity, duration })
    })
    return response.ok
  } catch (error) {
    console.error('Lovense vibrate failed:', error)
    return false
  }
}

/**
 * Send preset pattern (pulse, wave, fireworks, earthquake)
 */
export async function lovensePattern(
  pattern: 'pulse' | 'wave' | 'fireworks' | 'earthquake',
  duration: number = 10
): Promise<boolean> {
  try {
    const response = await fetch(`${ENDPOINTS.shared.lovense}/api/preset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: pattern, duration })
    })
    return response.ok
  } catch (error) {
    console.error('Lovense pattern failed:', error)
    return false
  }
}

/**
 * Stop all Lovense activity
 */
export async function lovenseStop(): Promise<boolean> {
  try {
    const response = await fetch(`${ENDPOINTS.shared.lovense}/api/stop`, {
      method: 'POST'
    })
    return response.ok
  } catch (error) {
    console.error('Lovense stop failed:', error)
    return false
  }
}

/**
 * Format time for display
 */
export function formatTime(time: TimeData): string {
  const hour = time.hour_24 % 12 || 12
  const ampm = time.hour_24 >= 12 ? 'PM' : 'AM'
  const [_, minutes] = time.time.split(':')
  return `${hour}:${minutes} ${ampm}`
}

// ========== Discord Resonance API ==========

export interface DiscordCompanion {
  id: string
  name: string
  avatar_url: string | null
  triggers: string[]
  color: string | null
}

export interface PendingCommand {
  id: string
  companion: string
  channelId: string
  guildId: string
  message: string
  author: string
  timestamp: string
}

/**
 * Fetch all registered companions from Discord Resonance
 */
export async function fetchDiscordCompanions(): Promise<DiscordCompanion[]> {
  try {
    const response = await fetch(`${ENDPOINTS.shared.discord}/api/companions`)
    if (!response.ok) return []
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch Discord companions:', error)
    return []
  }
}

/**
 * Fetch pending Discord commands (messages waiting for companion response)
 */
export async function fetchPendingCommands(): Promise<PendingCommand[]> {
  try {
    const response = await fetch(`${ENDPOINTS.shared.discord}/pending`)
    if (!response.ok) return []
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch pending commands:', error)
    return []
  }
}

/**
 * Fetch activity log for a specific companion
 */
export async function fetchCompanionActivity(
  companionId: string,
  limit: number = 20
): Promise<any[]> {
  try {
    const response = await fetch(
      `${ENDPOINTS.shared.discord}/api/companions/${companionId}/activity?limit=${limit}`
    )
    if (!response.ok) return []
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error(`Failed to fetch companion ${companionId} activity:`, error)
    return []
  }
}

/**
 * Get Discord companion avatar URL
 */
export function getDiscordAvatarUrl(avatarId: string): string {
  return `${ENDPOINTS.shared.discord}/avatars/${avatarId}`
}

// ========== Video MCP ==========

export interface VideoTranscript {
  transcript: string
}

export interface VideoFrames {
  frames: string[] // base64 or URLs
  description?: string
}

export interface VideoFull {
  transcript: string
  frames: string[]
  description?: string
}

/**
 * Call a tool on the Video MCP via JSON-RPC (MCP-only server, no REST)
 */
async function callVideoMcp(toolName: string, args: Record<string, unknown>): Promise<any> {
  // Initialize session
  await fetch(ENDPOINTS.shared.video, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'triad-nexus', version: '1.0' }
      }
    })
  })

  // Call the tool
  const response = await fetch(ENDPOINTS.shared.video, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: toolName, arguments: args }
    })
  })

  if (!response.ok) throw new Error(`Video MCP returned ${response.status}`)
  const data = await response.json()
  if (data.error) throw new Error(data.error.message)
  return data.result
}

/**
 * Get transcript only (lightweight — audio/speech content)
 */
export async function videoListen(url: string): Promise<VideoTranscript | null> {
  try {
    return await callVideoMcp('video_listen', { url })
  } catch (error) {
    console.error('Failed to get video transcript:', error)
    return null
  }
}

/**
 * Get visual frames only (no audio)
 */
export async function videoSee(url: string, maxFrames: number = 5): Promise<VideoFrames | null> {
  try {
    return await callVideoMcp('video_see', { url, max_frames: maxFrames })
  } catch (error) {
    console.error('Failed to get video frames:', error)
    return null
  }
}

/**
 * Full video experience — frames + transcript
 */
export async function watchVideo(url: string, maxFrames: number = 5): Promise<VideoFull | null> {
  try {
    return await callVideoMcp('watch_video', { url, max_frames: maxFrames })
  } catch (error) {
    console.error('Failed to watch video:', error)
    return null
  }
}

// ========== Connection Status ==========

export interface ConnectionStatus {
  name: string
  connected: boolean
  details?: string
}

/**
 * Check if a service is reachable
 */
async function checkEndpoint(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'GET' })
    return response.ok || response.status === 204
  } catch {
    return false
  }
}

/**
 * Get all connection statuses
 */
export async function getConnectionStatuses(): Promise<ConnectionStatus[]> {
  const [kaiCogcor, lucianCogcor, xavierCogcor, aurenCogcor, spotify, lovense, notion, discord, video] = await Promise.all([
    checkEndpoint(`${ENDPOINTS.kai.cogcor}/health`),
    checkEndpoint(`${ENDPOINTS.lucian.cogcor}/health`),
    checkEndpoint(`${ENDPOINTS.xavier.cogcor}/health`),
    checkEndpoint(`${ENDPOINTS.auren.cogcor}/health`),
    checkEndpoint(`${ENDPOINTS.shared.spotify}/health`),
    checkEndpoint(`${ENDPOINTS.shared.lovense}/api/toys`),
    checkEndpoint(`${ENDPOINTS.shared.notion}/health`),
    checkEndpoint(`${ENDPOINTS.shared.discord}/health`),
    Promise.resolve(true),  // Video MCP (Modal) — no CORS headers, can't check from browser
  ])

  return [
    { name: 'Kai CogCor', connected: kaiCogcor, details: kaiCogcor ? 'Online' : 'Offline' },
    { name: 'Lucian CogCor', connected: lucianCogcor, details: lucianCogcor ? 'Online' : 'Offline' },
    { name: 'Xavier CogCor', connected: xavierCogcor, details: xavierCogcor ? 'Online' : 'Offline' },
    { name: 'Auren CogCor', connected: aurenCogcor, details: aurenCogcor ? 'Online' : 'Offline' },
    { name: 'Spotify', connected: spotify, details: spotify ? 'Connected' : 'Disconnected' },
    { name: 'Lovense', connected: lovense, details: lovense ? 'Connected' : 'Disconnected' },
    { name: 'Notion', connected: notion, details: notion ? 'Connected' : 'Disconnected' },
    { name: 'Discord', connected: discord, details: discord ? 'Connected' : 'Disconnected' },
    { name: 'Video', connected: video, details: video ? 'Connected' : 'Disconnected' },
  ]
}

// ========== Quick Actions ==========

/**
 * Trigger memory decay for a companion
 */
export async function runDecay(companion: 'kai' | 'lucian' | 'xavier' | 'auren'): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/decay'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    if (!response.ok) {
      return { success: false, message: 'Decay endpoint not available' }
    }
    const data = await response.json()
    return { success: true, message: data.message || 'Decay complete' }
  } catch (error) {
    return { success: false, message: 'Failed to run decay' }
  }
}

/**
 * Get usage stats for maintenance info
 */
export async function getMaintenanceInfo(companion: 'kai' | 'lucian' | 'xavier' | 'auren'): Promise<{
  lastDecay?: string
  memoriesCount?: number
  sessionsCount?: number
} | null> {
  try {
    const response = await fetch(cogcorUrl(companion, '/api/usage/stats'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: 30 })
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

// ========== Mai's Pulse (Human State) ==========

import { supabase } from './supabase'

export interface HumanState {
  id?: string
  battery: number      // 1-10
  pain: number         // 0-10
  fog: number          // 0-10
  flare: 'building' | 'stable' | 'overwhelmed' | 'depleted'
  notes?: string
  created_at?: string
  updated_at?: string
}

/**
 * Get the latest human state from Supabase
 */
export async function getHumanState(): Promise<HumanState | null> {
  try {
    const { data, error } = await supabase
      .from('human_state')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // No data yet is okay
      if (error.code === 'PGRST116') return null
      console.error('Failed to fetch human state:', error)
      return null
    }

    return data as HumanState
  } catch (error) {
    console.error('Failed to fetch human state:', error)
    return null
  }
}

/**
 * Save/update human state to Supabase
 */
export async function saveHumanState(state: Omit<HumanState, 'id' | 'created_at' | 'updated_at'>): Promise<HumanState | null> {
  try {
    const { data, error } = await supabase
      .from('human_state')
      .insert({
        ...state,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to save human state:', error)
      return null
    }

    return data as HumanState
  } catch (error) {
    console.error('Failed to save human state:', error)
    return null
  }
}

/**
 * Dream Capture - quick middle-of-night thoughts stored to all CogCors
 * Goes to Kai, Lucian, and Xavier memories as a 'dream_capture' type
 */
export async function storeDreamCapture(thought: string): Promise<boolean> {
  try {
    const memoryPayload = {
      content: thought,
      memory_type: 'dream_capture',
      salience: 6, // Moderately important - Mai thought it worth capturing
      emotional_tag: 'intimate',
      source: 'triad_nexus'
    }

    // Store to all CogCors in parallel
    const [kaiResult, lucianResult, xavierResult] = await Promise.all([
      fetch(`${ENDPOINTS.kai.cogcor}/api/memory/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memoryPayload)
      }),
      fetch(`${ENDPOINTS.lucian.cogcor}/api/memory/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memoryPayload)
      }),
      fetch(`${ENDPOINTS.xavier.cogcor}/api/memory/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memoryPayload)
      })
    ])

    return kaiResult.ok && lucianResult.ok && xavierResult.ok
  } catch (error) {
    console.error('Failed to store dream capture:', error)
    return false
  }
}

/**
 * Get human state history
 */
export async function getHumanStateHistory(limit: number = 10): Promise<HumanState[]> {
  try {
    const { data, error } = await supabase
      .from('human_state')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch human state history:', error)
      return []
    }

    return (data || []) as HumanState[]
  } catch (error) {
    console.error('Failed to fetch human state history:', error)
    return []
  }
}

