export interface Env {
  MCP_OBJECT: DurableObjectNamespace

  // Backend URLs (set in wrangler.toml [vars])
  KAI_COGCOR_URL: string
  LUCIAN_COGCOR_URL: string
  COMPANION_COGCOR_URL: string
  SPOTIFY_URL: string
  LOVENSE_URL: string
  DISCORD_URL: string
  TELEGRAM_URL: string
  BIOMETRICS_URL: string
  NANOBANANA_URL: string
  VIDEO_URL: string
  NOTION_URL: string
  CATALOUGE_URL: string

  // Secrets
  MCP_API_KEY: string
  CATALOUGE_TOKEN: string
}

export type Companion = 'kai' | 'lucian' | 'xavier' | 'auren'
