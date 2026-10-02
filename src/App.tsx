import { useState, useCallback, useRef } from 'react';
import { ChatMessage, MyraResponse, AssistantState } from './types/myra';
import { VoiceOrb } from './components/VoiceOrb';
import { ChatInput } from './components/ChatInput';
import { ChatView } from './components/ChatView';
import { TopNavigation } from './components/TopNavigation';
import { useVoiceInteraction } from './hooks/useVoiceInteraction';
import { myraClient } from './services/myraClient';
import { audioService } from './services/audioService';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  // Store assistant_state for visual and body-language behavior
  const [_assistantState, setAssistantState] = useState<AssistantState | null>(null);
  const isSendingRef = useRef(false);

  // Handle incoming voice response if voice interaction is triggered
  const handleVoiceResponse = useCallback(
    (response: MyraResponse, userSpeech: string) => {
      const userMsg: ChatMessage = {
        id: 'msg-u-' + Date.now(),
        sender: 'user',
        text: userSpeech,
        timestamp: new Date(),
        mode: 'voice',
      };

      const myraMsg: ChatMessage = {
        id: 'msg-m-' + (Date.now() + 1),
        sender: 'myra',
        text: response.response_text,
        timestamp: new Date(),
        mode: 'voice',
        sources: response.sources,
      };

      setMessages((prev) => [...prev, userMsg, myraMsg]);
    },
    []
  );

  const {
    voiceState,
    setVoiceState,
    audioLevels,
    liveTranscript,
    startListening,
    stopListening,
    toggleVoiceInteraction,
  } = useVoiceInteraction({
    onResponse: handleVoiceResponse,
  });

  // Toggle voice interaction when user clicks Voice Orb or Voice button
  const handleToggleVoice = useCallback(() => {
    audioService.unlockAudio();
    toggleVoiceInteraction();
  }, [toggleVoiceInteraction]);

  // Handle submitting a chat message
  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isThinking || isSendingRef.current) {
      return;
    }

    isSendingRef.current = true;
    setIsThinking(true);
    audioService.stop();

    const userMsg: ChatMessage = {
      id: 'msg-u-' + Date.now(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date(),
      mode: 'chat',
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await myraClient.sendChatMessage(trimmed);

      const responseText = response?.response_text?.trim();
      if (!responseText) {
        throw new Error('Backend completed the request but did not return valid response text.');
      }

      if (response.assistant_state) {
        setAssistantState(response.assistant_state);
      }

      const myraMsg: ChatMessage = {
        id: 'msg-m-' + (Date.now() + 1),
        sender: 'myra',
        text: responseText,
        timestamp: new Date(),
        mode: 'chat',
        sources: response.source ? [response.source] : undefined,
      };

      setMessages((prev) => [...prev, myraMsg]);
    } catch (err: any) {
      console.warn('Chat submission error:', err);
      const errorMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        sender: 'myra',
        text: 'Can you please share your query again?',
        timestamp: new Date(),
        mode: 'chat',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
      isSendingRef.current = false;
    }
  };

  // Clear current conversation
  const handleClearChat = () => {
    audioService.stop();
    setMessages([]);
  };

  return (
    <div className="h-screen h-[100dvh] max-h-screen overflow-hidden bg-white text-gray-900 flex flex-col selection:bg-indigo-50 selection:text-indigo-900 font-sans">
      {/* Sticky Top Header Navigation */}
      <div className="shrink-0 w-full z-30 bg-white/90 backdrop-blur-md border-b border-gray-100/80">
        <TopNavigation
          hasMessages={messages.length > 0}
          onClearChat={handleClearChat}
          voiceState={voiceState}
          onToggleVoice={handleToggleVoice}
          liveTranscript={liveTranscript}
        />
      </div>

      {/* Middle Main Content Area - Only Chat Scrollable */}
      <main className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
        {messages.length === 0 ? (
          /* WELCOME / HERO STATE (Voice Orb Visual + Greeting + Clean Always Enabled Input) */
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center text-center px-4 py-6 sm:py-8 w-full max-w-4xl mx-auto my-auto">
            {/* Visual Orb */}
            <div className="mb-6 w-full flex justify-center">
              <VoiceOrb
                voiceState={voiceState}
                audioLevels={audioLevels}
                liveTranscript={liveTranscript}
                onClick={handleToggleVoice}
              />
            </div>

            {/* Headline */}
            <h1 className="text-xl min-[400px]:text-2xl sm:text-4xl md:text-5xl font-extralight tracking-tight text-[#111827] mb-8 whitespace-nowrap text-center max-w-full">
              Hello, I'm Dushyant's AI assistant.
            </h1>

            {/* Chat Input */}
            <div className="w-full max-w-2xl flex justify-center">
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isThinking}
                placeholder="Ask me anything about his work, skills or experience......."
                autoFocus={true}
              />
            </div>
          </div>
        ) : (
          /* ACTIVE CONVERSATION STATE: ONLY CHAT SCROLLABLE */
          <div className="flex-1 min-h-0 overflow-y-auto w-full">
            <ChatView
              messages={messages}
              isThinking={isThinking}
              onSelectSuggestion={handleSendMessage}
            />
          </div>
        )}
      </main>

      {/* Sticky Bottom Area: Input (when active) + Footer */}
      <div className="shrink-0 w-full z-20 bg-white/95 backdrop-blur-md border-t border-gray-100">
        {messages.length > 0 && (
          <div className="w-full max-w-3xl mx-auto px-4 pt-3 pb-1 flex justify-center">
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={isThinking}
              placeholder="Ask me anything about his work, skills or experience......."
              autoFocus={true}
            />
          </div>
        )}
        <footer className="w-full py-2.5 text-center text-xs text-gray-400 select-none">
          <span>Myra AI</span>
          <span className="mx-2">·</span>
          <span>Developed By - Dushyant Chauhan</span>
        </footer>
      </div>
    </div>
  );
}
