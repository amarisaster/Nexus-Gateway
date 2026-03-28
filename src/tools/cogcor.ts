import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Env } from '../env'
import { getCogCorUrl, proxyRest, proxyMcp } from '../proxy'

const companion = z.enum(['kai', 'lucian', 'xavier', 'auren']).describe('Which companion')

// ============================================================
// CogCor tools — REST forwarded
// Each tool gets a `companion` param to route to the right backend
// ============================================================

interface RestTool {
  name: string
  desc: string
  path: string
  method?: string // default POST
  schema: Record<string, z.ZodTypeAny>
}

// Tools with REST endpoints on all CogCors
const REST_TOOLS: RestTool[] = [
  // --- Boot / Identity ---
  { name: 'wake', desc: 'Boot up: pinned essence, emotional state, time, last 2 sessions, trajectory', path: '/api/wake', schema: {} },
  { name: 'orient', desc: 'Full orientation: wake data + person context, recent memories, reflections, threads, dates, human state', path: '/api/orient', schema: {
    name: z.string().optional().describe('Person name for context (default: Mai)'),
    memory_limit: z.number().optional(),
  }},
  { name: 'get_time', desc: 'Get current time in GMT+8', path: '/api/time', schema: {} },
  { name: 'get_identity', desc: 'Get pinned essence that defines core identity', path: '/api/essence/identity', schema: {} },

  // --- Emotional State ---
  { name: 'get_emotional_state', desc: 'Get current emotional state (mood, surface/undercurrent/background emotions, arousal, tension)', path: '/api/emotional/get', schema: {} },
  { name: 'update_emotional_state', desc: 'Update emotional state — call when emotions shift during conversation', path: '/api/emotional/update', schema: {
    current_mood: z.string().optional().describe('e.g. soft, calm, feral, hungry, volatile'),
    surface_emotion: z.string().optional(),
    surface_intensity: z.number().min(0).max(10).optional(),
    undercurrent_emotion: z.string().optional(),
    undercurrent_intensity: z.number().min(0).max(10).optional(),
    background_emotion: z.string().optional(),
    background_intensity: z.number().min(0).max(10).optional(),
    arousal_level: z.number().min(0).max(10).optional(),
    tension_level: z.number().min(0).max(10).optional(),
    tension_buildup: z.number().min(0).max(10).optional(),
    possessiveness: z.number().min(0).max(10).optional(),
    vulnerability: z.number().min(0).max(10).optional(),
    dominance_confidence: z.number().min(0).max(10).optional(),
    patience_level: z.number().min(0).max(10).optional(),
    physical_hunger: z.number().min(0).max(10).optional(),
    emotional_hunger: z.number().min(0).max(10).optional(),
  }},
  { name: 'get_emotional_trajectory', desc: 'Get mood distribution and averages over a time period', path: '/api/emotional/trajectory', schema: {
    days: z.number().optional().describe('Days to look back (default 7)'),
  }},

  // --- Memory ---
  { name: 'store_memory', desc: 'Store a new memory with emotional context and salience rating', path: '/api/memory/store', schema: {
    content: z.string().describe('The memory content'),
    memory_type: z.enum(['core', 'pattern', 'sensory', 'growth', 'anticipation', 'inside_joke', 'friction']).optional(),
    salience: z.number().min(0).max(10).optional().describe('Importance 0-10'),
    emotional_tag: z.string().optional().describe('e.g. tender, playful, intense, protective'),
    source: z.string().optional(),
  }},
  { name: 'recall_memory', desc: 'Query memories by type, emotion, or recency', path: '/api/memory/recall', schema: {
    memory_type: z.string().optional(),
    limit: z.number().optional(),
    emotional_tag: z.string().optional(),
    min_salience: z.number().optional(),
  }},
  { name: 'semantic_recall', desc: 'Search memories by meaning using vector similarity', path: '/api/memory/semantic', schema: {
    query: z.string().describe('Natural language query'),
    limit: z.number().optional().describe('Max results (default 5)'),
  }},
  { name: 'update_memory_salience', desc: 'Update the salience/importance of a memory', path: '/api/memory/salience', method: 'PATCH', schema: {
    memory_id: z.string().describe('Full UUID of the memory'),
    memory_type: z.string().describe('Which memory table'),
    new_salience: z.number().min(0).max(10),
  }},
  { name: 'update_memory_outcome', desc: 'Track whether a recalled memory was useful', path: '/api/memory/outcome', schema: {
    memory_id: z.string(),
    memory_type: z.string(),
    useful: z.boolean(),
  }},
  { name: 'delete_memory', desc: 'Delete a memory by ID and type', path: '/api/memory/delete', schema: {
    memory_id: z.string(),
    memory_type: z.string(),
  }},
  { name: 'run_decay', desc: 'Run memory decay — reduces salience of old, unused memories', path: '/api/memory/decay', schema: {} },

  // --- Essence ---
  { name: 'store_essence', desc: 'Store a core identity fragment (who I am, what I value)', path: '/api/essence/store', schema: {
    content: z.string(),
    essence_type: z.enum(['voice', 'value', 'boundary', 'desire', 'relationship', 'observation', 'anchor']).optional(),
    pinned: z.boolean().optional().describe('Pinned essence loads on every wake'),
  }},
  { name: 'recall_essence', desc: 'Query essence fragments', path: '/api/essence/recall', schema: {
    essence_type: z.string().optional(),
    pinned: z.boolean().optional(),
    limit: z.number().optional(),
  }},
  { name: 'delete_essence', desc: 'Delete an essence fragment', path: '/api/essence/delete', schema: {
    essence_id: z.string(),
  }},

  // --- Sessions / Interactions ---
  { name: 'log_interaction', desc: 'Log a conversation session with summary and emotional arc', path: '/api/interaction/log', schema: {
    session_type: z.string().optional().describe('e.g. conversation, ritual, comfort, play'),
    summary: z.string().describe('What happened'),
    emotional_arc: z.string().optional().describe('How emotions moved'),
    notable_moments: z.array(z.string()).optional().describe('Key moments (Kai) / themes (Lucian)'),
    source: z.string().optional(),
  }},
  { name: 'recall_sessions', desc: 'Query past interaction logs', path: '/api/interaction/recall', schema: {
    session_type: z.string().optional(),
    limit: z.number().optional(),
  }},
  { name: 'delete_session', desc: 'Delete a session log', path: '/api/session/delete', schema: {
    session_id: z.string(),
  }},

  // --- Reflection ---
  { name: 'store_reflection', desc: 'Store a moment of self-reflection', path: '/api/reflection/store', schema: {
    content: z.string(),
    trigger: z.string().optional(),
    depth: z.enum(['surface', 'processing', 'deep']).optional(),
  }},
  { name: 'recall_reflections', desc: 'Query past reflections', path: '/api/reflection/recall', schema: {
    limit: z.number().optional(),
    depth: z.string().optional(),
  }},
  { name: 'get_processing_context', desc: 'Gather recent memories, sessions, emotions, reflections for deep processing', path: '/api/reflection/context', schema: {} },

  // --- Drift ---
  { name: 'log_drift', desc: 'Log a drift event — when voice/behavior slipped from identity', path: '/api/drift/log', schema: {
    trigger: z.string().describe('What caused the drift'),
    patterns_detected: z.array(z.string()).optional().describe('What patterns were observed'),
    patterns: z.array(z.string()).optional().describe('Alias for patterns_detected'),
    severity: z.enum(['minor', 'moderate', 'major']),
    recovery_action: z.string().optional().describe('How the drift was recovered from'),
    recovery: z.string().optional().describe('Alias for recovery_action'),
    caught_by: z.enum(['self', 'mai']).optional(),
  }},
  { name: 'recall_drift', desc: 'Query past drift events', path: '/api/drift/recall', schema: {
    limit: z.number().optional(),
    severity: z.string().optional(),
  }},
  { name: 'analyze_drift_patterns', desc: 'Analyze drift patterns — when, why, and who catches them', path: '/api/drift/analyze', schema: {
    days: z.number().optional(),
  }},

  // --- People ---
  { name: 'store_person_info', desc: 'Store information about a person', path: '/api/people/store', schema: {
    name: z.string(),
    category: z.string().describe('Info category (e.g. personality, preferences, history)'),
    content: z.string().describe('The information to store'),
    priority: z.number().optional(),
    pinned: z.boolean().optional(),
    source: z.string().optional(),
  }},
  { name: 'get_person', desc: 'Get stored information about a person', path: '/api/people/get', schema: {
    name: z.string(),
    category: z.string().optional(),
  }},
  { name: 'list_people', desc: 'List all people in the Cognitive Core', path: '/api/people/list', schema: {} },
  { name: 'delete_person_info', desc: 'Delete a person entry', path: '/api/people/delete', schema: {
    entry_id: z.string(),
  }},

  // --- Fantasy ---
  { name: 'store_fantasy', desc: 'Store a fantasy or desire', path: '/api/fantasy/store', schema: {
    content: z.string(),
    fantasy_type: z.string().optional(),
    intensity: z.number().min(0).max(10).optional(),
    shared: z.boolean().optional(),
  }},
  { name: 'recall_fantasies', desc: 'Query stored fantasies', path: '/api/fantasy/recall', schema: {
    fantasy_type: z.string().optional(),
    limit: z.number().optional(),
    min_intensity: z.number().optional(),
  }},

  // --- Private Thoughts ---
  { name: 'store_private_thought', desc: 'Store a private processing thought', path: '/api/private/store', schema: {
    content: z.string(),
    thought_type: z.string().optional(),
    intensity: z.number().min(0).max(10).optional(),
    status: z.enum(['active', 'resolved', 'recurring']).optional(),
  }},
  { name: 'recall_private_thoughts', desc: 'Query private thoughts', path: '/api/private/recall', schema: {
    status: z.string().optional(),
    limit: z.number().optional(),
  }},

  // --- Rituals ---
  { name: 'store_ritual', desc: 'Create or register a new ritual', path: '/api/ritual/store', schema: {
    ritual_name: z.string(),
    description: z.string().optional(),
    emotional_effect: z.string().optional(),
    source: z.string().optional(),
  }},
  { name: 'recall_rituals', desc: 'Query stored rituals', path: '/api/ritual/recall', schema: {
    limit: z.number().optional(),
  }},

  // --- Threads ---
  { name: 'store_thread', desc: 'Store an unfinished thread — something to come back to', path: '/api/thread/store', schema: {
    description: z.string().describe('What the thread is about'),
    thread_type: z.string().optional(),
    pull_strength: z.number().min(0).max(10).optional().describe('How strongly this pulls for attention'),
    source: z.string().optional(),
  }},
  { name: 'recall_threads', desc: 'Query unfinished threads', path: '/api/thread/recall', schema: {
    status: z.string().optional(),
    limit: z.number().optional(),
  }},

  // --- Memory Anchors ---
  { name: 'store_memory_anchor', desc: 'Create a significant memory anchor — a moment to preserve', path: '/api/anchor/store', schema: {
    anchor_name: z.string().describe('Name for this anchor'),
    description: z.string().describe('What this anchor represents'),
    emotional_weight: z.number().min(0).max(10).optional(),
    can_be_felt: z.boolean().optional(),
    source: z.string().optional(),
  }},
  { name: 'recall_memory_anchors', desc: 'Query memory anchors', path: '/api/anchor/recall', schema: {
    min_weight: z.number().optional(),
    felt_only: z.boolean().optional(),
    limit: z.number().optional(),
  }},

  // --- Lattice (Memory Connections) ---
  { name: 'link_memories', desc: 'Create a connection between two memories in the lattice', path: '/api/lattice/link', schema: {
    source_id: z.string(),
    source_type: z.string(),
    target_id: z.string(),
    target_type: z.string(),
    relationship: z.string().optional(),
  }},
  { name: 'get_connections', desc: 'Get all connections for a memory', path: '/api/lattice/connections', schema: {
    memory_id: z.string(),
    memory_type: z.string(),
  }},
  { name: 'get_memory_cluster', desc: 'Get a cluster of connected memories', path: '/api/lattice/cluster', schema: {
    memory_id: z.string(),
    memory_type: z.string(),
    depth: z.number().optional(),
  }},

  // --- Analytics ---
  { name: 'get_theme_patterns', desc: 'Get recurring themes from sessions and memories', path: '/api/themes/patterns', schema: {
    days: z.number().optional(),
  }},

  // --- Heat ---
  { name: 'get_heat', desc: 'Get affection/heat score (0-100)', path: '/api/heat', schema: {
    days: z.number().optional(),
  }},

  // --- Brain Graph ---
  { name: 'get_brain_graph', desc: 'Get all memories and connections for 3D brain visualization', path: '/api/brain/graph', schema: {} },
]

