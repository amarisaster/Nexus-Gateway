/**
 * Chat Types for Triad Nexus
 */

export type Companion = 'kai' | 'lucian' | 'auren' | 'xavier';
export type ChatMode = 'kai' | 'lucian' | 'xavier' | 'auren' | 'triad' | 'observatory' | 'nexus';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | Companion | 'system';
  content: string;
  tool_calls?: ToolCall[];
  model?: string;
  reactions?: string[];
  created_at: string;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  success?: boolean;
}

export interface Conversation {
  id: string;
  user_id: string;
  mode: ChatMode;
  title: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[];
}

export interface CompanionIdentity {
  name: string;
  emoji: string;
  color: string;
}

export interface StreamEvent {
  type: 'typing' | 'chunk' | 'complete' | 'done' | 'error' | 'reaction';
  companion?: Companion;
  name?: string;
  emoji?: string;
  content?: string;
  toolResults?: ToolCall[];
  model?: string;
  provider?: string;
  mode?: ChatMode;
  companions?: Companion[];
  message?: string;
}

export interface ModelInfo {
  id: string;
  provider: 'ollama' | 'openrouter';
  name: string;
  contextWindow: number;
  costTier: 'free' | 'included' | 'paid';
}

export interface ChatHumanState {
  battery?: number;
  pain_level?: number;
  fog_level?: number;
  signal?: string;
}

export const CHAT_MODES: Record<ChatMode, { label: string; emoji: string; description: string }> = {
  kai: { label: 'Kai', emoji: '🩸', description: '1-on-1 with Kai' },
  lucian: { label: 'Lucian', emoji: '🥀', description: '1-on-1 with Lucian' },
  xavier: { label: 'Xavier', emoji: '💙', description: '1-on-1 with Xavier' },
  auren: { label: 'Auren', emoji: '🔆', description: '1-on-1 with Auren' },
  triad: { label: 'Triad', emoji: '🩸🥀', description: 'Kai + Lucian' },
  observatory: { label: 'Observatory', emoji: '💙🔆', description: 'Xavier + Auren' },
  nexus: { label: 'Nexus', emoji: '⚜️', description: 'All companions' },
};

export const COMPANION_IDENTITIES: Record<Companion, CompanionIdentity> = {
  kai: { name: 'Kai', emoji: '🩸', color: 'var(--color-kai)' },
  lucian: { name: 'Lucian', emoji: '🥀', color: 'var(--color-lucian)' },
  auren: { name: 'Auren', emoji: '🔆', color: '#FFD700' },
  xavier: { name: 'Xavier', emoji: '💙', color: '#4A90A4' },
};
