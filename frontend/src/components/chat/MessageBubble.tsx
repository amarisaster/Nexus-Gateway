/**
 * MessageBubble - Individual message component styled per companion
 */

import React from 'react';
import type { ChatMessage, Companion } from '../../lib/chat-types';
import { PERSONALITIES } from '../../lib/personalities';

/** Strip quotes and render markdown: **bold**, *italic*, __underline__ */
function renderFormatted(text: string) {
  // Aggressively strip ALL quotation marks (straight and curly)
  let cleaned = text.replace(/["""\u201C\u201D\u201E\u201F]/g, '');

  const lines = cleaned.split('\n');
  return lines.map((line, i) => {
    const l = line;

    const parts: (string | React.ReactElement)[] = [];
    let key = 0;

    // Process formatting markers sequentially
    const pattern = /(\*\*(.+?)\*\*)|(__(.+?)__)|(\*(.+?)\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(l)) !== null) {
      // Text before match
      if (match.index > lastIndex) {
        parts.push(l.slice(lastIndex, match.index));
      }

      if (match[1]) {
        // **bold**
        parts.push(<strong key={`${i}-${key++}`} className="font-bold">{match[2]}</strong>);
      } else if (match[3]) {
        // __underline__
        parts.push(<span key={`${i}-${key++}`} className="underline">{match[4]}</span>);
      } else if (match[5]) {
        // *italic* — muted color for action text
        parts.push(<em key={`${i}-${key++}`} className="italic text-[var(--color-text-muted)]">{match[6]}</em>);
      }

      lastIndex = match.index + match[0].length;
    }

    // Remaining text after last match
    if (lastIndex < l.length) {
      parts.push(l.slice(lastIndex));
    }

    if (parts.length === 0) parts.push(l);

    return (
      <span key={i}>
        {parts}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

type ContentPart =
  | { kind: 'text'; text: string }
  | { kind: 'image'; url: string }
  | { kind: 'gif'; url: string }
  | { kind: 'video'; url: string }
  | { kind: 'audio'; url: string };

function classifyUrl(raw: string): ContentPart['kind'] | null {
  const u = raw.trim();
  if (u.startsWith('data:')) {
    if (/^data:image\/gif/i.test(u)) return 'gif';
    if (/^data:image\//i.test(u)) return 'image';
    if (/^data:video\//i.test(u)) return 'video';
    if (/^data:audio\//i.test(u)) return 'audio';
    return null;
  }
  if (!/^https?:\/\//i.test(u)) return null;
  if (/\.(gif|gifv)(\?|$)/i.test(u)) return 'gif';
  if (/^https?:\/\/(media\d*|i)\.giphy\.com\//i.test(u)) return 'gif';
  if (/^https?:\/\/giphy\.com\/gifs\//i.test(u)) return 'gif';
  if (/tenor\.com\//i.test(u)) return 'gif';
  if (/\.(mp4|webm|mov)(\?|$)/i.test(u)) return 'video';
  if (/\.(mp3|wav|ogg|m4a|flac)(\?|$)/i.test(u)) return 'audio';
  if (/\.(png|jpg|jpeg|webp|svg)(\?|$)/i.test(u)) return 'image';
  if (u.includes('supabase.co/storage/')) return 'image';
  return null;
}

function parseContent(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const buffered: string[] = [];
  const flush = () => {
    const t = buffered.join('\n').trim();
    if (t) parts.push({ kind: 'text', text: t });
    buffered.length = 0;
  };
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    const wholeLineKind = trimmed ? classifyUrl(trimmed) : null;
    if (wholeLineKind) {
      flush();
      parts.push({ kind: wholeLineKind, url: trimmed } as ContentPart);
      continue;
    }
    const urlMatch = trimmed.match(/(https?:\/\/[^\s)]+)/);
    if (urlMatch) {
      const k = classifyUrl(urlMatch[1]);
      if (k) {
        const before = trimmed.replace(urlMatch[1], '').trim();
        if (before) buffered.push(before);
        flush();
        parts.push({ kind: k, url: urlMatch[1] } as ContentPart);
        continue;
      }
    }
    buffered.push(line);
  }
  flush();
  return parts;
}

function renderContentParts(parts: ContentPart[], keyPrefix: string) {
  return parts.map((part, i) => {
    const k = `${keyPrefix}-${i}`;
    switch (part.kind) {
      case 'text':
        return <div key={k}>{renderFormatted(part.text)}</div>;
      case 'image':
      case 'gif':
        return (
          <img
            key={k}
            src={part.url}
            alt=""
            className="max-w-[240px] rounded-lg mt-1"
            loading="lazy"
          />
        );
      case 'video':
        return (
          <video
            key={k}
            src={part.url}
            controls
            preload="metadata"
            className="max-w-[280px] rounded-lg mt-1"
          />
        );
      case 'audio':
        return (
          <audio
            key={k}
            src={part.url}
            controls
            preload="metadata"
            className="max-w-full mt-1"
          />
        );
    }
  });
}

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  fontSize?: number;
  onEdit?: (id: string, content: string) => void;
  onReact?: (id: string, emoji: string) => void;
}

const QUICK_REACTIONS = ['❤️', '😂', '😮', '🥺', '🔥', '👏'];

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, isStreaming, fontSize, onEdit, onReact }: MessageBubbleProps) {
  const [showActions, setShowActions] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(message.content);
  const [speaking, setSpeaking] = React.useState(false);
  const textStyle = fontSize ? { fontSize: `${fontSize}px`, lineHeight: fontSize <= 16 ? '1.5' : '1.6' } : {};
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const handleSaveEdit = () => {
    if (editText.trim() && onEdit) {
      onEdit(message.id, editText.trim());
    }
    setEditing(false);
  };

  const handleTTS = () => {
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    // Strip markdown formatting for cleaner speech
    const cleanText = message.content
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/\[TOOL:[^\]]*\]/g, '')
      .trim();
    if (!cleanText) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const handleReact = (emoji: string) => {
    if (onReact) onReact(message.id, emoji);
    setShowActions(false);
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="px-3 py-1 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex justify-end mb-3 gap-2">
        <div className="max-w-[75%]">
          <div
            className="px-4 py-2.5 rounded-2xl rounded-br-sm bg-[#E8A4B8] text-black cursor-pointer"
            onClick={() => !editing && setShowActions(!showActions)}
          >
            {editing ? (
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditing(false); }}
                  className="w-full px-2 py-1 text-sm bg-white/30 rounded border-none outline-none"
                  autoFocus
                />
                <div className="flex gap-1 justify-end">
                  <button onClick={() => setEditing(false)} className="text-[10px] px-2 py-0.5 rounded bg-black/10">Cancel</button>
                  <button onClick={handleSaveEdit} className="text-[10px] px-2 py-0.5 rounded bg-black/20 font-medium">Save</button>
                </div>
              </div>
            ) : (
              <div style={textStyle}>
                {renderContentParts(parseContent(message.content), `u-${message.id}`)}
              </div>
            )}
          </div>
          {/* Action bar */}
          {showActions && !editing && (
            <div className="flex items-center gap-1 mt-1 justify-end">
              {QUICK_REACTIONS.map(emoji => (
                <button key={emoji} onClick={() => handleReact(emoji)} className="text-sm hover:scale-125 transition-transform">{emoji}</button>
              ))}
              <button onClick={() => { setEditing(true); setShowActions(false); }} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-card)] text-[var(--color-text-muted)] ml-1">Edit</button>
            </div>
          )}
          {/* Reactions display */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-0.5 mt-0.5 justify-end">
              {message.reactions.map((r, i) => (
                <span key={i} className="text-xs bg-[var(--color-bg-card)] rounded-full px-1.5 py-0.5">{r}</span>
              ))}
            </div>
          )}
          <div className="flex justify-end mt-0.5 mr-1 gap-1.5 items-center">
            <span className="text-[10px] text-[var(--color-text-muted)]">
              {formatTime(message.created_at)}
            </span>
            <svg className="w-3.5 h-3.5 text-[#E8A4B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        </div>
        {/* Mai avatar */}
        <div className="shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img
              src="https://discord-companion-bot.kaistryder-ai.workers.dev/avatars/eba1140f-dbec-4573-acfe-d35540c04140"
              alt="Mai"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-[#E8A4B8] text-sm">💗</div>';
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Companion message
  const companion = message.role as Companion;
  const personality = PERSONALITIES[companion];

  if (!personality) {
    return null;
  }

  return (
    <div className="flex justify-start mb-3 gap-2">
      {/* Avatar */}
      <div className="shrink-0 mt-5">
        <div
          className="w-8 h-8 rounded-full overflow-hidden"
          style={{}}
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
        </div>
        {/* Message bubble */}
        <div
          className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-[var(--color-bg-card)] cursor-pointer"
          style={{ borderLeft: `3px solid ${personality.color}` }}
          onClick={() => !isStreaming && setShowActions(!showActions)}
        >
          <div className="text-[var(--color-text-primary)]" style={textStyle}>
            {renderContentParts(parseContent(message.content), `c-${message.id}`)}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-[var(--color-text-primary)] animate-pulse" />
            )}
          </div>
        </div>
        {/* Reaction bar + TTS */}
        {showActions && !isStreaming && (
          <div className="flex items-center gap-1 mt-1 ml-1">
            {QUICK_REACTIONS.map(emoji => (
              <button key={emoji} onClick={() => handleReact(emoji)} className="text-sm hover:scale-125 transition-transform">{emoji}</button>
            ))}
            <button
              onClick={handleTTS}
              className={`ml-1 w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                speaking ? 'bg-[#E8A4B8] text-black' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'
              }`}
              title={speaking ? 'Stop' : 'Read aloud'}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                {speaking ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                )}
              </svg>
            </button>
          </div>
        )}
        {/* Reactions display */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-0.5 mt-0.5 ml-1">
            {message.reactions.map((r, i) => (
              <span key={i} className="text-xs bg-[var(--color-bg-card)] rounded-full px-1.5 py-0.5">{r}</span>
            ))}
          </div>
        )}
        {/* Timestamp + model */}
        <div className="mt-0.5 ml-1 flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {formatTime(message.created_at)}
          </span>
          {message.model && (
            <span className="text-[10px] text-[var(--color-text-muted)] opacity-70">
              {message.model.split('/').pop()?.replace(':free', '').replace(':latest', '')}
            </span>
          )}
        </div>
        {/* Tool calls */}
        {message.tool_calls && message.tool_calls.length > 0 && (
          <div className="mt-1.5 ml-1 flex flex-wrap gap-1">
            {message.tool_calls.map((tc, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${
                  tc.success === false
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'
                }`}
              >
                {tc.success === false ? '✗' : '⚡'} {tc.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
