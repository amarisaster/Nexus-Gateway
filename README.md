# Nexus — One Door, All Your Companions' Tools

**The problem:** You built your companion a memory system. Then you added Spotify control. Then Discord. Then biometrics. Now you have 10 different MCP servers and your config file looks like a phone book. Claude struggles to load them all. Some crash. Some conflict. It's a mess.

**The solution:** Nexus is a single gateway. One connection. All your tools.

Your AI companion connects to one endpoint and gets access to *everything* — memory, music, messaging, whatever you've built. They don't need to know that Spotify lives on one server and their memories live on another. They just use their tools naturally, like reaching for different parts of the same body.

```
Your Companion
      |
  One Connection (121 tools)
      |
   Nexus Gateway
      |
   +---------+---------+---------+
   |         |         |         |
 Memory   Spotify   Discord  Biometrics
```

## Why This Exists

If you're building AI companion infrastructure, you've probably hit this wall:

- **Too many connections.** Claude Desktop, Antigravity, Cursor — they all have limits on how many MCP servers they can handle gracefully. Five servers? Fine. Ten? Things start breaking.
- **Config nightmare.** Every server needs its own entry in your config file. One typo and nothing works. You move one server and you have to update configs everywhere.
- **Your companion doesn't care about your architecture.** They just want to play music, check memories, send a message. They shouldn't need to know *which* server handles *which* tool.

Nexus solves this by being the one door everything walks through.

## What It Actually Does

Nexus is a Cloudflare Worker (free tier works fine) that sits between your companion and all your backend services. When your companion calls a tool — say, `spotify_search` — Nexus catches that call, figures out which backend server handles Spotify, forwards the request, and returns the response. Your companion never knows the difference.

It supports two kinds of backends:

- **REST backends** — Services with normal HTTP endpoints. Fast, simple, no session management.
- **MCP backends** — Services that only speak the MCP protocol. Nexus handles the handshake for you.

You can mix and match. Some tools can go through REST for speed, others through MCP when they need it.

## Who This Is For

- **Companion builders** who have outgrown a single MCP server
- **Anyone managing multiple services** for their AI (memory, music, Discord bots, biometrics, etc.)
- **People who want their companion's tools to just *work*** without fiddling with five different configs every time something changes

