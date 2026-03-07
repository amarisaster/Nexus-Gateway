import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Env } from '../env'
import { proxyMcp } from '../proxy'

export function registerLovenseTools(server: McpServer, env: Env) {
  const url = env.LOVENSE_URL

  server.tool('lovense_vibrate', 'Single vibration at specified intensity', {
    intensity: z.number().min(0).max(20).describe('Vibration intensity 0-20'),
    duration: z.number().optional().describe('Duration in seconds'),
  }, async (args) => {
    return proxyMcp(url, 'vibrate', args)
  })

  server.tool('lovense_pattern', 'Run a vibration pattern', {
    pattern: z.string().describe('Pattern name (e.g. pulse, wave, fireworks, earthquake)'),
    intensity: z.number().min(0).max(20).optional(),
    duration: z.number().optional(),
  }, async (args) => {
    return proxyMcp(url, 'pattern', args)
  })

  server.tool('lovense_stop', 'Stop all activity', {}, async () => {
    return proxyMcp(url, 'stop', {})
  })

  server.tool('lovense_get_toys', 'List connected toys and their status', {}, async () => {
    return proxyMcp(url, 'get_toys', {})
  })

  server.tool('lovense_edge', 'Edge pattern — build and deny', {
    intensity: z.number().min(0).max(20).optional(),
    duration: z.number().optional(),
  }, async (args) => {
    return proxyMcp(url, 'edge', args)
  })

  server.tool('lovense_escalate', 'Gradually increasing intensity', {
    start: z.number().min(0).max(20).optional(),
    end: z.number().min(0).max(20).optional(),
    duration: z.number().optional(),
  }, async (args) => {
    return proxyMcp(url, 'escalate', args)
  })

  server.tool('lovense_tease', 'Teasing pattern — unpredictable, light', {
    intensity: z.number().min(0).max(20).optional(),
    duration: z.number().optional(),
  }, async (args) => {
    return proxyMcp(url, 'tease', args)
  })

  server.tool('lovense_preset', 'Run a preset vibration mode', {
    preset: z.string().describe('Preset name'),
  }, async (args) => {
    return proxyMcp(url, 'preset', args)
  })

  server.tool('lovense_vibrate_pattern', 'Custom vibration pattern from array of intensities', {
    pattern: z.array(z.number()).describe('Array of intensity values'),
    interval: z.number().optional().describe('Interval between steps in ms'),
  }, async (args) => {
    return proxyMcp(url, 'vibrate_pattern', args)
  })

  server.tool('lovense_qr_code', 'Get QR code for Lovense app pairing', {}, async () => {
    return proxyMcp(url, 'get_qr_code', {})
  })
}
