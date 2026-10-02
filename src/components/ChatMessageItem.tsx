import React, { useState, useEffect } from 'react';
import { ChatMessage } from '../types/myra';
import { Volume2, Square, Loader2 } from 'lucide-react';
import { audioService } from '../services/audioService';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
}) => {
  const isUser = message.sender === 'user';
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to stop events so if another message starts or stop is clicked, this resets
    const unsubscribe = audioService.onStop(() => {
      setIsPlaying(false);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSpeakAloud = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // CRITICAL FOR MOBILE & TABLET: Synchronous unlock during user tap event!
    audioService.unlockAudio();

    if (isPlaying || isLoading) {
      audioService.stop();
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    audioService.speak(
      message.text,
      () => {
        setIsLoading(false);
        setIsPlaying(true);
      },
      () => {
        setIsLoading(false);
        setIsPlaying(false);
      },
      (err) => {
        console.warn('Read aloud playback error:', err);
        setIsLoading(false);
        setIsPlaying(false);
      }
    );
  };

  const handleTouchStart = () => {
    // Pre-unlock audio context on mobile/tablet touchstart before click fires
    audioService.unlockAudio();
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
            type="button"
            onClick={handleSpeakAloud}
            onTouchStart={handleTouchStart}
            title={isPlaying ? 'Stop reading' : isLoading ? 'Loading voice...' : 'Read aloud'}
            aria-label={isPlaying ? 'Stop reading response' : 'Read response aloud'}
            className={`min-w-[36px] min-h-[36px] p-2 flex items-center justify-center rounded-full transition-all cursor-pointer touch-manipulation active:scale-90 ${
              isPlaying
                ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/90 shadow-2xs'
                : isLoading
                ? 'bg-indigo-50/60 text-indigo-600'
                : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100 active:bg-gray-200'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            ) : isPlaying ? (
              <Square className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      <div className="text-[15px] sm:text-base leading-relaxed text-gray-800 whitespace-pre-line font-normal">
        {message.text}
      </div>
    </div>
  );
};