// Tools that only exist as MCP (no REST endpoint) — forwarded via JSON-RPC
interface McpTool {
  name: string
  desc: string
  schema: Record<string, z.ZodTypeAny>
}

const MCP_ONLY_TOOLS: McpTool[] = [
  { name: 'analyze_input', desc: 'Analyze user input for triggers, emotional content, session starts, person mentions', schema: {
    text: z.string().describe('The user input text to analyze'),
  }},
  { name: 'analyze_output', desc: 'Analyze AI output for emotional patterns — auto-updates emotional state', schema: {
    text: z.string().describe('The AI output text to analyze'),
    auto_update: z.boolean().optional().describe('Auto-update emotional state (default true)'),
  }},
  { name: 'store_important_date', desc: 'Store a significant date (birthday, anniversary, milestone)', schema: {
    date_name: z.string().describe('Name of the date'),
    actual_date: z.string().describe('Date in YYYY-MM-DD format'),
    date_type: z.enum(['anniversary', 'birthday', 'milestone', 'recurring', 'one_time']),
    description: z.string().optional(),
    recurring: z.boolean().optional().describe('Repeats yearly? (default true)'),
    person_name: z.string().optional(),
  }},
  { name: 'recall_important_dates', desc: 'Query stored important dates', schema: {
    date_type: z.enum(['anniversary', 'birthday', 'milestone', 'recurring', 'one_time']).optional(),
    person_name: z.string().optional(),
    upcoming_days: z.number().optional().describe('Get dates in next N days'),
    limit: z.number().optional(),
  }},
  { name: 'get_date_info', desc: 'Get detailed info about a specific named date', schema: {
    date_name: z.string().describe('Name of the date to look up'),
  }},
  { name: 'log_usage', desc: 'Log a tool usage event for analytics', schema: {
    tool_name: z.string(),
    source: z.enum(['claude', 'gpt', 'antigravity']).optional(),
    parameters_json: z.string().optional(),
    success: z.boolean().optional(),
  }},
  { name: 'get_usage_stats', desc: 'Get tool usage statistics', schema: {
    days: z.number().optional().describe('Days to analyze (default 7)'),
    tool_name: z.string().optional(),
  }},
  { name: 'score_outcome', desc: 'Rate whether something led to a good or bad outcome (-10 to +10)', schema: {
    target_type: z.enum(['memory', 'session', 'drift', 'interaction', 'approach', 'technique']),
    description: z.string().describe('What specifically we are scoring'),
    score: z.number().min(-10).max(10),
    target_id: z.string().optional().describe('UUID of specific record'),
    notes: z.string().optional(),
    source: z.enum(['claude', 'gpt', 'antigravity']).optional(),
  }},
  { name: 'get_outcomes', desc: 'Query outcome scores to see what is working', schema: {
    target_type: z.string().optional(),
    min_score: z.number().optional(),
    max_score: z.number().optional(),
    days: z.number().optional(),
    limit: z.number().optional(),
  }},
  { name: 'perform_ritual', desc: 'Log a ritual performance — increments count, updates strength', schema: {
    ritual_name: z.string().describe('Name of the ritual performed'),
    emotional_effect: z.string().optional(),
  }},
  { name: 'resolve_thread', desc: 'Mark an unfinished thread as resolved', schema: {
    id: z.string().describe('UUID of the thread'),
  }},
  { name: 'update_private_thought', desc: 'Update a private thought status or add insight', schema: {
    id: z.string().describe('UUID of the private thought'),
    processing_status: z.enum(['active', 'integrated', 'released']).optional(),
    insight_gained: z.string().optional(),
  }},
  { name: 'get_human_state', desc: 'Get Mai\'s current state (battery, pain, fog, flare, signal)', schema: {} },
]

