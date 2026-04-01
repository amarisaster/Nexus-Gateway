import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import type { BrainTheme } from './brainTypes'

export default function GlassBrain({ theme }: { theme: BrainTheme }) {
  const groupRef = useRef<THREE.Group>(null)

  // Create a brain-shaped geometry by deforming a sphere
  const brainGeometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 5) // high detail
    const pos = geo.attributes.position
    const vertex = new THREE.Vector3()

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i)

      // Brain proportions: wider than tall, slight front-back elongation
      let x = vertex.x
      let y = vertex.y
      let z = vertex.z

      // Longitudinal fissure (groove down the middle)
      const fissureDepth = 0.12 * Math.exp(-Math.pow(z * 4, 2)) * (1 - Math.abs(y) * 0.5)
      x *= (1 - fissureDepth * Math.sign(x) * 0.5)
      // Push vertices inward along z=0 plane
      const centralGroove = Math.exp(-Math.pow(z * 6, 2)) * 0.08
      const dist = Math.sqrt(x * x + y * y + z * z)
      const factor = 1 - centralGroove

      // Brain-fold bumps using layered sine waves
      const nx = x * 8, ny = y * 8, nz = z * 8
      const folds = (
        Math.sin(nx * 1.2 + ny * 0.8) * 0.03 +
        Math.sin(ny * 1.5 + nz * 1.1) * 0.025 +
        Math.sin(nz * 1.3 + nx * 0.9) * 0.02 +
        Math.sin(nx * 2.1 + nz * 1.7) * 0.015
      )

      // Flatten bottom slightly (brain sits on brainstem)
      const bottomFlatten = y < -0.5 ? (1 + (y + 0.5) * 0.4) : 1

      // Apply all deformations
      const r = dist * (1 + folds) * factor * bottomFlatten
      const theta = Math.atan2(Math.sqrt(x * x + z * z), y)
      const phi = Math.atan2(z, x)

      pos.setXYZ(i,
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.cos(theta),
        r * Math.sin(theta) * Math.sin(phi)
      )
    }

    geo.computeVertexNormals()
    return geo
  }, [])

  // Brain stays still — user can rotate via OrbitControls

  const color = new THREE.Color(theme.primary)

  return (
    <group ref={groupRef}>
      {/* Glass brain — transparent solid shell, visible shape */}
      <mesh geometry={brainGeometry} scale={[44, 36, 38]}>
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.12}
          roughness={0.05}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>

      {/* Edge glow — defines the brain outline */}
      <mesh geometry={brainGeometry} scale={[45, 37, 39]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
