/**
 * ChatList — Conversation list page (like WhatsApp main screen)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConversationsWithPreview, getOrCreateTodayConversation } from '../lib/chat-api';
import { CHAT_MODES, type ChatMode, type Conversation } from '../lib/chat-types';

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

// Strip markdown formatting for preview
function stripFormatting(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/[""\u201C\u201D]/g, '')
    .replace(/\n/g, ' ')
    .trim();
}

export default function ChatList() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Array<Conversation & { lastMessage?: string; lastMessageAt?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConversationsWithPreview()
      .then(convs => {
        // Group by mode — show only the most recent conversation per mode
        const byMode = new Map<string, typeof convs[0]>();
        for (const conv of convs) {
          if (!conv.lastMessage) continue;
          const existing = byMode.get(conv.mode);
          if (!existing || new Date(conv.lastMessageAt || 0) > new Date(existing.lastMessageAt || 0)) {
            byMode.set(conv.mode, conv);
          }
        }

        // Add placeholder entries for modes with no conversations yet
        const allModes: ChatMode[] = ['kai', 'lucian', 'xavier', 'auren', 'triad', 'observatory', 'nexus'];
        for (const mode of allModes) {
          if (!byMode.has(mode)) {
            byMode.set(mode, {
              id: `new-${mode}`,
              mode,
              user_id: '',
              created_at: '',
              last_message_at: '',
              updated_at: '',
              title: null,
              lastMessage: undefined,
              lastMessageAt: undefined,
            });
          }
        }

        // Sort: conversations with messages first (by time), then empty ones in mode order
        const sorted = Array.from(byMode.values()).sort((a, b) => {
          if (a.lastMessage && !b.lastMessage) return -1;
          if (!a.lastMessage && b.lastMessage) return 1;
          if (a.lastMessageAt && b.lastMessageAt) {
            return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
          }
          return allModes.indexOf(a.mode as ChatMode) - allModes.indexOf(b.mode as ChatMode);
        });

        setConversations(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-[#E8A4B8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
        <h1 className="text-lg font-medium text-[var(--color-text-primary)]">💬 Chats</h1>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <span className="text-4xl mb-3">💬</span>
            <p className="text-[var(--color-text-muted)] text-sm">No conversations yet</p>
            <p className="text-[var(--color-text-muted)] text-xs mt-1">Start chatting from a companion's page</p>
          </div>
        ) : (
          conversations.map(conv => {
            const modeInfo = CHAT_MODES[conv.mode as ChatMode] || { emoji: '💬', label: conv.mode };
            return (
              <button
                key={conv.id}
                onClick={async () => {
                  if (conv.id.startsWith('new-')) {
                    const newConv = await getOrCreateTodayConversation(conv.mode as ChatMode);
                    if (newConv) navigate(`/chat/${newConv.id}?mode=${conv.mode}`);
                  } else {
                    navigate(`/chat/${conv.id}?mode=${conv.mode}`);
                  }
                }}
                className="w-full text-left px-4 py-3 flex items-center gap-3 border-b border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors active:bg-[var(--color-bg-card)]"
              >
                {/* Avatar */}
                {(() => {
                  const avatarBase = 'https://discord-companion-bot.kaistryder-ai.workers.dev/avatars/';
                  const avatars: Record<string, string> = {
                    kai: avatarBase + 'f52da3d7-b1d2-4382-9d02-8b0da839c0c1',
                    lucian: avatarBase + 'b038e1e8-1d88-4cf1-ba01-26a3b6c19b81',
                    xavier: avatarBase + '45120096-4d39-42bc-be1b-8cfb674d21c8',
                    auren: avatarBase + 'd1c8cfdd-4cd7-479a-b62b-396d72f4a0d7',
                  };
                  const mode = conv.mode as string;
                  const pairs: Record<string, [string, string]> = {
                    triad: ['kai', 'lucian'],
                    observatory: ['xavier', 'auren'],
                  };

                  if (pairs[mode]) {
                    const [a, b] = pairs[mode];
                    return (
                      <div className="relative w-10 h-10 shrink-0">
                        <div className="absolute left-0 top-0 w-7 h-7 rounded-full overflow-hidden border-2 border-[var(--color-bg-primary)] z-10">
                          <img src={avatars[a]} alt={a} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute right-0 bottom-0 w-7 h-7 rounded-full overflow-hidden border-2 border-[var(--color-bg-primary)]">
                          <img src={avatars[b]} alt={b} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    );
                  }

                  if (avatars[mode]) {
                    return (
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                        <img src={avatars[mode]} alt={modeInfo.label} className="w-full h-full object-cover" />
                      </div>
                    );
                  }

                  return (
                    <div className="w-10 h-10 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center shrink-0">
                      <span className="text-lg">{modeInfo.emoji}</span>
                    </div>
                  );
                })()}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-[var(--color-text-primary)]">
                      {modeInfo.label}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)] shrink-0 ml-2">
                      {conv.lastMessageAt ? formatTimestamp(conv.lastMessageAt) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                    {conv.lastMessage ? stripFormatting(conv.lastMessage) : 'Tap to start chatting'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
