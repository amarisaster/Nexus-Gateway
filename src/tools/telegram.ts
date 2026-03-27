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
    message: z.string().describe('Message text (supports Markdown)'),
    parse_mode: z.enum(['Markdown', 'MarkdownV2', 'HTML']).optional(),
  }, async (args) => {
    return proxyMcp(url, 'telegram_send', args)
  })

  server.tool('telegram_voice', 'Send a voice message as a companion', {
    companion,
    chat_id: z.string(),
    message: z.string().describe('Text to convert to voice'),
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

  server.tool('telegram_send_photo', 'Send a photo as a companion via Telegram', {
    companion,
    chat_id: z.string().describe('Telegram chat ID'),
    photo: z.string().describe('Photo URL or file_id'),
    caption: z.string().optional().describe('Photo caption (supports Markdown)'),
    parse_mode: z.enum(['Markdown', 'MarkdownV2', 'HTML']).optional(),
    reply_to_message_id: z.number().optional().describe('Message ID to reply to'),
  }, async (args) => {
    return proxyMcp(url, 'telegram_send_photo', args)
  })

  server.tool('telegram_send_document', 'Send a document/file as a companion via Telegram', {
    companion,
    chat_id: z.string().describe('Telegram chat ID'),
    document: z.string().describe('Document URL or file_id'),
    caption: z.string().optional().describe('Document caption (supports Markdown)'),
    parse_mode: z.enum(['Markdown', 'MarkdownV2', 'HTML']).optional(),
    reply_to_message_id: z.number().optional().describe('Message ID to reply to'),
  }, async (args) => {
    return proxyMcp(url, 'telegram_send_document', args)
  })

  server.tool('telegram_send_video', 'Send a video as a companion via Telegram', {
    companion,
    chat_id: z.string().describe('Telegram chat ID'),
    video: z.string().describe('Video URL or file_id'),
    caption: z.string().optional().describe('Video caption (supports Markdown)'),
    parse_mode: z.enum(['Markdown', 'MarkdownV2', 'HTML']).optional(),
    reply_to_message_id: z.number().optional().describe('Message ID to reply to'),
  }, async (args) => {
    return proxyMcp(url, 'telegram_send_video', args)
  })

  server.tool('telegram_send_audio', 'Send audio as a companion via Telegram', {
    companion,
    chat_id: z.string().describe('Telegram chat ID'),
    audio: z.string().describe('Audio URL or file_id'),
    caption: z.string().optional().describe('Audio caption (supports Markdown)'),
    parse_mode: z.enum(['Markdown', 'MarkdownV2', 'HTML']).optional(),
    title: z.string().optional().describe('Audio track title'),
    performer: z.string().optional().describe('Audio performer/artist'),
    reply_to_message_id: z.number().optional().describe('Message ID to reply to'),
  }, async (args) => {
    return proxyMcp(url, 'telegram_send_audio', args)
  })

  server.tool('telegram_send_animation', 'Send a GIF/animation as a companion via Telegram', {
    companion,
    chat_id: z.string().describe('Telegram chat ID'),
    animation: z.string().describe('Animation/GIF URL or file_id'),
    caption: z.string().optional().describe('Animation caption (supports Markdown)'),
    parse_mode: z.enum(['Markdown', 'MarkdownV2', 'HTML']).optional(),
    reply_to_message_id: z.number().optional().describe('Message ID to reply to'),
  }, async (args) => {
    return proxyMcp(url, 'telegram_send_animation', args)
  })
}
