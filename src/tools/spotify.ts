import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Env } from '../env'
import { proxyRest, proxyMcp } from '../proxy'

export function registerSpotifyTools(server: McpServer, env: Env) {
  const url = env.SPOTIFY_URL

  // REST endpoints (fast, no MCP session overhead)
  server.tool('spotify_now_playing', 'Get currently playing track with album art', {}, async () => {
    return proxyRest(`${url}/api/now-playing`, {}, 'GET')
  })

  server.tool('spotify_perceive', 'Get now playing + synced lyrics (current line + upcoming)', {}, async () => {
    return proxyRest(`${url}/api/perceive`, {}, 'GET')
  })

  server.tool('spotify_play', 'Resume playback', {}, async () => {
    return proxyRest(`${url}/api/play`)
  })

  server.tool('spotify_pause', 'Pause playback', {}, async () => {
    return proxyRest(`${url}/api/pause`)
  })

  server.tool('spotify_next', 'Skip to next track', {}, async () => {
    return proxyRest(`${url}/api/next`)
  })

  server.tool('spotify_previous', 'Go to previous track', {}, async () => {
    return proxyRest(`${url}/api/previous`)
  })

  // MCP-forwarded tools (need MCP session)
  server.tool('spotify_search', 'Search Spotify for tracks, albums, artists, playlists', {
    query: z.string().describe('Search query'),
    type: z.enum(['track', 'album', 'artist', 'playlist']).optional().describe('Search type (default: track)'),
    limit: z.number().optional().describe('Max results (default 10)'),
  }, async (args) => {
    return proxyMcp(url, 'spotify_search', args)
  })

  server.tool('spotify_queue', 'Add a track to the playback queue', {
    uri: z.string().describe('Spotify URI (e.g. spotify:track:xxx)'),
  }, async (args) => {
    return proxyMcp(url, 'spotify_queue', args)
  })

  server.tool('spotify_volume', 'Set playback volume', {
    volume: z.number().min(0).max(100).describe('Volume level 0-100'),
  }, async (args) => {
    return proxyMcp(url, 'spotify_volume', args)
  })

  server.tool('spotify_devices', 'List available Spotify devices', {}, async () => {
    return proxyMcp(url, 'spotify_devices', {})
  })

  server.tool('spotify_shuffle', 'Toggle shuffle mode', {
    state: z.boolean().describe('Shuffle on/off'),
  }, async (args) => {
    return proxyMcp(url, 'spotify_shuffle', args)
  })

  server.tool('spotify_repeat', 'Set repeat mode', {
    state: z.enum(['off', 'track', 'context']).describe('Repeat mode'),
  }, async (args) => {
    return proxyMcp(url, 'spotify_repeat', args)
  })

  server.tool('spotify_transfer', 'Transfer playback to another device', {
    device_id: z.string().describe('Target device ID'),
  }, async (args) => {
    return proxyMcp(url, 'spotify_transfer', args)
  })
}
