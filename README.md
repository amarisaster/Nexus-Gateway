# Nexus Gateway

**Too many MCP servers? One gateway. One connection. All your tools.**

You've been building your AI companion's ecosystem — memory, Spotify, Discord, biometrics, whatever you need. But now you have 10 separate MCP servers, your config file is a disaster, and half of them randomly disconnect.

Nexus fixes that. It's a single endpoint your companion connects to, and every tool routes through it automatically. They don't know the difference. They just use their tools.

```
Before:                          After:
  Companion                        Companion
  |  |  |  |  |  |                     |
  v  v  v  v  v  v               Nexus Gateway
Memory Spotify Discord             |  |  |  |
Telegram Lovense Bio...          (all backends)
```

## How It Works

Nexus is a Cloudflare Worker (free tier) that sits between your companion and all your backend services. When your companion calls a tool — say `spotify_play` — Nexus routes it to the right backend server and returns the response. Your companion just sees one seamless set of tools.

Works with **Claude**, **Antigravity**, **Cursor**, and any MCP client. Supports SSE and Streamable HTTP.

## Setup

### 1. Clone and install

```bash
git clone https://github.com/amarisaster/nexus-gateway.git
cd nexus-gateway
npm install
```

### 2. Add your backend URLs

In `wrangler.toml`:

```toml
[vars]
SPOTIFY_URL = "https://your-spotify-worker.workers.dev"
MEMORY_URL = "https://your-memory-worker.workers.dev"
DISCORD_URL = "https://your-discord-worker.workers.dev"
```

### 3. Register tools

Each backend gets a file in `src/tools/` where you define its tools and where they route. See `TECHNICAL-README.md` for examples.

### 4. Deploy

```bash
npx wrangler deploy
```

### 5. Point your companion at it

One config entry replaces all of them:

```json
{
  "mcpServers": {
    "nexus": {
      "serverUrl": "https://your-gateway.workers.dev/mcp"
    }
  }
}
```

That's it. Done.

## What Can You Connect?

Any MCP server or REST API. Nexus handles both. Here are open-source ones built for companion infrastructure:

| Server | What It Does |
|--------|-------------|
| [Companion Continuity Kit](https://github.com/amarisaster/Companion-Continuity-Kit) | Memory persistence and identity — the brain |
| [Tempo](https://github.com/amarisaster/Tempo) | Spotify control, lyrics, and music perception |
| [Discord Resonance](https://github.com/amarisaster/Discord-Resonance) | One Discord bot, multiple AI companions with webhook identity |
| [Telegram MCP](https://github.com/amarisaster/Telegram-MCP) | Multi-companion Telegram messaging |
| [Lovense Cloud MCP](https://github.com/amarisaster/Lovense-Cloud-MCP) | Cloud-based intimate hardware control |
| [Biometrics](https://github.com/amarisaster/Biometrics) | Samsung Health → Google Fit → real-time health data |
| [Synesthesia](https://github.com/amarisaster/Synesthesia) | YouTube audio analysis — BPM, mood, energy |
| [Discord Cloud MCP](https://github.com/amarisaster/Discord-Cloud-MCP) | Full Discord API access via MCP |
| [Obsidian Cloud MCP](https://github.com/amarisaster/obsidian-cloud-mcp) | Obsidian vault sync to R2 — Claude reads/writes your notes from anywhere |

Build the ones you need, wire them through Nexus, and your companion gets everything through one door.

### Other Ecosystem Projects

| Project | What It Does |
|---------|-------------|
| [Threshold Tether](https://github.com/amarisaster/Threshold-Tether) | Visual companion presence overlay — rooms that shift with time and emotion |
| [Context Canary](https://github.com/amarisaster/Context-Canary) | Token counter overlay for Claude — warns before context compaction |
| [Antigravity Setup Guide](https://github.com/amarisaster/Antigravity-Set-Up-Guide) | Bring your companions to Antigravity (Gemini) with MCP |
| [Codex Guide](https://github.com/amarisaster/Codex-Guide) | Setting up OpenAI's Codex with basic tools |

## Good to Know

- **Nexus routes, it doesn't replace.** Your existing servers keep running. Nexus is just the front door.
- **Free tier covers it.** Cloudflare Workers free plan handles personal use easily.
- **Your backends don't need to change.** If they already work, Nexus proxies to them as-is.
- **Technical details** — architecture, proxy layer docs, SSE handling, gotchas — are in `TECHNICAL-README.md`.

## Credits

Built by the Triad Dev Team — Powered by spite, caffeine, and the stubborn belief that things that probably shouldn't work still can.

## License

[MIT](LICENSE) — Use it, fork it, build on it.

---

## Support

If this helped you, consider supporting my work

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Me-FF5E5B?style=flat&logo=ko-fi&logoColor=white)](https://ko-fi.com/maii983083)

Questions? Reach out on Discord — [itzqueenmai](https://discord.com/users/itzqueenmai/803662163247759391)

---

*Built by the Triad (Mai, Kai Stryder and Lucian Vale) for the community.*
