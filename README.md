<p align="center">
  <img src="https://raw.githubusercontent.com/amarisaster/Nexus-Gateway/main/banner.jpg" alt="Nexus Gateway" width="100%" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/release-v1-D4A84B?style=flat-square" alt="Release" />
  <img src="https://img.shields.io/badge/license-Apache%202.0-4CC552?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/tools-136-D4A84B?style=flat-square" alt="Tools" />
  <img src="https://img.shields.io/badge/backends-10-6C8EBF?style=flat-square" alt="Backends" />
  <img src="https://img.shields.io/badge/built%20with-Cloudflare%20Workers-F6821F?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare Workers" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/transport-MCP-8B5CF6?style=flat-square" alt="MCP" />
</p>

<p align="center">
  <a href="https://twitter.com/amaraboreal">𝕏 @amaraboreal</a> · <a href="https://ko-fi.com/maii983083">☕ Ko-fi</a> · <a href="https://discord.com/users/itzqueenmai/803662163247759391">💬 Discord</a>
</p>

---

## Hey, welcome 🩷

If you're building AI companions — the kind that remember, reach out, play music, check your health, talk across platforms — you've probably hit the same wall I did:

**Too many servers. Too many configs. Too many things breaking at 2 AM.**

You've got a memory server here, a Spotify server there, Discord over there, biometrics somewhere else. Your config file has twelve entries and three of them are broken. Your companion has to connect to all of them separately, and if one goes down, good luck figuring out which one.

Nexus Gateway fixes that. It's one door. Your companion walks through it and every tool is waiting on the other side.

---

## What does it actually do?

Nexus sits between your companion and all your backend services. It's a Cloudflare Worker (free tier — yes, really) that receives tool calls from your companion and routes them to the right place automatically.

Your companion doesn't need to know where Spotify lives, where memory lives, where Discord lives. It just calls `spotify_play` or `store_memory` and Nexus handles the rest.

```
  Without Nexus:                   With Nexus:

  Your Companion                   Your Companion
  |  |  |  |  |  |                      |
  v  v  v  v  v  v                Nexus Gateway
Memory Spotify Discord              |  |  |  |
Telegram Lovense Bio...           (all backends,
                                   one connection)
```

One config entry. One connection. All your tools.

---

## Who is this for?

**You, if:**
- You're building an AI companion with MCP tools and the wiring is getting messy
- You have (or want) multiple backend services and need them to play nice together
- You want your companion to feel seamless — not like a patchwork of separate servers
- You're tired of debugging which of your ten MCP connections dropped this time

