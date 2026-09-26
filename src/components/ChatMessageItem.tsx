import React from 'react';
import { ChatMessage } from '../types/myra';
import { Volume2 } from 'lucide-react';
import { audioService } from '../services/audioService';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
}) => {
  const isUser = message.sender === 'user';

  const handleSpeakAloud = () => {
    if (audioService.getIsSpeaking()) {
      audioService.stop();
    } else {
      audioService.speak(message.text);
    }
  };

  return (
    <div className={`w-full py-4 text-left transition-opacity duration-300 ${isUser ? 'pl-0' : 'pl-0'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={`text-xs font-medium tracking-wide ${
            isUser ? 'text-gray-500' : 'text-indigo-600'
          }`}
        >
          {isUser ? 'You' : 'Myra'}
        </span>

        {!isUser && (
          <button
            onClick={handleSpeakAloud}
            title="Read aloud"
            aria-label="Read response aloud"
            className="p-1 text-gray-400 hover:text-indigo-600 rounded-md transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="text-[15px] sm:text-base leading-relaxed text-gray-800 whitespace-pre-line font-normal">
        {message.text}
      </div>
    </div>
  );
};
