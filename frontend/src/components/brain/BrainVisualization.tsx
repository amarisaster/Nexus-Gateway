import { Suspense, useState, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, AdaptiveEvents, Preload } from '@react-three/drei'
import type { CompanionId, GraphNode } from './brainTypes'
import type { EmotionalState } from '../../lib/api'
import { useBrainData } from './useBrainData'
import { useBrainPolling } from './useBrainPolling'
import { getTheme } from './brainTheme'
import MemoryNodeDetail from './MemoryNodeDetail'

const BrainScene = lazy(() => import('./BrainScene'))

interface Props {
  companion: CompanionId
  emotional: EmotionalState | null
}

export default function BrainVisualization({ companion, emotional }: Props) {
  const { graphData, loading, refresh } = useBrainData(companion)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const theme = getTheme(companion)

  useBrainPolling(refresh, 5000)

  if (loading) {
    return (
      <div className="w-full aspect-square max-h-[50vh] rounded-xl bg-[#242424] flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading brain...</div>
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-square max-h-[50vh] rounded-xl overflow-hidden bg-[#0d0a1a]">
      <Canvas
        camera={{ position: [0, 0, 120], fov: 60, near: 1, far: 500 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <Suspense fallback={null}>
          <BrainScene
            graphData={graphData}
            emotional={emotional}
            theme={theme}
            onNodeClick={setSelectedNode}
          />
          <Preload all />
        </Suspense>
      </Canvas>

      {/* Node count indicator */}
      <div className="absolute top-2 right-2 text-[10px] text-gray-600">
        {graphData.nodes.length} memories
      </div>

      {selectedNode && (
        <MemoryNodeDetail
          node={selectedNode}
          theme={theme}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  )
}
