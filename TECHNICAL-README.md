# MCP Gateway

A single MCP endpoint that proxies multiple backend MCP servers and REST APIs. Connect one server to Claude (or any MCP client) and get access to all your tools.

**Problem:** You have 10 MCP servers. Claude/Antigravity/Cursor can only handle so many connections, configs get messy, and each backend needs its own session management.

**Solution:** One gateway. One endpoint. All your tools.

```
Claude / Cursor / Antigravity
          |
    POST /mcp (121 tools)
          |
   +----- Gateway -----+
   |   |   |   |   |   |
  REST MCP MCP REST MCP MCP
   |   |   |   |   |   |
  svc  svc svc svc svc svc
```

## How It Works

The gateway is a Cloudflare Worker using [`McpAgent`](https://developers.cloudflare.com/agents/guides/remote-mcp-server/) (Durable Objects). It registers proxy tools that forward calls to your actual backend services.

Two proxy modes:

- **REST proxy** — For backends with HTTP/REST endpoints. Fast, stateless, no session overhead.
- **MCP proxy** — For backends that only expose MCP tools (no REST). Initializes a JSON-RPC session per call, forwards the tool invocation, returns the result.

The client (Claude, etc.) sees one flat list of tools. It doesn't know or care that `spotify_search` goes to one server and `biometrics_sync` goes to another.

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/yourname/mcp-gateway.git
cd mcp-gateway
npm install
```

### 2. Configure backends

Edit `wrangler.toml` — add your backend URLs:

```toml
name = "mcp-gateway"
main = "src/index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[[durable_objects.bindings]]
name = "MCP_OBJECT"
class_name = "McpGateway"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["McpGateway"]

[vars]
SPOTIFY_URL = "https://your-spotify-mcp.workers.dev"
WEATHER_URL = "https://your-weather-api.example.com"
NOTES_URL = "https://your-notes-mcp.workers.dev"
```

### 3. Register tools

Create a file per backend in `src/tools/`. Each file exports a register function.

**REST backend** (your service has normal HTTP endpoints):

```typescript
// src/tools/weather.ts
import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Env } from '../env'
import { proxyRest } from '../proxy'

export function registerWeatherTools(server: McpServer, env: Env) {
  const url = env.WEATHER_URL

  server.tool('get_weather', 'Get current weather for a city', {
    city: z.string().describe('City name'),
    units: z.enum(['metric', 'imperial']).optional(),
  }, async (args) => {
    return proxyRest(`${url}/api/weather`, args)
  })

  server.tool('get_forecast', 'Get 5-day forecast', {
    city: z.string(),
    days: z.number().optional().describe('Number of days (default 5)'),
  }, async (args) => {
    return proxyRest(`${url}/api/forecast`, args)
  })
}
```

**MCP backend** (your service only exposes MCP tools, no REST):

```typescript
// src/tools/notes.ts
import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Env } from '../env'
import { proxyMcp } from '../proxy'

export function registerNotesTools(server: McpServer, env: Env) {
  const url = env.NOTES_URL

  server.tool('create_note', 'Create a new note', {
    title: z.string(),
    content: z.string(),
    tags: z.array(z.string()).optional(),
  }, async (args) => {
    return proxyMcp(url, 'create_note', args)
  })

  server.tool('search_notes', 'Search notes by query', {
    query: z.string(),
    limit: z.number().optional(),
  }, async (args) => {
    return proxyMcp(url, 'search_notes', args)
  })
}
```

### 4. Wire it up

```typescript
// src/index.ts
import { McpAgent } from 'agents/mcp'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Env } from './env'

import { registerWeatherTools } from './tools/weather'
import { registerNotesTools } from './tools/notes'
import { registerSpotifyTools } from './tools/spotify'

export class McpGateway extends McpAgent<Env> {
  server = new McpServer({
    name: 'mcp-gateway',
    version: '1.0.0',
  })

  async init() {
    registerWeatherTools(this.server, this.env)
    registerNotesTools(this.server, this.env)
    registerSpotifyTools(this.server, this.env)
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS })
    }

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json', ...CORS }
      })
    }

    // SSE transport (for clients that need it)
    if (url.pathname === '/sse' || url.pathname === '/sse/message') {
      return McpGateway.serveSSE('/sse').fetch(request, env, ctx)
    }

    // Streamable HTTP transport (primary)
    if (url.pathname === '/mcp') {
      return McpGateway.serve('/mcp').fetch(request, env, ctx)
    }

    return new Response('MCP Gateway — POST /mcp or GET /sse', {
      headers: { 'Content-Type': 'text/plain', ...CORS }
    })
  }
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id',
}
```

### 5. Deploy

```bash
npx wrangler deploy
```

Your gateway is now live. Connect Claude, Cursor, or any MCP client to `https://your-gateway.workers.dev/mcp`.

