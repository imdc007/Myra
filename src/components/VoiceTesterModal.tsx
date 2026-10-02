import React, { useState, useEffect } from 'react';
import { Volume2, Play, Square, Check, X, Sparkles, AudioLines, Info, Mic } from 'lucide-react';
import { audioService, HindiVoiceOption } from '../services/audioService';

interface VoiceTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceChanged?: (voiceName: string) => void;
}

export const VoiceTesterModal: React.FC<VoiceTesterModalProps> = ({
  isOpen,
  onClose,
  onVoiceChanged,
}) => {
  const [voices, setVoices] = useState<HindiVoiceOption[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('neerja-expressive');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [customText, setCustomText] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const list = audioService.getAvailableHindiFemaleVoices();
    setVoices(list);
    setSelectedVoiceId(audioService.getSelectedVoice());
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePlayVoice = (voice: HindiVoiceOption, textToUse?: string) => {
    if (playingVoiceId === voice.id) {
      audioService.stop();
      setPlayingVoiceId(null);
      return;
    }

    setPlayingVoiceId(voice.id);
    const sample = textToUse?.trim() || customText.trim() || voice.previewPrompt;

    audioService.playSampleVoice(
      voice.id,
      sample,
      () => setPlayingVoiceId(voice.id),
      () => setPlayingVoiceId(null),
      () => setPlayingVoiceId(null)
    );
  };

  const handleSelectVoice = (voice: HindiVoiceOption) => {
    audioService.setSelectedVoice(voice.id);
    setSelectedVoiceId(voice.id);
    if (onVoiceChanged) {
      onVoiceChanged(voice.displayName);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-tester-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <AudioLines className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 id="voice-tester-title" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                Hindi-Origin Female Voice Studio
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Real Neural Audio
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                These are genuine, studio-grade neural voices with distinct Indian and Hindi vocal characteristics.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              audioService.stop();
              setPlayingVoiceId(null);
              onClose();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close voice options"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-5 py-2.5 bg-indigo-50/50 border-b border-indigo-100/70 flex items-start gap-2.5 text-xs text-indigo-900">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <span>
            <strong>Bilingual Neural Audio Enabled:</strong> Microsoft Neerja is trained on Indian English. To ensure Hindi is always spoken naturally, our speech server automatically pairs Neerja with Microsoft's native Hindi neural engine (Swara) whenever Hindi or Devanagari script is spoken. Try typing or clicking a Hindi sample below to test it!
          </span>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Quick Custom Test Box */}
          <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-200/80 space-y-2">
            <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Test with your own custom sentence (optional):
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Leave blank to use voice sample prompt, or type any phrase..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setCustomText(
                      "Hello! I am Myra, Dushyant's dedicated AI assistant. Ask me anything about his projects."
                    )
                  }
                  className="px-2 py-1 text-[11px] bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  English Sample
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCustomText(
                      'नमस्ते! मैं मायरा हूँ, दुष्यंत की एआई असिस्टेंट। मैं आपकी किस प्रकार सहायता कर सकती हूँ?'
                    )
                  }
                  className="px-2 py-1 text-[11px] bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  Hindi Sample
                </button>
                {customText && (
                  <button
                    type="button"
                    onClick={() => setCustomText('')}
                    className="px-2 py-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Voice Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                5 Distinct Neural Voices
              </span>
              <span className="text-[11px] text-gray-500">
                Active: <strong className="text-indigo-600 font-medium">{voices.find(v => v.id === selectedVoiceId)?.name || 'Neerja'}</strong>
              </span>
            </div>

            {voices.map((voice) => {
              const isSelected = selectedVoiceId === voice.id;
              const isPlaying = playingVoiceId === voice.id;

              return (
                <div
                  key={voice.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-50/40 ring-1 ring-indigo-300 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Name & Badges */}
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {voice.displayName}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            voice.category.includes('Native Hindi')
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {voice.category}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {voice.engine}
                        </span>
                      </div>

                      {/* Tone Description */}
                      <p className="text-xs text-gray-600">
                        {voice.toneDescription}
                      </p>

                      {/* Sample preview text */}
                      <div className="text-[11px] text-gray-500 italic bg-gray-50/70 p-2 rounded-lg border border-gray-100">
                        "{voice.previewPrompt}"
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0 pt-1">
                      {/* Play Button */}
                      <button
                        type="button"
                        onClick={() => handlePlayVoice(voice)}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer min-w-[95px] ${
                          isPlaying
                            ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs animate-pulse ring-1 ring-rose-300'
                            : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200 shadow-xs'
                        }`}
                        title={isPlaying ? 'Stop playback' : 'Play live neural sample'}
                      >
                        {isPlaying ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-gray-800 text-gray-800" />
                            <span>Play Test</span>
                          </>
                        )}
                      </button>

                      {/* Select Button */}
                      <button
                        type="button"
                        onClick={() => handleSelectVoice(voice)}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer min-w-[95px] ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <span>Select Voice</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Active Voice:{' '}
            <strong className="text-indigo-600 font-semibold">
              {voices.find(v => v.id === selectedVoiceId)?.displayName || 'Neerja (Expressive)'}
            </strong>
          </span>
          <button
            type="button"
            onClick={() => {
              audioService.stop();
              setPlayingVoiceId(null);
              onClose();
            }}
            className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