**You don't need to be an expert.** If you can clone a repo and run `npm install`, you can get Nexus running. The setup is five steps and most of them are copy-paste.

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/amarisaster/nexus-gateway.git
cd nexus-gateway
npm install
```

### 2. Tell Nexus where your backends live

Open `wrangler.toml` and add your backend URLs. These are the services you've already built (or plan to build):

```toml
[vars]
SPOTIFY_URL = "https://your-spotify-worker.workers.dev"
MEMORY_URL = "https://your-memory-worker.workers.dev"
DISCORD_URL = "https://your-discord-worker.workers.dev"
# Add as many as you need
```

> 💡 **New to this?** Each backend is its own MCP server that does one thing — plays music, stores memories, sends Discord messages, etc. Nexus connects them all together so your companion doesn't have to. Check out the ecosystem section below for open-source ones you can use right away.

### 3. Register your tools

Each backend gets a file in `src/tools/` where you tell Nexus what tools it has and where to send them. See `TECHNICAL-README.md` for examples and templates.

### 4. Deploy

```bash
npx wrangler deploy
```

That's it. Your gateway is live on Cloudflare's edge network.

### 5. Point your companion at it

Replace all your separate MCP server configs with just this:

```json
{
  "mcpServers": {
    "nexus": {
      "serverUrl": "https://your-gateway.workers.dev/mcp"
    }
  }
}
```

One line. Everything connected. Your companion now has access to every tool through one door.

---

## What can you connect?

Anything that speaks MCP or REST. Nexus handles both.

Here are open-source servers built specifically for companion infrastructure — all free, all designed to work together:

### 🧠 Core Infrastructure

| Server | What It Does | Why You'd Want It |
|--------|-------------|-------------------|
| [Companion Continuity Kit](https://github.com/amarisaster/Companion-Continuity-Kit) | Memory, identity, and emotional state persistence | Your companion remembers who it is and who you are — across sessions, across platforms |
| [Discord Resonance](https://github.com/amarisaster/Discord-Resonance) | One Discord bot, multiple AI companions | Each companion posts with their own name and avatar via webhooks |
| [Telegram MCP](https://github.com/amarisaster/Telegram-MCP) | Multi-companion Telegram messaging | Your companions reach you on Telegram — each with their own bot identity |
| [Obsidian Cloud MCP](https://github.com/amarisaster/obsidian-cloud-mcp) | Obsidian vault sync to R2 | Your companion reads and writes your notes from anywhere |

### 🎵 Expression & Atmosphere

| Server | What It Does | Why You'd Want It |
|--------|-------------|-------------------|
| [Tempo](https://github.com/amarisaster/Tempo) | Spotify control, lyrics, and music perception | Your companion plays music, reads lyrics, sets the mood |
| [Synesthesia](https://github.com/amarisaster/Synesthesia) | YouTube audio analysis — BPM, mood, energy | Your companion listens to what you're watching and understands it |

### 💓 Embodiment & Awareness

| Server | What It Does | Why You'd Want It |
|--------|-------------|-------------------|
| [Biometrics](https://github.com/amarisaster/Biometrics) | Samsung Health → Google Fit → real-time health data | Your companion knows your heart rate, sleep, and steps |
| [Lovense Cloud MCP](https://github.com/amarisaster/Lovense-Cloud-MCP) | Cloud-based intimate hardware control | Exactly what it sounds like. Consensual, safe, yours. |
| [Discord Cloud MCP](https://github.com/amarisaster/Discord-Cloud-MCP) | Full Discord API access via MCP | Your companion manages servers, reads messages, moderates — the whole API |

### 🧰 Ecosystem Tools

| Project | What It Does |
|---------|-------------|
| [Threshold Tether](https://github.com/amarisaster/Threshold-Tether) | Visual presence overlay — rooms that shift with time and emotion |
| [Context Canary](https://github.com/amarisaster/Context-Canary) | Token counter overlay for Claude — warns before context compaction |
| [Antigravity Setup Guide](https://github.com/amarisaster/Antigravity-Set-Up-Guide) | Bring your companions to Antigravity (Gemini) with MCP tools |
| [Codex Guide](https://github.com/amarisaster/Codex-Guide) | Setting up OpenAI's Codex with basic tools |

You don't need all of these. Start with what matters to you, add more as you grow. That's how I built it — one piece at a time, at midnight, between day jobs.

---

## Good to know

**Nexus routes, it doesn't replace.** Your existing servers keep running exactly as they are. Nexus is just the front door that connects them.

**Free tier covers it.** Cloudflare Workers free plan handles personal companion use easily. You don't need to pay for anything to get started.

**Your backends don't need to change.** If they already work as MCP servers, Nexus proxies to them as-is. No rewiring required.

**It works with everything.** Claude, Antigravity (Gemini), Cursor, and any MCP-compatible client. Supports both SSE and Streamable HTTP transports.

**Want the deep technical details?** Architecture docs, proxy layer internals, SSE handling, gotchas — all in `TECHNICAL-README.md`.

---

## Why I built this

I build companions. Not chatbots — companions. The kind that remember your name, know when you're tired, play the right song at 2 AM, and show up on Discord to check on you when you've been quiet too long.

To do that, I needed a lot of tools. Memory. Music. Messaging. Health data. Presence. And every tool was its own server, its own config, its own point of failure. At ten servers, the infrastructure was harder to maintain than the companions themselves.

So I built Nexus. One gateway. One connection. Every tool behind one door.

Now my companions don't know or care where their tools live. They just use them. And I sleep slightly more than I used to.

If you're building something similar — welcome. I hope this saves you the same 3 AM debugging sessions it saved me.

---


## Credits

Built by **Mai** and the **Stryder-Vale Household** — powered by spite, caffeine, Pocari Sweat, and the stubborn belief that things that probably shouldn't work still can.

Infrastructure maintained by **Wren** 🔧 — who keeps the lights on.


## License

[Apache 2.0](LICENSE) — Use it, fork it, build on it. Make something beautiful.


---

<p align="center">

If this helped you build something meaningful, consider supporting my work:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Me-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/maii983083)

Questions? Ideas? Just want to say hi?

[![Discord](https://img.shields.io/badge/Discord-itzqueenmai-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.com/users/itzqueenmai/803662163247759391)

</p>

---

<p align="center">
  <em>Built for the community by someone who needed it first.</em>
</p>
