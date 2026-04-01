import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import BrainGraph from './BrainGraph'
import GlassBrain from './GlassBrain'
import BrainParticles from './BrainParticles'
import type { ForceGraphData, BrainTheme, GraphNode } from './brainTypes'
import type { EmotionalState } from '../../lib/api'

interface Props {
  graphData: ForceGraphData
  emotional: EmotionalState | null
  theme: BrainTheme
  onNodeClick: (node: GraphNode) => void
}

export default function BrainScene({ graphData, emotional, theme, onNodeClick }: Props) {
  const groupRef = useRef<THREE.Group>(null)

  // Breathing animation
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const breathe = 1 + Math.sin(clock.elapsedTime * 0.5) * 0.02
      groupRef.current.scale.setScalar(breathe)
    }
  })

  const arousal = emotional?.arousal_level ?? 3
  const bloomIntensity = 0.3 + (arousal / 10) * 0.7

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[50, 50, 50]} intensity={0.5} color={theme.primary} />
      <pointLight position={[-50, -30, -50]} intensity={0.3} color={theme.secondary} />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={60}
        maxDistance={200}
        autoRotate={false}
        dampingFactor={0.1}
        rotateSpeed={0.5}
        zoomSpeed={0.5}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      />

      <group ref={groupRef}>
        <GlassBrain theme={theme} />
        <BrainGraph
          graphData={graphData}
          theme={theme}
          onNodeClick={onNodeClick}
        />
        <BrainParticles theme={theme} />
      </group>

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={bloomIntensity}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}