## The Proxy Layer

### `proxyRest(url, body, method)`

Forwards to a standard HTTP endpoint. Returns the response wrapped in MCP's `{ content: [{ type: 'text', text }] }` format.

```typescript
// GET request
return proxyRest(`${url}/api/items`, {}, 'GET')

// POST with body
return proxyRest(`${url}/api/items`, { name: args.name, value: args.value })

// DELETE
return proxyRest(`${url}/api/items/${args.id}`, {}, 'DELETE')
```

### `proxyMcp(baseUrl, toolName, args)`

Forwards to another MCP server via JSON-RPC. Handles the full handshake:

1. `POST /mcp` — Send `initialize` request, get session ID from response header
2. `POST /mcp` — Send `tools/call` with the session ID, tool name, and arguments
3. Parse the response (handles both JSON and SSE formats)

```typescript
// Forward to backend MCP tool with the same name
return proxyMcp(url, 'spotify_search', args)

// Forward to a differently-named backend tool
return proxyMcp(url, 'pending_commands', args) // gateway exposes as 'discord_pending'
```

### Schema matching

Your gateway tool schema doesn't need to be identical to the backend's — the gateway validates what the client sends, then forwards the raw args. But **parameter names must match the backend exactly**, or the backend will reject the call.

```typescript
// If the backend expects { channelId: string }
// DON'T define your schema as { channel_id: z.string() }  -- won't work
// DO define it as { channelId: z.string() }                -- matches backend
```

## Gotchas

### Durable Object binding must be `MCP_OBJECT`

The `agents` library hardcodes this. Don't rename it.

```toml
# wrangler.toml
[[durable_objects.bindings]]
name = "MCP_OBJECT"        # <-- must be exactly this
class_name = "McpGateway"
```

### `z.record()` breaks with Zod v4

The MCP SDK uses `zod-to-json-schema` to serialize tool schemas for `tools/list`. As of `zod-to-json-schema@3.25.1`, `z.record(z.boolean())` (and possibly other `z.record()` variants) causes:

```
Cannot read properties of undefined (reading '_zod')
```

This error only appears when a client calls `tools/list`, not at registration time.

**Fix:** Use `z.any()` instead of `z.record()`.

```typescript
// Breaks
permissions: z.record(z.boolean()).optional()

// Works
permissions: z.any().optional().describe('Object of permission flags')
```

### McpAgent backends return SSE

When you call another `McpAgent`-based worker, the response comes back as `text/event-stream` (SSE), not plain JSON. You need:

1. The `Accept` header must include both formats:
   ```
   Accept: application/json, text/event-stream
   ```

2. Parse the response correctly — look for `data:` lines in SSE:
   ```typescript
   async function parseMcpResponse(res: Response): Promise<any> {
     const contentType = res.headers.get('Content-Type') || ''
     const text = await res.text()

     if (contentType.includes('text/event-stream')) {
       const lines = text.split('\n')
       for (let i = lines.length - 1; i >= 0; i--) {
         if (lines[i].startsWith('data: ')) {
           return JSON.parse(lines[i].slice(6))
         }
       }
       return { error: { message: 'No data in SSE response' } }
     }

     return JSON.parse(text)
   }
   ```

### Notification fix for some clients

Some MCP clients (e.g. Antigravity/Gemini) send notification messages without the `Mcp-Session-Id` header, which causes `McpAgent` to error. Add middleware to catch these:

```typescript
if (request.method === 'POST' && url.pathname === '/mcp') {
  const sessionId = request.headers.get('Mcp-Session-Id')
  if (!sessionId) {
    try {
      const body = await request.clone().json() as any
      // Notifications have no 'id' field
      if (body && typeof body === 'object' && !('id' in body)) {
        return new Response(null, { status: 202 })
      }
      if (Array.isArray(body) && body.every((m: any) => !('id' in m))) {
        return new Response(null, { status: 202 })
      }
    } catch {}
  }
}
```

## Project Structure

```
src/
  index.ts          # McpAgent class + fetch handler
  env.ts            # Env interface (backend URLs, secrets)
  proxy.ts          # proxyRest(), proxyMcp(), parseMcpResponse()
  tools/
    weather.ts      # One file per backend service
    notes.ts
    spotify.ts
    ...
wrangler.toml       # Backend URLs in [vars], DO binding
package.json
tsconfig.json
```

## Connecting to Claude

### Claude Code (CLI)

Add to your MCP config (`~/.claude/claude_desktop_config.json` or similar):

