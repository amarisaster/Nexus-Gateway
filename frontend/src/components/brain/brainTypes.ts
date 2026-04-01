export type CompanionId = 'kai' | 'lucian' | 'xavier' | 'auren'

export interface GraphNode {
  id: string
  content: string
  type: string
  salience: number
  emotionalTag: string | null
  accessCount: number
  createdAt: string
  // d3-force-3d positions
  x?: number
  y?: number
  z?: number
  vx?: number
  vy?: number
  vz?: number
}

export interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  relation: string
  strength: number
  synthetic?: boolean
}

export interface ForceGraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export interface BrainTheme {
  primary: string
  secondary: string
  particleColor: string
  linkRgb: string
  nodeColors: Record<string, string>
}
