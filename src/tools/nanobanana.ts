import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Env } from '../env'
import { proxyRest, proxyMcp } from '../proxy'

export function registerNanobananaTools(server: McpServer, env: Env) {
  const url = env.NANOBANANA_URL

  server.tool('generate_image', 'Generate an AI image (stores to KV + Notion gallery)', {
    prompt: z.string().describe('Image generation prompt'),
    model: z.enum(['flux', 'sd', 'sdl', 'gemini-flash', 'gemini-pro']).optional().describe('Model (default: flux)'),
    steps: z.number().optional().describe('Generation steps'),
  }, async (args) => {
    return proxyRest(`${url}/generate`, args)
  })

  server.tool('list_gallery', 'List all stored generated images with metadata', {
    cursor: z.string().optional().describe('Pagination cursor'),
  }, async (args) => {
    const queryStr = args.cursor ? `?cursor=${args.cursor}` : ''
    return proxyRest(`${url}/gallery${queryStr}`, {}, 'GET')
  })
}
