import React from 'react';
import { Mic, MicOff, Trash2, Volume2, Sparkles } from 'lucide-react';
import { VoiceState } from '../types/myra';

interface TopNavigationProps {
  hasMessages: boolean;
  onClearChat?: () => void;
  voiceState?: VoiceState;
  onToggleVoice?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  hasMessages,
  onClearChat,
  voiceState = 'idle',
  onToggleVoice,
}) => {
  return (
    <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between z-30 select-none">
      {/* Brand Zone */}
      <div className="flex items-center gap-3">
        {/* Profile Avatar Image with Online Badge */}
        <div className="relative inline-flex items-center justify-center shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-black/5 shadow-xs bg-gray-100">
            <img
              src="/myra_avatar.jpg"
              alt="Myra AI Profile"
              className="w-full h-full object-cover object-center -scale-x-100"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Online Badge */}
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#22c55e] rounded-full ring-2 ring-white"
            title="Online"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-slate-900 tracking-tight">
            Myra
          </span>
          <span className="text-gray-300 font-light">·</span>
          <span className="text-xs text-gray-500 font-medium">
            Dushyant's AI Assistant
          </span>
        </div>
      </div>

      {/* Primary Actions Zone */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Voice Trigger / Status Pill */}
        {onToggleVoice && (
          <button
            onClick={onToggleVoice}
            title={voiceState === 'listening' ? 'Stop listening' : 'Start voice conversation'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all active:scale-95 ${
              voiceState === 'listening'
                ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm animate-pulse'
                : voiceState === 'speaking'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
            }`}
          >
            {voiceState === 'listening' ? (
              <>
                <MicOff className="w-3.5 h-3.5 text-rose-500" />
                <span>Listening...</span>
              </>
            ) : voiceState === 'speaking' ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-indigo-500 animate-bounce" />
                <span>Speaking...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-gray-500" />
                <span>Voice Enabled</span>
              </>
            )}
          </button>
        )}

        {/* Clear Conversation */}
        {hasMessages && onClearChat && (
          <button
            onClick={onClearChat}
            title="Clear conversation"
            aria-label="Clear chat conversation"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-normal text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-400" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </div>
    </header>
  );
};

