import type { GraphNode, BrainTheme } from './brainTypes'

interface Props {
  node: GraphNode
  theme: BrainTheme
  onClose: () => void
}

export default function MemoryNodeDetail({ node, theme, onClose }: Props) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 p-4 bg-[#242424]/95 backdrop-blur-sm rounded-t-xl border-t border-white/10 z-10"
      style={{ animation: 'slideUp 0.2s ease-out' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: theme.nodeColors[node.type] || theme.primary }}
        >
          {node.type}
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 text-sm hover:text-white"
        >
          close
        </button>
      </div>
      <p className="text-sm text-gray-300 mb-2 line-clamp-3">{node.content || 'No content'}</p>
      <div className="flex gap-4 text-xs text-gray-500">
        <span>salience: {node.salience}</span>
        {node.emotionalTag && <span>feeling: {node.emotionalTag}</span>}
        {node.accessCount != null && <span>accessed: {node.accessCount}x</span>}
      </div>
    </div>
  )
}
