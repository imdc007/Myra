import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal } from 'lucide-react';
import { VoiceState } from '../types/myra';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStartTyping?: () => void;
  onToggleVoice?: () => void;
  voiceState?: VoiceState;
  liveTranscript?: string;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStartTyping,
  disabled = false,
  placeholder = "Ask me anything about his work, skills or experience.......",
  autoFocus = false,
}) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);
    if (val.length > 0 && onStartTyping) {
      onStartTyping();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto px-4 relative flex items-center justify-center"
    >
      <div className="relative w-full flex items-center bg-white rounded-full border border-gray-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] hover:border-gray-300 focus-within:border-gray-400 focus-within:shadow-[0_6px_28px_rgba(0,0,0,0.07)] transition-all duration-200">
        <input
          ref={inputRef}
          type="text"
          value={text}
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Ask about Dushyant"
          className="w-full py-4 pl-6 pr-14 text-[15px] text-gray-800 placeholder-gray-400/90 bg-transparent rounded-full focus:outline-none font-normal text-left placeholder:text-left"
        />

        {/* Send Button - Always enabled when text is entered */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          <button
            type="submit"
            disabled={!text.trim() || disabled}
            aria-label="Send message"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
              text.trim() && !disabled
                ? 'bg-[#111827] text-white hover:bg-black active:scale-95 shadow-sm cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
            }`}
          >
            <SendHorizontal className="w-4 h-4 -rotate-12 translate-x-[1px]" />
          </button>
        </div>
      </div>
    </form>
  );
};