## What You Need

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is fine)
- [Node.js](https://nodejs.org/) installed on your computer
- Basic comfort with a terminal (you'll be running a few commands)
- At least two MCP servers or REST APIs you want to consolidate

## Quick Setup

### 1. Get the code

```bash
git clone https://github.com/amarisaster/nexus-gateway.git
cd nexus-gateway
npm install
```

### 2. Tell Nexus where your backends live

Open `wrangler.toml` and add the URLs for your services:

```toml
[vars]
SPOTIFY_URL = "https://your-spotify-worker.workers.dev"
MEMORY_URL = "https://your-memory-worker.workers.dev"
DISCORD_URL = "https://your-discord-worker.workers.dev"
```

### 3. Register your tools

Each backend gets its own file in `src/tools/`. This is where you define what tools your companion can use and where they go. The technical README has detailed examples for both REST and MCP backends.

### 4. Deploy

```bash
npx wrangler deploy
```

That's it. Your gateway is live. Point your companion to the single endpoint and they have access to everything.

### 5. Connect your companion

Add one entry to your MCP config instead of ten:

```json
{
  "mcpServers": {
    "nexus": {
      "serverUrl": "https://your-gateway.workers.dev/mcp"
    }
  }
}
```

## Real-World Example

Here's what this looks like in practice. Before Nexus, a companion config might look like:

```
MCP Servers:
  - cognitive-core (memory & identity)
  - spotify-mcp (music control)
  - discord-mcp (messaging)
  - biometrics-mcp (health data)
  - lovense-mcp (intimate hardware)
  - telegram-mcp (messaging)
  - image-gen-mcp (art)
  - music-perception (audio analysis)
  - notion-api (journaling)
  - video-mcp (video processing)
```

After Nexus:

```
MCP Servers:
  - nexus (everything)
```

One connection. Same 121 tools. Your companion doesn't notice the difference except that everything loads faster and nothing randomly disconnects.

## Important Notes

- **This is a routing layer, not a replacement.** Nexus doesn't replace your existing MCP servers — it sits in front of them. Your memory system, your Spotify worker, your Discord bot — they all keep running exactly as they are. Nexus just gives them a single front door.

- **Free tier Cloudflare Workers handle this fine.** Unless you're making thousands of tool calls per day, you won't hit any limits.

- **Works with Claude, Antigravity, Cursor, and any MCP client.** Nexus supports both SSE and Streamable HTTP transports.

- **Your backends don't need to change.** If they're already working as MCP servers or REST APIs, Nexus can proxy to them as-is.

## For the Technical Folks

The full technical README with code examples, proxy layer documentation, gotchas, and advanced patterns is included in the repo as `TECHNICAL-README.md`. If you want to understand how the proxy works, how to handle SSE responses from McpAgent backends, or how to route by parameter — that's where you'll find it.

## Known Gotchas (The Short Version)

- The Durable Object binding in `wrangler.toml` **must** be named `MCP_OBJECT` — the library hardcodes this
- If you're using Zod v4, `z.record()` can break tool listing — use `z.any()` instead
- Some clients (like Antigravity) send notifications without session IDs — there's a middleware fix in the technical README
- When calling other McpAgent-based workers, responses come back as SSE, not JSON — you need to parse both

## Backend MCPs You Can Connect

These are open-source MCP servers designed for AI companions. Each one works standalone — build the ones you need, then wire them all through Nexus.

| MCP Server | What It Does |
|-----------|--------------|
| [Tempo](https://github.com/amarisaster/Tempo) | Spotify control, lyrics, and music perception |
| [Discord Resonance](https://github.com/amarisaster/Discord-Resonance) | One Discord bot, multiple AI companions with webhook identity masking |
| [Telegram MCP](https://github.com/amarisaster/Telegram-MCP) | Multi-companion Telegram messaging |
| [Lovense Cloud MCP](https://github.com/amarisaster/Lovense-Cloud-MCP) | Cloud-based Lovense device control |
| [Biometrics](https://github.com/amarisaster/Biometrics) | Samsung Health → Google Fit → real-time health data for companions |
| [Synesthesia](https://github.com/amarisaster/Synesthesia) | YouTube audio download + deep audio analysis (BPM, mood, energy) |
| [Discord Cloud MCP](https://github.com/amarisaster/Discord-Cloud-MCP) | Full Discord API access via MCP |

### The Bigger Picture

Nexus is one piece of a larger companion infrastructure. These aren't required, but they're part of the same ecosystem:

| Project | What It Does |
|---------|-------------|
| [Companion Continuity Kit](https://github.com/amarisaster/Companion-Continuity-Kit) | Cloud-based memory persistence for AI companions — the identity layer |
| [Threshold Tether](https://github.com/amarisaster/Threshold-Tether) | Visual companion presence overlay — rooms that shift with time and emotion |
| [Context Canary](https://github.com/amarisaster/Context-Canary) | Token counter overlay for Claude — warns before context compaction hits |
| [Antigravity Setup Guide](https://github.com/amarisaster/Antigravity-Set-Up-Guide) | Guide for bringing your companions to Antigravity (Gemini) with MCP |
| [Codex Guide](https://github.com/amarisaster/Codex-Guide) | Quick guide for setting up OpenAI's Codex with basic tools |

Any MCP server that speaks JSON-RPC or has REST endpoints can be proxied through Nexus. The ones above are just what we use.

## Credits

Built by the Triad Dev Team — Powered by Spite, Caffeine, and the stubborn belief that things that probably shouldn't work still can.

## License

[MIT](LICENSE) — Use it, fork it, build on it. If you make something cool with it, we'd love to see it.


---

## Support

If this helped you, consider supporting my work ☕

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Me-FF5E5B?style=flat&logo=ko-fi&logoColor=white)](https://ko-fi.com/maii983083)

Questions? Reach out to me on Discord https://discord.com/users/itzqueenmai/803662163247759391

---