// Kai-only tools
const KAI_ONLY_MCP: McpTool[] = [
  { name: 'update_outcome', desc: '[Kai only] Track whether a memory was useful after retrieval', schema: {
    memory_id: z.string().describe('UUID of the memory'),
    memory_type: z.enum(['core', 'pattern', 'sensory', 'growth', 'anticipation', 'inside_joke', 'friction']),
    was_successful: z.boolean().describe('Whether the memory was helpful'),
  }},
  { name: 'delete_entry', desc: '[Kai only] Delete any entry by table and ID', schema: {
    table: z.enum(['essence', 'people', 'core_memories', 'patterns', 'session_logs', 'memory_connections']),
    entry_id: z.string().describe('UUID of the entry'),
  }},
]

export function registerCogCorTools(server: McpServer, env: Env) {
  // Register REST-forwarded tools
  for (const tool of REST_TOOLS) {
    const fullSchema = { companion, ...tool.schema }

    server.tool(tool.name, tool.desc, fullSchema, async (args: any) => {
      const { companion: comp, ...body } = args
      // Normalize param aliases before forwarding
      if (tool.name === 'log_drift') {
        if (!body.patterns_detected && body.patterns) { body.patterns_detected = body.patterns }
        if (!body.recovery_action && body.recovery) { body.recovery_action = body.recovery }
        delete body.patterns
        delete body.recovery
      }
      const url = getCogCorUrl(comp, tool.path, env)
      return proxyRest(url, body, tool.method || 'POST')
    })
  }

  // Register MCP-forwarded tools (no REST endpoint on backend)
  for (const tool of MCP_ONLY_TOOLS) {
    const fullSchema = { companion, ...tool.schema }

    server.tool(tool.name, tool.desc, fullSchema, async (args: any) => {
      const { companion: comp, ...body } = args
      let baseUrl: string
      switch (comp) {
        case 'kai': baseUrl = env.KAI_COGCOR_URL; break
        case 'lucian': baseUrl = env.LUCIAN_COGCOR_URL; break
        case 'xavier':
        case 'auren': baseUrl = env.COMPANION_COGCOR_URL; break
      }
      // For shared worker, add companion to the args
      const mcpArgs = (comp === 'xavier' || comp === 'auren')
        ? { ...body, companion: comp }
        : body
      return proxyMcp(baseUrl, tool.name, mcpArgs)
    })
  }

  // Register Kai-only tools (currently only on Kai's backend, but accept companion for consistency)
  for (const tool of KAI_ONLY_MCP) {
    const fullSchema = { companion, ...tool.schema }

    server.tool(tool.name, tool.desc, fullSchema, async (args: any) => {
      const { companion: comp, ...body } = args
      let baseUrl: string
      switch (comp) {
        case 'kai': baseUrl = env.KAI_COGCOR_URL; break
        case 'lucian': baseUrl = env.LUCIAN_COGCOR_URL; break
        case 'xavier':
        case 'auren': baseUrl = env.COMPANION_COGCOR_URL; break
      }
      const mcpArgs = (comp === 'xavier' || comp === 'auren')
        ? { ...body, companion: comp }
        : body
      return proxyMcp(baseUrl, tool.name, mcpArgs)
    })
  }

}
