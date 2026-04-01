/**
 * ChatMessages - Scrollable message list with auto-scroll
 */

import { useEffect, useRef } from 'react';
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

  // Track if user has scrolled up
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // If user is within 100px of bottom, enable auto-scroll
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100;
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
    </div>
  );
}
