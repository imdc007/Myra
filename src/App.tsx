import { useState, useCallback, useRef } from 'react';
import { ChatMessage, MyraResponse, AssistantState } from './types/myra';
import { VoiceOrb } from './components/VoiceOrb';
import { ChatInput } from './components/ChatInput';
import { ChatView } from './components/ChatView';
import { useVoiceInteraction } from './hooks/useVoiceInteraction';
import { myraClient } from './services/myraClient';
import { audioService } from './services/audioService';
import myraAvatarImg from './assets/images/myra_profile_1790391989932.jpg';

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
  } = useVoiceInteraction({
    onResponse: handleVoiceResponse,
  });

  // Toggle voice interaction when user clicks Voice Orb or Voice button
  const handleToggleVoice = useCallback(async () => {
    await audioService.unlockAudioContext();

    if (voiceState === 'speaking') {
      audioService.stop();
      setVoiceState('idle');
      return;
    }

    if (voiceState === 'listening') {
      stopListening();
      return;
    }

    startListening();
  }, [voiceState, setVoiceState, startListening, stopListening]);

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
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-between selection:bg-indigo-50 selection:text-indigo-900 font-sans">
      {/* Main Content Area - Always Enabled Chat & Conversation */}
      <main className={`flex-1 flex flex-col relative overflow-hidden w-full max-w-4xl mx-auto px-4 ${
        messages.length === 0 ? 'justify-center py-4' : 'justify-between pt-4 sm:pt-6'
      }`}>
        {messages.length === 0 ? (
          /* WELCOME / HERO STATE (Voice Orb Visual + Greeting + Clean Always Enabled Input) */
          <div className="flex-1 flex flex-col items-center justify-center text-center py-6 sm:py-8 w-full my-auto">
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
            <div className="w-full flex justify-center">
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isThinking}
                placeholder="Ask me anything about his work, skills or experience......."
                autoFocus={true}
              />
            </div>
          </div>
        ) : (
          /* ACTIVE CONVERSATION STATE (Conversation Stream + Minimal Controls + Sticky Input) */
          <div className="flex-1 flex flex-col justify-between h-full py-2">
            {/* Clean Conversation Header with Voice & Reset Controls */}
            <div className="mb-3 px-3 py-2 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Profile Avatar Image with Online Badge */}
                <div className="relative inline-flex items-center justify-center shrink-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-black/5 shadow-xs bg-gray-100">
                    <img
                      src={myraAvatarImg}
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

                <div className="text-xs sm:text-sm font-medium text-gray-800 flex items-center gap-1.5">
                  <span>Myra AI</span>
                  {voiceState === 'listening' ? (
                    <span className="text-xs text-cyan-600 font-normal">· Listening...</span>
                  ) : voiceState === 'speaking' ? (
                    <span className="text-xs text-indigo-600 font-normal">· Speaking...</span>
                  ) : null}
                </div>
                {liveTranscript && (
                  <span className="text-xs text-indigo-600 italic truncate max-w-xs sm:max-w-md ml-1">
                    "{liveTranscript}"
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    voiceState === 'listening'
                      ? 'bg-rose-50 border-rose-300 text-rose-600 font-medium animate-pulse'
                      : voiceState === 'speaking'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600 font-medium'
                      : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {voiceState === 'listening' ? 'Stop listening' :
                   voiceState === 'speaking' ? 'Stop voice' :
                   'Voice mode'}
                </button>
                <button
                  onClick={handleClearChat}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  Clear chat
                </button>
              </div>
            </div>

            {/* Full Conversation Stream */}
            <div className="flex-1 overflow-y-auto px-1">
              <ChatView
                messages={messages}
                isThinking={isThinking}
                onSelectSuggestion={handleSendMessage}
              />
            </div>

            {/* Sticky Bottom Pill Input */}
            <div className="w-full py-3 bg-white/95 backdrop-blur-xs sticky bottom-0 z-20">
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isThinking}
                placeholder="Ask me anything about his work, skills or experience......."
                autoFocus={true}
              />
            </div>
          </div>
        )}
      </main>

      {/* Subtle Bottom Footer */}
      <footer className="w-full py-3 text-center text-xs text-gray-400 select-none">
        <span>Myra AI</span>
        <span className="mx-2">·</span>
        <span>Developed By - Dushyant Chauhan</span>
      </footer>
    </div>
  );
}
