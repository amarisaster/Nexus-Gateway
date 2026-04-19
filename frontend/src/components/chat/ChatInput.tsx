/**
 * ChatInput - Message input with GIF picker, file upload, STT, call, and send
 */

import { useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import GifPicker from './GifPicker';

interface ChatInputProps {
  onSend: (message: string) => void;
  onSendGif?: (gifUrl: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  onSendGif,
  disabled = false,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
    }
  };

  const handleGifSelect = (gifUrl: string) => {
    // Combine any typed text with the GIF URL into a single message. Nexus's
    // MessageBubble.parseContent already splits "text\nhttps://gif" into a
    // text part + an inline GIF part within the same bubble, so the companion
    // sees one message with both and the user doesn't lose their caption to
    // the waiting-for-reply lockout.
    const trimmed = message.trim();
    const payload = trimmed ? `${trimmed}\n${gifUrl}` : gifUrl;
    if (onSendGif) {
      onSendGif(payload);
    } else {
      onSend(payload);
    }
    setMessage('');
    setShowGif(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from('chat-attachments')
        .upload(path, file, { contentType: file.type });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(path);

      onSend(publicUrl);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const recognitionRef = useRef<any>(null);

  const handleSTT = useCallback(() => {
    if (isRecording) {
      // Stop recording
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = message; // Append to existing text

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + transcript;
        } else {
          interim = transcript;
        }
      }
      setMessage(finalTranscript + (interim ? ' ' + interim : ''));
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording, message]);

  return (
    <div className="relative flex-shrink-0">
      {/* GIF Picker */}
      {showGif && <GifPicker onSelect={handleGifSelect} onClose={() => setShowGif(false)} />}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf,text/plain,audio/*,video/mp4"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)]">
        {/* Attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-colors shrink-0 ${
            uploading
              ? 'text-[#E8A4B8] animate-pulse'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]'
          }`}
          title={uploading ? 'Uploading...' : 'Attach file'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
          </svg>
        </button>

        {/* GIF button */}
        <button
          onClick={() => setShowGif(!showGif)}
          className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-colors shrink-0 ${
            showGif
              ? 'bg-[#E8A4B8] text-black'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]'
          }`}
          title="Send GIF"
        >
          <span className="text-xs font-bold">GIF</span>
        </button>

        {/* Input with inline send */}
        <div className="flex-1 min-w-0 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }}
            disabled={disabled || uploading}
            placeholder={uploading ? 'Uploading...' : placeholder}
            className="w-full h-9 pl-3 pr-9 text-sm bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-full border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text-muted)] transition-colors disabled:opacity-50"
          />
          {/* Send — inside input, appears when typing */}
          {message.trim() && (
            <button
              onClick={handleSubmit}
              disabled={disabled || uploading}
              className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-[#E8A4B8] text-black disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          )}
        </div>

        {/* STT */}
        <button
          onClick={handleSTT}
          className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-colors shrink-0 ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]'
          }`}
          title={isRecording ? 'Stop recording' : 'Voice message'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </button>

        {/* Call */}
        <button
          className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-[var(--color-text-muted)] hover:text-green-400 hover:bg-green-400/10 transition-colors shrink-0"
          title="Voice call"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
