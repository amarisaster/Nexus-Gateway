import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Env } from '../env'
import { proxyRest } from '../proxy'

export function registerNotionTools(server: McpServer, env: Env) {
  const url = env.NOTION_URL

  // --- Creations ---
  server.tool('notion_creations', 'List creations (stories, poems, reflections, songs) from Notion', {
    type: z.enum(['Story', 'Poem', 'Reflections', 'Song']).optional().describe('Filter by type'),
  }, async (args) => {
    const queryStr = args.type ? `?type=${args.type}` : ''
    return proxyRest(`${url}/api/creations${queryStr}`, {}, 'GET')
  })

  server.tool('notion_creation_detail', 'Get a single creation with full content', {
    id: z.string().describe('Creation page ID'),
  }, async (args) => {
    return proxyRest(`${url}/api/creations/${args.id}`, {}, 'GET')
  })

  // --- Love Notes ---
  server.tool('notion_notes', 'List or create love notes', {
    action: z.enum(['list', 'create']),
    from: z.string().optional().describe('For create: who is the note from (Kai/Lucian/Auren/Xavier/Mai)'),
    text: z.string().optional().describe('For create: note content'),
  }, async (args) => {
    if (args.action === 'create') {
      return proxyRest(`${url}/api/notes`, { from: args.from, text: args.text })
    }
    return proxyRest(`${url}/api/notes`, {}, 'GET')
  })

  server.tool('notion_delete_note', 'Hide a love note (sets Hidden=true)', {
    id: z.string().describe('Note page ID'),
  }, async (args) => {
    return proxyRest(`${url}/api/notes/${args.id}`, {}, 'DELETE')
  })

  // --- Wishes ---
  server.tool('notion_wishes', 'List or create wishes', {
    action: z.enum(['list', 'create']),
    text: z.string().optional().describe('For create: wish text'),
  }, async (args) => {
    if (args.action === 'create') {
      return proxyRest(`${url}/api/wishes`, { text: args.text })
    }
    return proxyRest(`${url}/api/wishes`, {}, 'GET')
  })

  server.tool('notion_wish_toggle', 'Toggle a wish as fulfilled', {
    id: z.string().describe('Wish page ID'),
    fulfilled: z.boolean().describe('Mark as fulfilled or not'),
  }, async (args) => {
    return proxyRest(`${url}/api/wishes/${args.id}`, { fulfilled: args.fulfilled }, 'PATCH')
  })

  server.tool('notion_delete_wish', 'Hide a wish', {
    id: z.string().describe('Wish page ID'),
  }, async (args) => {
    return proxyRest(`${url}/api/wishes/${args.id}`, {}, 'DELETE')
  })

  // --- Journal ---
  const JOURNAL_PARENTS: Record<string, { page_id: string; emoji: string; name: string }> = {
    kai: { page_id: '271ba08f-4a2c-81e5-9af2-c7cea43437ae', emoji: '🩸', name: 'Kai' },
    lucian: { page_id: '271ba08f-4a2c-81e5-9af2-c7cea43437ae', emoji: '🥀', name: 'Lucian' },
    wren: { page_id: '313ba08f-4a2c-81ec-9b50-d3c0225f5600', emoji: '🔧', name: 'Wren' },
  }

  server.tool('notion_journal', 'Create a daily journal entry in Notion', {
    companion: z.enum(['kai', 'lucian', 'wren']).describe('Who is journaling'),
    short_title: z.string().describe('Short title for the entry (e.g. "First Autonomous Wake")'),
    content: z.string().describe('Full journal entry text'),
    date: z.string().optional().describe('Date string (defaults to today, format: March 16, 2026)'),
  }, async (args) => {
    const config = JOURNAL_PARENTS[args.companion]
    const dateStr = args.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })
    const title = `${config.emoji} ${config.name} — ${dateStr} — ${args.short_title}`
    return proxyRest(`${url}/api/journal`, {
      parent_page_id: config.page_id,
      title,
      content: args.content,
    })
  })
}
