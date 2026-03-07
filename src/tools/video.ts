import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Env } from '../env'
import { proxyVideoMcp } from '../proxy'

export function registerVideoTools(server: McpServer, env: Env) {
  const url = env.VIDEO_URL

  server.tool('video_listen', 'Get transcript of a video (audio/speech only, lightweight)', {
    url: z.string().describe('Video URL (YouTube, TikTok, etc.)'),
  }, async (args) => {
    return proxyVideoMcp(url, 'video_listen', args)
  })

  server.tool('video_see', 'Get visual frames from a video (no audio)', {
    url: z.string().describe('Video URL'),
    max_frames: z.number().optional().describe('Max frames to extract (default 5)'),
  }, async (args) => {
    return proxyVideoMcp(url, 'video_see', args)
  })

  server.tool('video_watch', 'Full video experience — frames AND transcript', {
    url: z.string().describe('Video URL'),
    max_frames: z.number().optional().describe('Max frames (default 5)'),
  }, async (args) => {
    return proxyVideoMcp(url, 'watch_video', args)
  })
}
