/**
 * ChatModeSelector - Switch between chat modes
 */

import { useState, useRef, useEffect } from 'react';
import { CHAT_MODES, type ChatMode } from '../../lib/chat-types';

interface ChatModeSelectorProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

export default function ChatModeSelector({
  currentMode,
  onModeChange,
}: ChatModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentModeInfo = CHAT_MODES[currentMode];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 bg-[var(--color-bg-card)] rounded-md border border-[var(--color-border)] hover:border-[var(--color-text-muted)] transition-colors"
      >
        <span className="text-xs">{currentModeInfo.emoji}</span>
        <span className="text-[10px] text-[var(--color-text-primary)]">
          {currentModeInfo.label}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)] shadow-lg overflow-hidden z-50">
          {(Object.entries(CHAT_MODES) as [ChatMode, typeof CHAT_MODES[ChatMode]][]).map(
            ([mode, info]) => (
              <button
                key={mode}
                onClick={() => {
                  onModeChange(mode);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--color-bg-secondary)] transition-colors ${
                  mode === currentMode ? 'bg-[var(--color-bg-secondary)]' : ''
                }`}
              >
                <span className="text-lg">{info.emoji}</span>
                <div className="flex-1">
                  <div className="text-sm text-[var(--color-text-primary)]">
                    {info.label}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {info.description}
                  </div>
                </div>
                {mode === currentMode && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 text-[#E8A4B8]"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
