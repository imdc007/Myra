import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types/myra';
import { ChatMessageItem } from './ChatMessageItem';

interface ChatViewProps {
  messages: ChatMessage[];
  isThinking: boolean;
  onSelectSuggestion?: (query: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isThinking,
  onSelectSuggestion,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 flex flex-col space-y-6">
      {messages.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">
            Ask anything about Dushyant's work, engineering projects, or technical background.
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <ChatMessageItem
          key={msg.id}
          message={msg}
        />
      ))}

      {isThinking && (
        <div className="py-3 text-left">
          <div className="text-xs font-medium text-indigo-600 mb-1 flex items-center gap-1.5">
            <span>Myra</span>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-gray-50/90 border border-gray-200/60 rounded-2xl px-4 py-3 shadow-xs">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
          </div>
        </div>
      )}

      <div ref={bottomRef} className="h-4" />
    </div>
  );
};
