import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchBrainGraph } from '../../lib/api'
import type { CompanionId, ForceGraphData, GraphNode, GraphLink } from './brainTypes'

export function useBrainData(companion: CompanionId) {
  const [graphData, setGraphData] = useState<ForceGraphData>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)
  const prevNodesRef = useRef<Map<string, GraphNode>>(new Map())

  const fetchData = useCallback(async () => {
    const brainData = await fetchBrainGraph(companion, { max_nodes: 80 })

    const nodes: GraphNode[] = brainData.nodes.map(n => {
      const prev = prevNodesRef.current.get(n.id)
      return {
        id: n.id,
        content: n.content,
        type: n.canonical_type,
        salience: n.salience,
        emotionalTag: n.emotional_tag,
        accessCount: n.access_count,
        createdAt: n.created_at,
        ...(prev ? { x: prev.x, y: prev.y, z: prev.z } : {})
      }
    })

    // Real connections from API
    const links: GraphLink[] = brainData.links.map(l => ({
      source: l.source,
      target: l.target,
      relation: l.relation,
      strength: l.strength
    }))

    // Generate synthetic connections when real data is sparse
    if (links.length < nodes.length * 0.5) {
      const syntheticLinks = generateSyntheticLinks(nodes, links)
      links.push(...syntheticLinks)
    }

    // Update position cache
    const newMap = new Map<string, GraphNode>()
    nodes.forEach(n => newMap.set(n.id, n))
    prevNodesRef.current = newMap

    setGraphData({ nodes, links })
    setLoading(false)
  }, [companion])

  useEffect(() => { fetchData() }, [fetchData])

  return { graphData, loading, refresh: fetchData }
}

function generateSyntheticLinks(nodes: GraphNode[], existingLinks: GraphLink[]): GraphLink[] {
  const existing = new Set(
    existingLinks.map(l => {
      const src = typeof l.source === 'string' ? l.source : l.source.id
      const tgt = typeof l.target === 'string' ? l.target : l.target.id
      return `${src}-${tgt}`
    })
  )

  const synthetic: GraphLink[] = []

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]
      const b = nodes[j]
      const key1 = `${a.id}-${b.id}`
      const key2 = `${b.id}-${a.id}`
      if (existing.has(key1) || existing.has(key2)) continue

      // Same emotional tag -> faint connection
      if (a.emotionalTag && a.emotionalTag === b.emotionalTag) {
        synthetic.push({
          source: a.id,
          target: b.id,
          relation: 'echoes',
          strength: 0.2,
          synthetic: true
        })
        existing.add(key1)
        continue
      }

      // Created within 2 hours -> temporal proximity
      if (a.createdAt && b.createdAt) {
        const diff = Math.abs(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        if (diff < 2 * 60 * 60 * 1000) {
          synthetic.push({
            source: a.id,
            target: b.id,
            relation: 'same_event',
            strength: 0.15,
            synthetic: true
          })
          existing.add(key1)
        }
      }
    }
  }

  return synthetic
}
