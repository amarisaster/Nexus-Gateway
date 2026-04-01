/**
 * Chat API - Handles communication with chat service and Supabase
 */

import { supabase } from './supabase';
import type {
  ChatMessage,
  ChatMode,
  Conversation,
  ConversationWithMessages,
  StreamEvent,
  ChatHumanState,
} from './chat-types';

const CHAT_SERVICE_URL = import.meta.env.VITE_CHAT_SERVICE_URL || 'https://chat-bridge.kaistryder-ai.workers.dev';

// ============================================================================
// Supabase Operations - Conversations
// ============================================================================

/**
 * Get all conversations for the current user
 */
export async function getConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch conversations:', error);
    return [];
  }

  return data || [];
}

/**
 * Get conversations by mode
 */
export async function getConversationsByMode(mode: ChatMode): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('mode', mode)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch conversations:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single conversation with its messages
 */
export async function getConversationWithMessages(
  conversationId: string
): Promise<ConversationWithMessages | null> {
  const [conversationResult, messagesResult] = await Promise.all([
    supabase.from('chat_conversations').select('*').eq('id', conversationId).single(),
    supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }),
  ]);

  if (conversationResult.error || !conversationResult.data) {
    console.error('Failed to fetch conversation:', conversationResult.error);
    return null;
  }

  return {
    ...conversationResult.data,
    messages: messagesResult.data || [],
  };
}

/**
 * Create a new conversation
 */
export async function createConversation(mode: ChatMode): Promise<Conversation | null> {
  let userId = '40df21dd-4d75-48b1-afc3-0438daf051eb'; // Mai's default user ID
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {}

  const { data, error } = await supabase
    .from('chat_conversations')
    .insert({ user_id: userId, mode })
    .select()
    .single();

  if (error) {
    console.error('Failed to create conversation:', error);
    return null;
  }

  return data;
}

/**
 * Get or create today's conversation for a mode
 */
export async function getOrCreateTodayConversation(mode: ChatMode): Promise<Conversation | null> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Check for existing conversation today in this mode
  const conversations = await getConversationsByMode(mode);
  const todayConv = conversations.find(c => c.created_at?.startsWith(today));
  if (todayConv) return todayConv;

  // Create new one
  return createConversation(mode);
}

/**
 * Get all conversations with their last message preview
 */
export async function getConversationsWithPreview(): Promise<Array<Conversation & { lastMessage?: string; lastMessageAt?: string }>> {
  const conversations = await getConversations();
  const withPreviews = await Promise.all(
    conversations.map(async (conv) => {
      const { data } = await supabase
        .from('chat_messages')
        .select('content, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);
      const last = data?.[0];
      return {
        ...conv,
        lastMessage: last?.content?.substring(0, 80) || undefined,
        lastMessageAt: last?.created_at || conv.last_message_at,
      };
    })
  );
  // Sort by most recent message
  return withPreviews.sort((a, b) =>
    new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
  );
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('chat_conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    console.error('Failed to delete conversation:', error);
    return false;
  }

  return true;
}

// ============================================================================
// Supabase Operations - Messages
// ============================================================================

/**
 * Save a message to the database
 */
export async function saveMessage(
  conversationId: string,
  role: ChatMessage['role'],
  content: string,
  toolCalls?: ChatMessage['tool_calls'],
  model?: string,
): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      tool_calls: toolCalls,
      ...(model && { model }),
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save message:', error);
    return null;
  }

  return data;
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch messages:', error);
    return [];
  }

  return data || [];
}

// ============================================================================
// Chat Service Operations - Models & Streaming
// ============================================================================

/**
 * Fetch available models from the chat bridge
 */
export async function fetchModels(): Promise<import('./chat-types').ModelInfo[]> {
  try {
    const response = await fetch(`${CHAT_SERVICE_URL}/models`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

/**
 * Send a message to the chat service and stream the response
 * Returns an async generator of stream events
 */
export async function* sendMessageStream(
  message: string,
  mode: ChatMode,
  conversationHistory: Array<{ role: string; content: string }>,
  humanState?: ChatHumanState,
  provider?: string,
  model?: string,
): AsyncGenerator<StreamEvent, void, unknown> {
  const response = await fetch(`${CHAT_SERVICE_URL}/api/chat/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      mode,
      conversationHistory,
      humanState,
      ...(provider && { provider }),
      ...(model && { model }),
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat service error: ${response.status}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    let currentEvent = '';
    let currentData = '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7);
      } else if (line.startsWith('data: ')) {
        currentData = line.slice(6);
        if (currentEvent && currentData) {
          try {
            const data = JSON.parse(currentData);
            yield { type: currentEvent as StreamEvent['type'], ...data };
          } catch {
            // Skip malformed JSON
          }
          currentEvent = '';
          currentData = '';
        }
      }
    }
  }
}

/**
 * Send a message and get a non-streaming response
 */
export async function sendMessageSync(
  message: string,
  mode: ChatMode,
  conversationHistory: Array<{ role: string; content: string }>,
  humanState?: ChatHumanState
): Promise<Array<{
  companion: string;
  name: string;
  emoji: string;
  content: string;
  toolResults?: unknown[];
}>> {
  const response = await fetch(`${CHAT_SERVICE_URL}/api/chat/send-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      mode,
      conversationHistory,
      humanState,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat service error: ${response.status}`);
  }

  const data = await response.json();
  return data.responses;
}

/**
 * Check if the chat service is available
 */
export async function checkChatServiceHealth(): Promise<{
  status: string;
  ollama: boolean;
}> {
  try {
    const response = await fetch(`${CHAT_SERVICE_URL}/health`);
    if (!response.ok) {
      return { status: 'error', ollama: false };
    }
    return await response.json();
  } catch {
    return { status: 'offline', ollama: false };
  }
}
