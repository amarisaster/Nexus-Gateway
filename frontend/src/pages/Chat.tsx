/**
 * Chat Page — Single conversation view (full screen, no bottom nav)
 */

import { useParams, useSearchParams } from 'react-router-dom';
import { ChatContainer } from '../components/chat';
import type { ChatMode } from '../lib/chat-types';

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') as ChatMode | null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ChatContainer
        conversationId={id}
        initialMode={mode || undefined}
      />
    </div>
  );
}
