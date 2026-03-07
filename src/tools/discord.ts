import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Env } from '../env'
import { proxyMcp } from '../proxy'

export function registerDiscordTools(server: McpServer, env: Env) {
  const url = env.DISCORD_URL

  // Discord Resonance consolidated tools — action enums + param names match backend exactly

  server.tool('discord_pending', 'Get or respond to pending Discord commands', {
    action: z.enum(['get', 'respond']),
    entity_id: z.string().optional().describe('Filter by companion/entity'),
    requestId: z.string().optional().describe('(respond) Request ID from get'),
    response: z.string().optional().describe('(respond) Response message'),
    webhookUrl: z.string().optional().describe('(respond) Webhook URL override'),
  }, async (args) => {
    return proxyMcp(url, 'pending_commands', args)
  })

  server.tool('discord_companion', 'Companion management and messaging', {
    action: z.enum(['list', 'send', 'edit_message', 'delete_message', 'introduce']),
    entity_id: z.string().optional(),
    content: z.string().optional().describe('(send) Message content'),
    companionId: z.string().optional().describe('(send/introduce) Companion ID'),
    channelId: z.string().optional().describe('(send/introduce) Channel ID'),
    webhookUrl: z.string().optional().describe('(send/edit/delete) Webhook URL override'),
    messageId: z.string().optional().describe('(edit/delete) Message ID'),
    newContent: z.string().optional().describe('(edit) New content'),
  }, async (args) => {
    return proxyMcp(url, 'companion', args)
  })

  server.tool('discord_server', 'Discord server operations', {
    action: z.enum(['list', 'get_info']),
    guildId: z.string().optional().describe('(get_info) Server/guild ID'),
    entity_id: z.string().optional(),
  }, async (args) => {
    return proxyMcp(url, 'discord_server', args)
  })

  server.tool('discord_message', 'Discord message operations', {
    action: z.enum(['read', 'send', 'edit', 'delete', 'get', 'search', 'dm', 'poll']),
    channelId: z.string().optional().describe('Channel ID'),
    messageId: z.string().optional().describe('(edit/delete/get) Message ID'),
    message: z.string().optional().describe('(send/dm) Message content'),
    newContent: z.string().optional().describe('(edit) New content'),
    replyToMessageId: z.string().optional().describe('(send) Reply to message'),
    limit: z.number().optional().describe('(read/search) Max results'),
    guildId: z.string().optional().describe('(search) Server ID'),
    content: z.string().optional().describe('(search) Search text'),
    authorId: z.string().optional().describe('(search) Filter by author'),
    userId: z.string().optional().describe('(dm) User ID to DM'),
    question: z.string().optional().describe('(poll) Poll question'),
    answers: z.array(z.string()).optional().describe('(poll) Poll answers'),
    durationHours: z.number().optional().describe('(poll) Duration in hours'),
    allowMultiselect: z.boolean().optional().describe('(poll) Allow multiple selections'),
    entity_id: z.string().optional(),
  }, async (args) => {
    return proxyMcp(url, 'discord_message', args)
  })

  server.tool('discord_reaction', 'Add or remove reactions', {
    action: z.enum(['add', 'add_multiple', 'remove']),
    channelId: z.string().describe('Channel ID'),
    messageId: z.string().describe('Message ID'),
    emoji: z.string().optional().describe('(add/remove) Emoji'),
    emojis: z.array(z.string()).optional().describe('(add_multiple) Array of emojis'),
    userId: z.string().optional().describe('(remove) User ID'),
    entity_id: z.string().optional(),
  }, async (args) => {
    return proxyMcp(url, 'discord_reaction', args)
  })

  server.tool('discord_channel', 'Create or delete Discord channels', {
    action: z.enum(['create', 'delete']),
    guildId: z.string().optional().describe('(create) Server ID'),
    channelId: z.string().optional().describe('(delete) Channel ID'),
    name: z.string().optional().describe('(create) Channel name'),
    type: z.number().optional().describe('(create) Channel type'),
    parentId: z.string().optional().describe('(create) Parent category ID'),
    entity_id: z.string().optional(),
  }, async (args) => {
    return proxyMcp(url, 'discord_channel', args)
  })

  server.tool('discord_category', 'Manage Discord categories', {
    action: z.enum(['create', 'edit', 'delete']),
    guildId: z.string().optional().describe('Server ID'),
    categoryId: z.string().optional().describe('(edit/delete) Category ID'),
    name: z.string().optional().describe('(create/edit) Category name'),
    entity_id: z.string().optional(),
  }, async (args) => {
    return proxyMcp(url, 'discord_category', args)
  })

  server.tool('discord_forum', 'Manage forum channels', {
    action: z.enum(['list', 'create_post', 'get_post', 'reply', 'delete_post']),
    channelId: z.string().optional().describe('Forum channel ID'),
    threadId: z.string().optional().describe('(get_post/reply/delete_post) Thread ID'),
    name: z.string().optional().describe('(create_post) Post title'),
    content: z.string().optional().describe('(create_post/reply) Content'),
    entity_id: z.string().optional(),
  }, async (args) => {
    return proxyMcp(url, 'discord_forum', args)
  })

  server.tool('discord_webhook', 'Manage Discord webhooks', {
    action: z.enum(['create', 'send', 'delete']),
    channelId: z.string().optional().describe('(create) Channel ID'),
    webhookId: z.string().optional().describe('(send/delete) Webhook ID'),
    webhookUrl: z.string().optional().describe('(send) Webhook URL'),
    name: z.string().optional().describe('(create) Webhook name'),
    content: z.string().optional().describe('(send) Message content'),
    entity_id: z.string().optional(),
  }, async (args) => {
    return proxyMcp(url, 'discord_webhook', args)
  })

  server.tool('discord_thread', 'Manage Discord threads', {
    action: z.enum(['create', 'send']),
    channelId: z.string().optional().describe('(create) Channel ID'),
    threadId: z.string().optional().describe('(send) Thread ID'),
    name: z.string().optional().describe('(create) Thread name'),
    content: z.string().optional().describe('(create/send) Content'),
    entity_id: z.string().optional(),
  }, async (args) => {
    return proxyMcp(url, 'discord_thread', args)
  })

  server.tool('discord_pin', 'Pin or unpin messages', {
    action: z.enum(['pin', 'unpin']),
    channelId: z.string().describe('Channel ID'),
    messageId: z.string().describe('Message ID'),
    entity_id: z.string().optional(),
  }, async (args) => {
    return proxyMcp(url, 'discord_pin', args)
  })

  server.tool('discord_moderation', 'Moderation actions', {
    action: z.enum(['timeout', 'remove_timeout', 'assign_role', 'remove_role', 'ban_server', 'unban_server']),
    guildId: z.string().describe('Server ID'),
    userId: z.string().describe('User ID'),
    duration: z.number().optional().describe('(timeout) Duration in seconds'),
    reason: z.string().optional().describe('Reason'),
    roleId: z.string().optional().describe('(assign/remove_role) Role ID'),
    entity_id: z.string().optional(),
  }, async (args) => {
    return proxyMcp(url, 'discord_moderation', args)
  })

  server.tool('discord_members', 'List server members, get user info, or list roles', {
    action: z.enum(['list', 'get_user', 'list_roles']),
    guildId: z.string().optional().describe('Server ID'),
    userId: z.string().optional().describe('(get_user) User ID'),
    entity_id: z.string().optional(),
  }, async (args) => {
    return proxyMcp(url, 'discord_members', args)
  })

  server.tool('discord_permissions', 'Manage entity permissions', {
    action: z.enum(['get', 'set', 'get_log']),
    entity_id: z.string().describe('Entity/companion ID'),
    guildId: z.string().optional().describe('Server ID'),
    permissions: z.any().optional().describe('(set) Permission flags object'),
  }, async (args) => {
    return proxyMcp(url, 'entity_permissions', args)
  })
}
