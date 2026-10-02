import React from 'react';
import { Mic, MicOff, Trash2, Volume2, Loader2 } from 'lucide-react';
import { VoiceState } from '../types/myra';
import { audioService } from '../services/audioService';

interface TopNavigationProps {
  hasMessages: boolean;
  onClearChat?: () => void;
  voiceState?: VoiceState;
  onToggleVoice?: () => void;
  liveTranscript?: string;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  hasMessages,
  onClearChat,
  voiceState = 'idle',
  onToggleVoice,
  liveTranscript,
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
          <span className="text-[15px] font-medium text-slate-800 tracking-tight">
            Myra AI
          </span>
          {liveTranscript && (
            <span className="text-xs text-indigo-600 italic truncate max-w-xs sm:max-w-md hidden sm:inline ml-1">
              "{liveTranscript}"
            </span>
          )}
        </div>
      </div>

      {/* Primary Actions Zone */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Voice Trigger / Status Pill */}
        {onToggleVoice && (
          <button
            onClick={onToggleVoice}
            onTouchStart={() => audioService.unlockAudio()}
            title={voiceState !== 'idle' ? 'Stop voice conversation' : 'Start voice conversation'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all active:scale-95 cursor-pointer touch-manipulation ${
              voiceState === 'listening'
                ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm animate-pulse'
                : voiceState === 'speaking'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                : voiceState === 'processing'
                ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
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
            ) : voiceState === 'processing' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span>Thinking...</span>
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

