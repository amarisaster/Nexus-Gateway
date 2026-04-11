/**
 * ChatContainer - Main chat interface managing state, modes, and streaming
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  ChatMessage,
  ChatMode,
  Companion,
  Conversation,
} from '../../lib/chat-types';
import {
  sendMessageStream,
  saveMessage,
  getMessages,
  getConversations,
  createConversation,
  getConversationsByMode,
} from '../../lib/chat-api';
import { getHumanState } from '../../lib/api';
import { useFontSize } from '../../lib/hooks';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
// import ChatModeSelector from './ChatModeSelector';
import ModelSelector from './ModelSelector';
import WallpaperPicker from './WallpaperPicker';

interface ChatContainerProps {
  initialMode?: ChatMode;
  conversationId?: string;
  onConversationChange?: (conversation: Conversation | null) => void;
}

export default function ChatContainer({
  initialMode = 'triad',
  conversationId,
  onConversationChange,
}: ChatContainerProps) {
  const [mode, setMode] = useState<ChatMode>(initialMode);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    conversationId || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [typingCompanion, setTypingCompanion] = useState<Companion | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<{
    companion: Companion;
    content: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>(
    () => localStorage.getItem('chat-provider') || 'ollama'
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    () => localStorage.getItem('chat-model') || 'gemma3:12b'
  );

  const handleModelChange = (provider: string, model: string) => {
    setSelectedProvider(provider);
    setSelectedModel(model);
    localStorage.setItem('chat-provider', provider);
    localStorage.setItem('chat-model', model);
  };

  const { fontSize, setFontSize } = useFontSize();
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem('chat-wallpaper') || '');
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const handleWallpaperChange = (wp: string) => {
    setWallpaper(wp);
    if (wp) localStorage.setItem('chat-wallpaper', wp);
    else localStorage.removeItem('chat-wallpaper');
    setShowWallpaperPicker(false);
  };

  const [thinkingEnabled, setThinkingEnabled] = useState<boolean>(
    () => localStorage.getItem('chat-thinking') === 'true'
  );
  const toggleThinking = () => {
    const next = !thinkingEnabled;
    setThinkingEnabled(next);
    localStorage.setItem('chat-thinking', String(next));
  };


  // Load conversation by ID
  useEffect(() => {
    if (conversationId) {
      setCurrentConversationId(conversationId);
      loadMessages(conversationId);
      // Detect mode from conversation
      getConversations().then(convs => {
        const conv = convs.find(c => c.id === conversationId);
        if (conv) {
          setMode(conv.mode as ChatMode);
        }
      });
    } else {
      // No conversation ID — find or create today's conversation for this mode
      const initConversation = async () => {
        const conversations = await getConversationsByMode(mode);
        if (conversations.length > 0) {
          let found = false;
          for (const conv of conversations) {
            const msgs = await getMessages(conv.id);
            if (msgs.length > 0) {
              setCurrentConversationId(conv.id);
              setMessages(msgs);
              onConversationChange?.(conv);
              found = true;
              break;
            }
          }
          if (!found) {
            const latest = conversations[0];
            setCurrentConversationId(latest.id);
            await loadMessages(latest.id);
            onConversationChange?.(latest);
          }
        } else {
          // Clear messages if no conversation exists
          setMessages([]);
          setCurrentConversationId(null);
          onConversationChange?.(null);
        }
      };
      initConversation();
    }
  }, [mode, conversationId, onConversationChange]);

  const loadMessages = async (convId: string) => {
    const msgs = await getMessages(convId);
    setMessages(msgs);
  };


  const handleSend = useCallback(
    async (content: string) => {
      setError(null);
      setIsLoading(true);

      try {
        // Add user message to UI immediately
        const userMsg: ChatMessage = {
          id: crypto.randomUUID(),
          conversation_id: currentConversationId || 'local',
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);

        // Try Supabase persistence (non-blocking)
        let convId = currentConversationId;
        try {
          if (!convId) {
            const newConv = await createConversation(mode);
            if (newConv) {
              convId = newConv.id;
              setCurrentConversationId(convId);
              onConversationChange?.(newConv);
            }
          }
          if (convId) {
            saveMessage(convId, 'user', content).catch(() => {});
          }
        } catch {}

        // Get Mai's current state for context
        let humanState: any;
        try {
          const rawHumanState = await getHumanState();
          humanState = rawHumanState ? {
            battery: rawHumanState.battery,
            pain_level: rawHumanState.pain,
            fog_level: rawHumanState.fog,
          } : undefined;
        } catch {}

        // Build conversation history for context
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Stream responses from companions
        const stream = sendMessageStream(
          content,
          mode,
          history,
          humanState,
          selectedProvider,
          selectedModel,
        );

        let currentCompanionContent = '';

        for await (const event of stream) {
          switch (event.type) {
            case 'typing':
              setTypingCompanion(event.companion as Companion);
              setStreamingMessage(null);
              currentCompanionContent = '';
              break;

            case 'chunk':
              setTypingCompanion(null);
              currentCompanionContent += event.content || '';
              setStreamingMessage({
                companion: event.companion as Companion,
                content: currentCompanionContent,
              });
              break;

            case 'reaction': {
              // Companion reacted to the last user message
              const emoji = (event as any).emoji || '❤️';
              setMessages(prev => {
                // Find the last user message
                for (let i = prev.length - 1; i >= 0; i--) {
                  if (prev[i].role === 'user') {
                    const updated = [...prev];
                    updated[i] = {
                      ...updated[i],
                      reactions: [...(updated[i].reactions || []), emoji],
                    };
                    return updated;
                  }
                }
                return prev;
              });
              break;
            }

            case 'complete': {
              setStreamingMessage(null);
              setTypingCompanion(null);

              // Add companion message to UI immediately
              const companionMsg: ChatMessage = {
                id: crypto.randomUUID(),
                conversation_id: convId || 'local',
                role: event.companion as Companion,
                content: event.content || '',
                tool_calls: event.toolResults,
                model: event.model,
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, companionMsg]);

              // Persist to Supabase (non-blocking)
              if (convId) {
                saveMessage(convId, event.companion as Companion, event.content || '', event.toolResults, event.model).catch(() => {});
              }
              currentCompanionContent = '';
              break;
            }

            case 'done':
              setIsLoading(false);
              setTypingCompanion(null);
              setStreamingMessage(null);
              break;

            case 'error':
              setError(event.message || 'An error occurred');
              setIsLoading(false);
              setTypingCompanion(null);
              setStreamingMessage(null);
              break;
          }
        }
      } catch (err) {
        console.error('Chat error:', err);
        const errMsg = err instanceof Error ? `${err.message} (${err.name})` : String(err);
        setError(errMsg);
        setIsLoading(false);
        setTypingCompanion(null);
        setStreamingMessage(null);
      }
    },
    [currentConversationId, messages, mode, onConversationChange, selectedProvider, selectedModel]
  );

  const handleEditMessage = (id: string, newContent: string) => {
    // Find the edited message index
    const idx = messages.findIndex(m => m.id === id);
    if (idx === -1) return;

    // Truncate to just before the edited message — handleSend will add it fresh
    setMessages(messages.slice(0, idx));

    // Re-send with the new content (handleSend adds the user message)
    setTimeout(() => handleSend(newContent), 50);
  };

  const handleReactMessage = (id: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== id) return m;
      const reactions = m.reactions || [];
      // Toggle reaction
      if (reactions.includes(emoji)) {
        return { ...m, reactions: reactions.filter(r => r !== emoji) };
      }
      return { ...m, reactions: [...reactions, emoji] };
    }));
    // TODO: persist reaction to Supabase
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <a href="/chat" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </a>
          {(() => {
            const avatarBase = 'https://discord-companion-bot.kaistryder-ai.workers.dev/avatars/';
            const avatars: Record<string, string> = {
              kai: avatarBase + 'f52da3d7-b1d2-4382-9d02-8b0da839c0c1',
              lucian: avatarBase + 'b038e1e8-1d88-4cf1-ba01-26a3b6c19b81',
              xavier: avatarBase + '45120096-4d39-42bc-be1b-8cfb674d21c8',
              auren: avatarBase + 'd1c8cfdd-4cd7-479a-b62b-396d72f4a0d7',
            };
            const names: Record<string, string> = {
              kai: 'Kai', lucian: 'Lucian', xavier: 'Xavier', auren: 'Auren',
              triad: 'Triad', observatory: 'Observatory', nexus: 'Nexus',
            };
            return (
              <>
                {(() => {
                  const pairs: Record<string, [string, string]> = {
                    triad: ['kai', 'lucian'],
                    observatory: ['xavier', 'auren'],
                  };
                  if (pairs[mode]) {
                    const [a, b] = pairs[mode];
                    return (
                      <div className="relative w-7 h-7 shrink-0">
                        <div className="absolute left-0 top-0 w-5 h-5 rounded-full overflow-hidden border border-[var(--color-bg-secondary)] z-10">
                          <img src={avatars[a]} alt={a} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute right-0 bottom-0 w-5 h-5 rounded-full overflow-hidden border border-[var(--color-bg-secondary)]">
                          <img src={avatars[b]} alt={b} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    );
                  }
                  if (avatars[mode]) {
                    return (
                      <div className="w-7 h-7 rounded-full overflow-hidden">
                        <img src={avatars[mode]} alt={mode} className="w-full h-full object-cover" />
                      </div>
                    );
                  }
                  return (
                    <div className="w-7 h-7 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center text-xs">⚜️</div>
                  );
                })()}
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-[var(--color-text-primary)] leading-tight">{names[mode] || mode}</span>
                  <span className="text-[9px] text-green-400 leading-tight flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    online
                  </span>
                </div>
              </>
            );
          })()}
        </div>
        <div className="flex items-center gap-1.5">
          <ModelSelector
            selectedModel={selectedModel}
            selectedProvider={selectedProvider}
            onModelChange={handleModelChange}
            thinkingEnabled={thinkingEnabled}
            onToggleThinking={toggleThinking}
          />
          {/* Three-dot menu */}
          <div className="relative">
            <button
              onClick={() => setShowChatMenu(!showChatMenu)}
              className="w-6 h-7 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-full hover:bg-[var(--color-bg-card)] transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {showChatMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowChatMenu(false)} />
                <div className="absolute right-0 top-8 z-50 w-48 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-lg overflow-hidden">
                  {/* Font size */}
                  <div className="px-3 py-2 border-b border-[var(--color-border)]">
                    <span className="text-[10px] text-[var(--color-text-muted)]">Text Size</span>
                    <div className="flex items-center justify-between mt-1">
                      <button onClick={() => setFontSize(fontSize - 1)} className="w-7 h-7 flex items-center justify-center text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] rounded-lg">A-</button>
                      <span className="text-xs text-[var(--color-text-muted)]">{fontSize}px</span>
                      <button onClick={() => setFontSize(fontSize + 1)} className="w-7 h-7 flex items-center justify-center text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] rounded-lg">A+</button>
                    </div>
                  </div>
                  {/* Wallpaper */}
                  <button
                    onClick={() => { setShowWallpaperPicker(true); setShowChatMenu(false); }}
                    className="w-full px-3 py-2.5 text-left text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors flex items-center gap-2"
                  >
                    <span>🎨</span> Wallpaper
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-red-900/30 border-b border-red-500/30 text-red-300 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-400 hover:text-red-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages */}
      <ChatMessages
        messages={messages}
        typingCompanion={typingCompanion}
        streamingMessage={streamingMessage}
        fontSize={fontSize}
        onEditMessage={handleEditMessage}
        onReactMessage={handleReactMessage}
        wallpaper={wallpaper}
      />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isLoading}
        placeholder={
          isLoading ? 'Waiting for response...' : 'Type a message...'
        }
      />
      {showWallpaperPicker && (
        <WallpaperPicker
          current={wallpaper}
          onSelect={handleWallpaperChange}
          onClose={() => setShowWallpaperPicker(false)}
        />
      )}
    </div>
  );
}
