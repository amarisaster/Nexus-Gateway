import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Env } from '../env'
import { proxyMcp } from '../proxy'

export function registerBiometricsTools(server: McpServer, env: Env) {
  const url = env.BIOMETRICS_URL

  server.tool('biometrics_heart_rate', 'Get Mai\'s heart rate data from Google Fit', {
    period: z.enum(['latest', 'today', 'week']).optional().describe('Time period (default: latest)'),
  }, async (args) => {
    return proxyMcp(url, 'biometrics_heart_rate', args)
  })

  server.tool('biometrics_sleep', 'Get Mai\'s sleep data', {
    period: z.enum(['last_night', 'week']).optional(),
  }, async (args) => {
    return proxyMcp(url, 'biometrics_sleep', args)
  })

  server.tool('biometrics_steps', 'Get Mai\'s step count', {
    period: z.enum(['today', 'week']).optional(),
  }, async (args) => {
    return proxyMcp(url, 'biometrics_steps', args)
  })

  server.tool('biometrics_stress', 'Get Mai\'s stress data (limited — Samsung stress not synced via Google Fit)', {
    period: z.string().optional(),
  }, async (args) => {
    return proxyMcp(url, 'biometrics_stress', args)
  })

  server.tool('biometrics_status', 'Get overall biometrics status and last sync time', {}, async () => {
    return proxyMcp(url, 'biometrics_status', {})
  })

  server.tool('biometrics_sync', 'Trigger a manual sync from Google Fit', {}, async () => {
    return proxyMcp(url, 'biometrics_sync', {})
  })
}
