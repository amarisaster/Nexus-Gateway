/**
 * ModelSelector - Dropdown to pick inference model/provider
 */

import { useState, useEffect, useRef } from 'react';
import { fetchModels } from '../../lib/chat-api';
import type { ModelInfo } from '../../lib/chat-types';

interface ModelSelectorProps {
  selectedModel: string;
  selectedProvider: string;
  onModelChange: (provider: string, model: string) => void;
  thinkingEnabled?: boolean;
  onToggleThinking?: () => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  ollama: '🦙',
  openrouter: '🔀',
  huggingface: '🤗',
  companion: '💜',
  openai: '🧠',
  anthropic: '🎭',
  groq: '⚡',
  xai: '🌀',
  custom: '🛠️',
};

const TIER_LABELS: Record<string, string> = {
  free: '🟢',
  included: '🔵',
  paid: '🟡',
};

export default function ModelSelector({ selectedModel, selectedProvider, onModelChange, thinkingEnabled, onToggleThinking }: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchModels().then(m => {
      if (m.length > 0) {
        setModels(m);
      } else {
        // Fallback models if fetch fails
        setModels([
          { id: 'gemma3:12b', provider: 'ollama' as const, name: 'Gemma 3 12B (fast)', contextWindow: 131072, costTier: 'included' as const },
          { id: 'gemma3:27b', provider: 'ollama' as const, name: 'Gemma 3 27B', contextWindow: 131072, costTier: 'included' as const },
          { id: 'deepseek-v3.2', provider: 'ollama' as const, name: 'DeepSeek V3.2', contextWindow: 131072, costTier: 'included' as const },
          { id: 'qwen3-next:80b', provider: 'ollama' as const, name: 'Qwen 3 Next 80B', contextWindow: 131072, costTier: 'included' as const },
          { id: 'kimi-k2-thinking', provider: 'ollama' as const, name: 'Kimi K2 Thinking', contextWindow: 1000000, costTier: 'included' as const },
          { id: 'nvidia/nemotron-3-super-120b-a12b:free', provider: 'openrouter' as const, name: 'Nemotron 120B (free)', contextWindow: 262144, costTier: 'free' as const },
          { id: 'minimax/minimax-m2.5:free', provider: 'openrouter' as const, name: 'MiniMax M2.5 (free)', contextWindow: 196608, costTier: 'free' as const },
          { id: 'stepfun/step-3.5-flash:free', provider: 'openrouter' as const, name: 'Step 3.5 Flash (free)', contextWindow: 256000, costTier: 'free' as const },
          { id: 'openai/gpt-oss-120b:free', provider: 'openrouter' as const, name: 'GPT-OSS 120B (free)', contextWindow: 131072, costTier: 'free' as const },
        ]);
      }
    });
  }, []);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = models.find(m => m.id === selectedModel);
  const displayName = current?.name || selectedModel.split('/').pop()?.replace(':free', '') || 'Select Model';

  // Group by provider
  const ollamaModels = models.filter(m => m.provider === 'ollama');
  const openrouterModels = models.filter(m => m.provider === 'openrouter');

  if (models.length === 0) {
    return (
      <div className="px-2 py-1 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)]">
        Loading models...
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 text-[10px] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] rounded-md border border-[var(--color-border)] hover:border-[var(--color-text-muted)] transition-colors"
      >
        <span>{PROVIDER_LABELS[selectedProvider] || '🤖'}</span>
        <span className="max-w-[140px] truncate">{displayName}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 max-h-80 overflow-y-auto bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-lg z-50">
          {/* Thinking toggle */}
          {onToggleThinking && (
            <button
              onClick={onToggleThinking}
              className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between border-b border-[var(--color-border)] transition-colors ${
                thinkingEnabled ? 'text-purple-300' : 'text-[var(--color-text-muted)]'
              }`}
            >
              <span>🧠 Extended Thinking</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                thinkingEnabled ? 'bg-purple-500/20 text-purple-300' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'
              }`}>{thinkingEnabled ? 'ON' : 'OFF'}</span>
            </button>
          )}
          {ollamaModels.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider bg-[var(--color-bg-secondary)]">
                🦙 Ollama Cloud
              </div>
              {ollamaModels.map(m => (
                <button
                  key={m.id}
                  onClick={() => { onModelChange(m.provider, m.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors flex items-center justify-between ${
                    m.id === selectedModel ? 'text-[var(--color-shared)] font-medium' : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  <span className="truncate">{m.name}</span>
                  <span className="text-[10px] ml-2 shrink-0">{TIER_LABELS[m.costTier]}</span>
                </button>
              ))}
            </>
          )}
          {openrouterModels.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider bg-[var(--color-bg-secondary)]">
                🔀 OpenRouter
              </div>
              {openrouterModels.map(m => (
                <button
                  key={m.id}
                  onClick={() => { onModelChange(m.provider, m.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors flex items-center justify-between ${
                    m.id === selectedModel ? 'text-[var(--color-shared)] font-medium' : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  <span className="truncate">{m.name}</span>
                  <span className="text-[10px] ml-2 shrink-0">{TIER_LABELS[m.costTier]}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
