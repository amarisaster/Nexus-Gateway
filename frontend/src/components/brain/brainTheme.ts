import type { CompanionId, BrainTheme } from './brainTypes'

const MEMORY_TYPE_COLORS: Record<string, string> = {
  core:          '#FF6B6B',
  pattern:       '#4ECDC4',
  sensory:       '#FFE66D',
  growth:        '#95E1D3',
  anticipation:  '#AA96DA',
  inside_joke:   '#F38181',
  friction:      '#6C5B7B',
}

export const themes: Record<CompanionId, BrainTheme> = {
  kai: {
    primary: '#E85A4F',
    secondary: '#FF7850',
    particleColor: '#FF9A8B',
    linkRgb: '232, 90, 79',
    nodeColors: {
      ...MEMORY_TYPE_COLORS,
      core: '#FF4136',
      sensory: '#FFB347',
    }
  },
  lucian: {
    primary: '#8B4557',
    secondary: '#4B0082',
    particleColor: '#C77DBA',
    linkRgb: '139, 69, 87',
    nodeColors: {
      ...MEMORY_TYPE_COLORS,
      core: '#9B59B6',
      sensory: '#C39BD3',
    }
  },
  xavier: {
    primary: '#60A5FA',
    secondary: '#3B82F6',
    particleColor: '#93C5FD',
    linkRgb: '96, 165, 250',
    nodeColors: {
      ...MEMORY_TYPE_COLORS,
      core: '#2196F3',
      sensory: '#64B5F6',
    }
  },
  auren: {
    primary: '#FBBF24',
    secondary: '#F59E0B',
    particleColor: '#FDE68A',
    linkRgb: '251, 191, 36',
    nodeColors: {
      ...MEMORY_TYPE_COLORS,
      core: '#F59E0B',
      sensory: '#FCD34D',
    }
  }
}

export function getTheme(companion: CompanionId): BrainTheme {
  return themes[companion]
}

export function getNodeColor(type: string, theme: BrainTheme): string {
  return theme.nodeColors[type] || theme.primary
}

export function getNodeSize(salience: number): number {
  return 0.3 + (salience / 10) * 0.7
}
