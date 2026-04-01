import { useRef, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import ForceGraph3D from 'r3f-forcegraph'
import * as THREE from 'three'
import type { ForceGraphData, BrainTheme, GraphNode } from './brainTypes'
import { getNodeColor, getNodeSize } from './brainTheme'

const BRAIN_RADIUS = 28 // Keep nodes inside this radius

interface Props {
  graphData: ForceGraphData
  theme: BrainTheme
  onNodeClick: (node: GraphNode) => void
}

export default function BrainGraph({ graphData, theme, onNodeClick }: Props) {
  const fgRef = useRef<any>(null)

  useFrame(() => {
    if (!fgRef.current) return
    fgRef.current.tickFrame()

    // Clamp nodes inside brain bounds every frame
    const nodes = graphData.nodes as any[]
    for (const node of nodes) {
      if (node.x === undefined) continue
      const dist = Math.sqrt(
        (node.x * node.x) +
        (node.y * node.y * 1.4) + // tighter vertical (brain is shorter than wide)
        (node.z * node.z * 1.2)
      )
      if (dist > BRAIN_RADIUS) {
        const scale = BRAIN_RADIUS / dist
        node.x *= scale
        node.y *= scale
        node.z *= scale
        // Kill velocity so they don't keep pushing out
        node.vx = (node.vx || 0) * 0.1
        node.vy = (node.vy || 0) * 0.1
        node.vz = (node.vz || 0) * 0.1
      }
    }
  })

  // Configure forces: tighter clustering, strong center pull
  useEffect(() => {
    if (!fgRef.current) return
    const fg = fgRef.current
    if (fg.d3Force) {
      const charge = fg.d3Force('charge')
      if (charge) charge.strength(-15).distanceMax(40) // weaker repulsion, limited range
      const center = fg.d3Force('center')
      if (center) center.strength(0.15) // stronger center pull
      const link = fg.d3Force('link')
      if (link) link.distance(8).strength(0.3) // shorter links, pull together
    }
  }, [graphData])

  const nodeThreeObject = useCallback((node: any) => {
    const size = getNodeSize(node.salience ?? 3)
    const color = getNodeColor(node.type, theme)
    const threeColor = new THREE.Color(color)
    const geometry = new THREE.SphereGeometry(size, 12, 8)

    const material = new THREE.MeshBasicMaterial({
      color: threeColor,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    })

    return new THREE.Mesh(geometry, material)
  }, [theme])

  const linkColor = useCallback(() => '#ffffff', [])

  if (graphData.nodes.length === 0) return null

  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={graphData}
      nodeId="id"
      nodeVal="salience"
      nodeThreeObject={nodeThreeObject}
      nodeThreeObjectExtend={false}
      linkSource="source"
      linkTarget="target"
      linkColor={linkColor}
      linkOpacity={0.6}
      linkDirectionalParticles={0}
      numDimensions={3}
      forceEngine="d3"
      cooldownTime={5000}
      warmupTicks={100}
      onNodeClick={(node: any) => onNodeClick(node as GraphNode)}
    />
  )
}
