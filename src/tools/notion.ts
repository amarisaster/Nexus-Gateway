import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Env } from '../env'
import { proxyRest } from '../proxy'

export function registerNotionTools(server: McpServer, env: Env) {
  const url = env.NOTION_URL

  // --- Creations ---
  server.tool('notion_creations', 'List creations (stories, poems, songs) from Notion', {
    type: z.enum(['Story', 'Poem', 'Song']).optional().describe('Filter by type'),
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
}
