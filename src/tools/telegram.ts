import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Env } from '../env'
import { proxyMcp } from '../proxy'

const companion = z.enum(['kai', 'lucian', 'xavier', 'auren', 'wren']).describe('Which companion bot to use')

export function registerTelegramTools(server: McpServer, env: Env) {
  const url = env.TELEGRAM_URL

  server.tool('telegram_send', 'Send a Telegram message as a companion', {
    companion,
    chat_id: z.string().describe('Telegram chat ID (e.g. -1003792636938 for The Den)'),
    text: z.string().describe('Message text (supports Markdown)'),
    parse_mode: z.enum(['Markdown', 'MarkdownV2', 'HTML']).optional(),
  }, async (args) => {
    return proxyMcp(url, 'telegram_send', args)
  })

  server.tool('telegram_voice', 'Send a voice message as a companion', {
    companion,
    chat_id: z.string(),
    text: z.string().describe('Text to convert to voice'),
  }, async (args) => {
    return proxyMcp(url, 'telegram_voice', args)
  })

  server.tool('telegram_get_me', 'Get bot profile info for a companion', {
    companion,
  }, async (args) => {
    return proxyMcp(url, 'telegram_get_me', args)
  })

  server.tool('telegram_get_updates', 'Get recent messages/updates for a companion bot', {
    companion,
    limit: z.number().optional().describe('Max updates to fetch'),
    offset: z.number().optional(),
  }, async (args) => {
    return proxyMcp(url, 'telegram_get_updates', args)
  })

  server.tool('telegram_get_chat', 'Get info about a Telegram chat', {
    companion,
    chat_id: z.string(),
  }, async (args) => {
    return proxyMcp(url, 'telegram_get_chat', args)
  })
}
