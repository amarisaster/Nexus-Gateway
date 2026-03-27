import { McpAgent } from 'agents/mcp'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Env } from './env'

import { registerCogCorTools } from './tools/cogcor'
import { registerSpotifyTools } from './tools/spotify'
import { registerDiscordTools } from './tools/discord'
import { registerLovenseTools } from './tools/lovense'
import { registerTelegramTools } from './tools/telegram'
import { registerBiometricsTools } from './tools/biometrics'
import { registerVideoTools } from './tools/video'
import { registerNanobananaTools } from './tools/nanobanana'
import { registerNotionTools } from './tools/notion'
import { registerCatalogueTools } from './tools/catalouge'

export class NexusGateway extends McpAgent<Env> {
  server = new McpServer({
    name: 'nexus-gateway',
    version: '1.0.0',
  })

  async init() {
    registerCogCorTools(this.server, this.env)
    registerSpotifyTools(this.server, this.env)
    registerDiscordTools(this.server, this.env)
    registerLovenseTools(this.server, this.env)
    registerTelegramTools(this.server, this.env)
    registerBiometricsTools(this.server, this.env)
    registerVideoTools(this.server, this.env)
    registerNanobananaTools(this.server, this.env)
    registerNotionTools(this.server, this.env)
    registerCatalogueTools(this.server, this.env)
  }
}

// CORS headers
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id',
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url)

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS })
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'nexus-gateway',
        version: '1.0.0',
      }), {
        headers: { 'Content-Type': 'application/json', ...CORS }
      })
    }

    // Antigravity notification fix: POST without Mcp-Session-Id that has no 'id' field
    // Antigravity doesn't send session ID on notifications — return 202 instead of erroring
    // This runs BEFORE auth because Antigravity may not send auth headers on notifications
    if (request.method === 'POST' && (url.pathname === '/mcp' || url.pathname === '/sse')) {
      const sessionId = request.headers.get('Mcp-Session-Id')
      if (!sessionId && url.pathname === '/mcp') {
        try {
          const clone = request.clone()
          const body = await clone.json() as any
          // If the body is a notification (no 'id' field), accept it silently
          if (body && typeof body === 'object' && !('id' in body)) {
            return new Response(null, { status: 202, headers: CORS })
          }
          // If it's a batch, check if ALL are notifications
          if (Array.isArray(body) && body.length > 0 && body.every((m: any) => !('id' in m))) {
            return new Response(null, { status: 202, headers: CORS })
          }
        } catch {
          // Not JSON or parse failed — fall through to normal handling
        }
      }
    }

    // Authentication check for /mcp and /sse endpoints
    // Skip if MCP_API_KEY is not set (development mode)
    if (env.MCP_API_KEY && (url.pathname === '/mcp' || url.pathname === '/sse' || url.pathname === '/sse/message')) {
      const authHeader = request.headers.get('Authorization')
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
      if (token !== env.MCP_API_KEY) {
        return new Response(JSON.stringify({ error: 'Unauthorized — invalid or missing Bearer token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...CORS }
        })
      }
    }

    // SSE transport
    if (url.pathname === '/sse' || url.pathname === '/sse/message') {
      return NexusGateway.serveSSE('/sse').fetch(request, env, ctx)
    }

    // Streamable HTTP transport
    if (url.pathname === '/mcp') {
      return NexusGateway.serve('/mcp').fetch(request, env, ctx)
    }

    return new Response('Nexus Gateway — MCP at /mcp, SSE at /sse', {
      status: 200,
      headers: { 'Content-Type': 'text/plain', ...CORS }
    })
  }
}
