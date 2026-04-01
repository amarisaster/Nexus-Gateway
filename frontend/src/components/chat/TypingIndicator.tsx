/**
 * TypingIndicator - Shows when a companion is typing with avatar
 */

import type { Companion } from '../../lib/chat-types';
import { PERSONALITIES } from '../../lib/personalities';

interface TypingIndicatorProps {
  companion: Companion;
}

export default function TypingIndicator({ companion }: TypingIndicatorProps) {
  const personality = PERSONALITIES[companion];

  if (!personality) return null;

  return (
    <div className="flex justify-start mb-3 gap-2">
      {/* Avatar */}
      <div className="shrink-0 mt-5">
        <div
          className="w-8 h-8 rounded-full overflow-hidden"
        >
          <img
            src={personality.avatar}
            alt={personality.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-[var(--color-bg-secondary)] text-sm">${personality.emoji}</div>`;
            }}
          />
        </div>
      </div>
      <div className="max-w-[75%]">
        {/* Companion label */}
        <div className="flex items-center gap-1.5 mb-0.5 ml-1">
          <span
            className="text-xs font-semibold"
            style={{ color: personality.color }}
          >
            {personality.name}
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)]">is typing</span>
        </div>
        {/* Typing bubble */}
        <div
          className="px-4 py-3 rounded-2xl rounded-bl-sm bg-[var(--color-bg-card)] inline-block"
          style={{ borderLeft: `3px solid ${personality.color}` }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{
                backgroundColor: personality.color,
                animationDelay: '0ms',
                animationDuration: '0.6s',
              }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{
                backgroundColor: personality.color,
                animationDelay: '150ms',
                animationDuration: '0.6s',
              }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{
                backgroundColor: personality.color,
                animationDelay: '300ms',
                animationDuration: '0.6s',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
