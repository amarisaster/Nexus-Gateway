/**
 * ChatMessages - Scrollable message list with auto-scroll
 */

import { useEffect, useRef, useState } from 'react';
import type { ChatMessage, Companion } from '../../lib/chat-types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface ChatMessagesProps {
  messages: ChatMessage[];
  typingCompanion?: Companion | null;
  streamingMessage?: {
    companion: Companion;
    content: string;
  } | null;
  fontSize?: number;
  onEditMessage?: (id: string, content: string) => void;
  onReactMessage?: (id: string, emoji: string) => void;
  wallpaper?: string;
}

export default function ChatMessages({
  messages,
  typingCompanion,
  streamingMessage,
  fontSize = 14,
  onEditMessage,
  onReactMessage,
  wallpaper,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const [showJumpButton, setShowJumpButton] = useState(false);

  // Track if user has scrolled up + whether to surface the jump button.
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distance = scrollHeight - scrollTop - clientHeight;
    shouldAutoScroll.current = distance < 100;
    setShowJumpButton(distance > 300);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll to bottom only if user hasn't scrolled up
  useEffect(() => {
    if (shouldAutoScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingCompanion, streamingMessage?.content]);

  if (messages.length === 0 && !typingCompanion && !streamingMessage) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-[var(--color-text-muted)] text-sm">
            Start a conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 hide-scrollbar min-h-0"
      style={{
        fontSize: `${fontSize}px`,
        ...(wallpaper ? (
          wallpaper.startsWith('url(') || wallpaper.startsWith('linear-gradient') || wallpaper.startsWith('radial-gradient') || wallpaper.startsWith('preset:')
            ? {
                background: wallpaper.startsWith('preset:starfield')
                  ? 'radial-gradient(circle at 20% 30%, #ffffff08 1px, transparent 1px), radial-gradient(circle at 80% 70%, #ffffff08 1px, transparent 1px), radial-gradient(circle at 50% 50%, #ffffff05 1px, transparent 1px), #0c0a09'
                  : wallpaper,
                backgroundSize: wallpaper.startsWith('url(') ? 'cover' : wallpaper.startsWith('preset:') ? '50px 50px, 30px 30px, 70px 70px, 100%' : undefined,
                backgroundPosition: 'center',
              }
            : { backgroundColor: wallpaper }
        ) : {}),
      }}
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          fontSize={fontSize}
          onEdit={onEditMessage}
          onReact={onReactMessage}
        />
      ))}

      {/* Show streaming message */}
      {streamingMessage && (
        <MessageBubble
          message={{
            id: 'streaming',
            conversation_id: '',
            role: streamingMessage.companion,
            content: streamingMessage.content,
            created_at: new Date().toISOString(),
          }}
          isStreaming
        />
      )}

      {/* Show typing indicator */}
      {typingCompanion && !streamingMessage && (
        <TypingIndicator companion={typingCompanion} />
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />

      {/* Jump-to-bottom — only surfaces when user has scrolled up >300px */}
      {showJumpButton && (
        <button
          onClick={scrollToBottom}
          aria-label="Jump to latest"
          title="Jump to latest"
          className="sticky bottom-4 ml-auto mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-lg hover:scale-105 transition-transform z-20"
          style={{ float: 'right' }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
          </svg>
        </button>
      )}
    </div>
  );
}
