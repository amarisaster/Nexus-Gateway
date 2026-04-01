import { Sparkles } from '@react-three/drei'
import type { BrainTheme } from './brainTypes'

export default function BrainParticles({ theme }: { theme: BrainTheme }) {
  return (
    <Sparkles
      count={40}
      scale={70}
      size={1.5}
      speed={0.2}
      opacity={0.3}
      color={theme.particleColor}
    />
  )
}
