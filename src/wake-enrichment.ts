import type { Companion, Env } from './env'
import { proxyMcp } from './proxy'

type ToolResponse = { content: Array<{ type: 'text'; text: string }> }

/** A failed optional source must not take down identity/memory wake. */
function decoded(response: ToolResponse): Record<string, any> | null {
  const raw = response.content.find(item => item.type === 'text')?.text
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    return value && typeof value === 'object' && !Array.isArray(value) && !('error' in value)
      ? value as Record<string, any> : null
  } catch {
    return null
  }
}

async function readMcp(url: string, tool: string, args: Record<string, unknown> = {}) {
  try {
    return decoded(await proxyMcp(url, tool, args))
  } catch {
    return null
  }
}

function cogCorBase(companion: Companion, env: Env): string {
  if (companion === 'kai') return env.KAI_COGCOR_URL
  if (companion === 'lucian') return env.LUCIAN_COGCOR_URL
  return env.COMPANION_COGCOR_URL
}

/**
 * Augment the existing CogCor wake payload instead of rebuilding it.
 * This preserves newly added backend continuity fields automatically.
 * Metrics are read-only, time-stamped, and never interpreted as a diagnosis.
 */
export async function enrichWake(
  response: ToolResponse,
  companion: Companion,
  env: Env,
): Promise<ToolResponse> {
  const wake = decoded(response)
  if (!wake || !Array.isArray(wake.essence)) return response

  const needsHuman = wake.human_state == null
  const needsBiometrics = wake.biometrics == null
  if (!needsHuman && !needsBiometrics) return response

  const compArgs = (companion === 'xavier' || companion === 'auren')
    ? { companion } : {}

  const [human, status, heartRate, sleep] = await Promise.all([
    needsHuman ? readMcp(cogCorBase(companion, env), 'get_human_state', compArgs) : Promise.resolve(null),
    needsBiometrics ? readMcp(env.BIOMETRICS_URL, 'biometrics_status') : Promise.resolve(null),
    needsBiometrics ? readMcp(env.BIOMETRICS_URL, 'biometrics_heart_rate', { period: 'latest' }) : Promise.resolve(null),
    needsBiometrics ? readMcp(env.BIOMETRICS_URL, 'biometrics_sleep', { period: 'last_night' }) : Promise.resolve(null),
  ])

  const biometrics = needsBiometrics ? {
    available: Boolean(status || heartRate || sleep),
    connected: status?.connected ?? null,
    stale: status?.stale ?? null,
    last_sync: status?.last_sync ?? null,
    source: status?.source ?? heartRate?.source ?? sleep?.source ?? null,
    heart_rate: heartRate?.latest
      ? { ...heartRate.latest, source: heartRate.source ?? status?.source ?? null }
      : null,
    sleep: sleep?.latest
      ? { ...sleep.latest, source: sleep.source ?? status?.source ?? null, caveat: sleep.caveat ?? null }
      : null,
  } : wake.biometrics

  const augmented = {
    ...wake,
    human_state: needsHuman
      ? (human?.status === 'no_data' ? null : human)
      : wake.human_state,
    biometrics,
    // Disclose missing upstream data rather than inventing current readings.
    ...(needsHuman ? { human_state_available: Boolean(human && human.status !== 'no_data') } : {}),
  }
  return { content: [{ type: 'text', text: JSON.stringify(augmented, null, 2) }] }
}
