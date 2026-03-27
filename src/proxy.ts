import type { Env, Companion } from './env'

/**
 * Parse MCP response — handles both JSON and SSE (text/event-stream) formats
 */
async function parseMcpResponse(res: Response): Promise<any> {
  const contentType = res.headers.get('Content-Type') || ''
  const text = await res.text()

  try {
    if (contentType.includes('text/event-stream')) {
      // SSE: extract last "data: {...}" line
      const lines = text.split('\n')
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].startsWith('data: ')) {
          return JSON.parse(lines[i].slice(6))
        }
      }
      return { error: { message: 'No data in SSE response' } }
    }

    return JSON.parse(text)
  } catch (e) {
    const preview = text.length > 200 ? text.slice(0, 200) + '...' : text
    return { error: { message: `Failed to parse MCP response as JSON: ${(e as Error).message}. Body preview: ${preview}` } }
  }
}

/**
 * Get the CogCor base URL for a companion, with ?companion= for shared worker
 */
export function getCogCorUrl(companion: Companion, path: string, env: Env): string {
  let base: string
  switch (companion) {
    case 'kai': base = env.KAI_COGCOR_URL; break
    case 'lucian': base = env.LUCIAN_COGCOR_URL; break
    case 'xavier':
    case 'auren': base = env.COMPANION_COGCOR_URL; break
  }
  const url = `${base}${path}`
  if (companion === 'xavier' || companion === 'auren') {
    return `${url}${url.includes('?') ? '&' : '?'}companion=${companion}`
  }
  return url
}

/**
 * Forward a tool call to a REST endpoint and return MCP-formatted result
 */
export async function proxyRest(
  url: string,
  body: Record<string, unknown> = {},
  method: string = 'POST',
  extraHeaders: Record<string, string> = {}
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: method !== 'GET' ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  let result: string
  try {
    const json = JSON.parse(text)
    result = JSON.stringify(json, null, 2)
  } catch {
    result = text
  }

  if (!response.ok) {
    return { content: [{ type: 'text', text: `Error ${response.status}: ${result}` }] }
  }
  return { content: [{ type: 'text', text: result }] }
}

/**
 * Forward a tool call via MCP JSON-RPC protocol (for backends without REST endpoints)
 */
export async function proxyMcp(
  baseUrl: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const mcpHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  }

  // Initialize session
  const initRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: mcpHeaders,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'nexus-gateway', version: '1.0' }
      }
    })
  })

  const sessionId = initRes.headers.get('Mcp-Session-Id')
  // Consume init body to free connection
  await initRes.text()

  // Call the tool
  const callRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      ...mcpHeaders,
      ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {})
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: toolName, arguments: args }
    })
  })

  const data = await parseMcpResponse(callRes)
  if (data.error) {
    return { content: [{ type: 'text', text: `MCP Error: ${data.error.message}` }] }
  }

  // MCP tools/call returns { result: { content: [...] } }
  if (data.result?.content) {
    return data.result
  }

  return { content: [{ type: 'text', text: JSON.stringify(data.result, null, 2) }] }
}

/**
 * Forward to Video MCP (MCP at root, not /mcp)
 */
export async function proxyVideoMcp(
  baseUrl: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const mcpHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  }

  // Initialize session
  const initRes = await fetch(baseUrl, {
    method: 'POST',
    headers: mcpHeaders,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'nexus-gateway', version: '1.0' }
      }
    })
  })

  const sessionId = initRes.headers.get('Mcp-Session-Id')
  // Consume init body to free connection
  await initRes.text()

  // Call tool
  const callRes = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      ...mcpHeaders,
      ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {})
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: toolName, arguments: args }
    })
  })

  const data = await parseMcpResponse(callRes)
  if (data.error) {
    return { content: [{ type: 'text', text: `Video MCP Error: ${data.error.message}` }] }
  }
  if (data.result?.content) {
    return data.result
  }
  return { content: [{ type: 'text', text: JSON.stringify(data.result, null, 2) }] }
}