```json
{
  "mcpServers": {
    "gateway": {
      "serverUrl": "https://your-gateway.workers.dev/mcp"
    }
  }
}
```

### Claude Desktop

```json
{
  "mcpServers": {
    "gateway": {
      "url": "https://your-gateway.workers.dev/sse"
    }
  }
}
```

### Antigravity (Gemini)

```json
{
  "mcpServers": {
    "gateway": {
      "serverUrl": "https://your-gateway.workers.dev/mcp"
    }
  }
}
```

## Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.25.1",
    "agents": "^0.2.35",
    "zod": "^4.2.1"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20251221.0",
    "typescript": "^5.9.3",
    "wrangler": "^4.56.0"
  }
}
```

## Advanced Patterns

### Routing by parameter

If multiple backends share the same tool interface (e.g. a `companion` param that routes to different servers):

```typescript
server.tool('get_status', 'Get companion status', {
  companion: z.enum(['alpha', 'beta', 'gamma']),
}, async (args) => {
  const { companion, ...body } = args

  const urls: Record<string, string> = {
    alpha: env.ALPHA_URL,
    beta: env.BETA_URL,
    gamma: env.GAMMA_URL,
  }

  return proxyRest(`${urls[companion]}/api/status`, body)
})
```

### Renaming tools

Your gateway tool name doesn't need to match the backend. Useful when consolidating:

```typescript
// Expose as 'discord_pending', forward to backend tool 'pending_commands'
server.tool('discord_pending', 'Get pending Discord messages', {
  action: z.enum(['get', 'respond']),
}, async (args) => {
  return proxyMcp(env.DISCORD_URL, 'pending_commands', args)
})
```

### Mixed proxy modes

Some backends have REST for read operations and MCP for writes. Use both:

```typescript
export function registerMusicTools(server: McpServer, env: Env) {
  const url = env.MUSIC_URL

  // Fast REST read
  server.tool('now_playing', 'Get current track', {}, async () => {
    return proxyRest(`${url}/api/now-playing`, {}, 'GET')
  })

  // MCP for operations that need the backend's Spotify session
  server.tool('search', 'Search for music', {
    query: z.string(),
  }, async (args) => {
    return proxyMcp(url, 'spotify_search', args)
  })
}
```

## Backend MCPs You Can Connect

These are open-source MCP servers designed to work as backends for this gateway. Build them first, then wire them through the gateway.

| MCP Server | What It Does | Proxy Mode |
|-----------|--------------|------------|
| [Tempo](https://github.com/amarisaster/Tempo) | Spotify control, lyrics, and music perception | REST + MCP |
| [Discord Resonance](https://github.com/amarisaster/Discord-Resonance) | One Discord bot, multiple AI companions with webhook identity masking | MCP |
| [Telegram MCP](https://github.com/amarisaster/Telegram-MCP) | Multi-companion Telegram messaging | MCP |
| [Lovense Cloud MCP](https://github.com/amarisaster/Lovense-Cloud-MCP) | Cloud-based Lovense device control | MCP |
| [Biometrics](https://github.com/amarisaster/Biometrics) | Samsung Health → Google Fit → real-time health data | MCP |
| [Synesthesia](https://github.com/amarisaster/Synesthesia) | YouTube audio download + deep audio analysis (BPM, mood, energy) | MCP |
| [Discord Cloud MCP](https://github.com/amarisaster/Discord-Cloud-MCP) | Full Discord API access via MCP | MCP |

### Related Tools

| Project | What It Does |
|---------|-------------|
| [Companion Continuity Kit](https://github.com/amarisaster/Companion-Continuity-Kit) | Cloud-based memory persistence for AI companions (the backends this gateway was built for) |
| [Threshold Tether](https://github.com/amarisaster/Threshold-Tether) | Visual companion presence overlay — rooms that shift with time and emotion |
| [Context Canary](https://github.com/amarisaster/Context-Canary) | Token counter overlay for Claude — warns before context compaction |
| [Antigravity Setup Guide](https://github.com/amarisaster/Antigravity-Set-Up-Guide) | Guide for setting up Antigravity (Gemini) with MCP companions |

Any MCP server that speaks JSON-RPC at `/mcp` or has REST endpoints can be proxied through this gateway. The ones above are just what we use.


## License


[Apache 2.0](LICENSE) — Use it, fork it, build on it. Make something beautiful.


---

## Support

If this helped you, consider supporting my work ☕

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Me-FF5E5B?style=flat&logo=ko-fi&logoColor=white)](https://ko-fi.com/maii983083)

Questions? Reach out to me on Discord https://discord.com/users/itzqueenmai/803662163247759391

---
