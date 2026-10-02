import React from 'react';
import { VoiceState } from '../types/myra';
import { audioService } from '../services/audioService';

interface VoiceOrbProps {
  voiceState: VoiceState;
  audioLevels: number[];
  onClick?: () => void;
  liveTranscript?: string;
  errorText?: string | null;
  isMicPermissionDenied?: boolean;
  onRetryMic?: () => void;
  onSimulateVoice?: (query: string) => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  voiceState,
  audioLevels,
  onClick,
  liveTranscript = '',
}) => {
  // Symmetrical flanking bar counts
  const leftBarHeights = [
    Math.max(12, (audioLevels[0] || 12) * 0.45),
    Math.max(18, (audioLevels[1] || 18) * 0.6),
    Math.max(26, (audioLevels[2] || 26) * 0.8),
    Math.max(38, (audioLevels[3] || 38) * 0.95),
    Math.max(50, (audioLevels[4] || 50) * 1.1),
    Math.max(62, (audioLevels[5] || 62) * 1.25),
  ];

  const rightBarHeights = [
    Math.max(62, (audioLevels[5] || 62) * 1.25),
    Math.max(50, (audioLevels[4] || 50) * 1.1),
    Math.max(38, (audioLevels[3] || 38) * 0.95),
    Math.max(26, (audioLevels[2] || 26) * 0.8),
    Math.max(18, (audioLevels[1] || 18) * 0.6),
    Math.max(12, (audioLevels[0] || 12) * 0.45),
  ];

  // Inner orb bars (5 bars)
  const innerBarHeights = [
    Math.max(22, (audioLevels[2] || 22) * 0.85),
    Math.max(36, (audioLevels[3] || 36) * 1.1),
    Math.max(48, (audioLevels[4] || 48) * 1.3),
    Math.max(36, (audioLevels[5] || 36) * 1.1),
    Math.max(22, (audioLevels[6] || 22) * 0.85),
  ];

  const isInteractive = Boolean(onClick) && voiceState !== 'processing';

  return (
    <div className="flex flex-col items-center justify-center select-none w-full max-w-xl mx-auto">
      {/* Outer Glow & Halo Container */}
      <div
        role="button"
        tabIndex={0}
        aria-label={
          voiceState === 'listening'
            ? 'Stop listening and process speech'
            : voiceState === 'speaking'
            ? 'Stop speaking'
            : 'Start voice conversation with Myra'
        }
        onClick={isInteractive ? onClick : undefined}
        onTouchStart={() => {
          if (isInteractive) {
            audioService.unlockAudio();
          }
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && isInteractive && onClick) {
            e.preventDefault();
            onClick();
          }
        }}
        className={`relative flex items-center justify-center p-6 sm:p-8 transition-transform duration-500 group outline-none touch-manipulation ${
          isInteractive ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : 'cursor-wait'
        }`}
      >
        {/* Soft Concentric Outer Halo Rings */}
        <div
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-1000 ease-out ${
            voiceState === 'listening'
              ? 'w-72 h-72 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20 scale-110 blur-xl'
              : voiceState === 'speaking'
              ? 'w-72 h-72 bg-gradient-to-r from-blue-400/20 via-violet-400/25 to-fuchsia-400/20 scale-105 blur-lg'
              : voiceState === 'processing'
              ? 'w-64 h-64 bg-violet-400/15 scale-100 blur-md animate-pulse'
              : 'w-64 h-64 bg-gradient-to-r from-blue-400/8 via-purple-400/10 to-pink-400/8 blur-xl'
          }`}
        />

        <div
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-200/30 pointer-events-none transition-all duration-700 ${
            voiceState === 'listening'
              ? 'w-60 h-60 scale-105 opacity-60 border-cyan-300/40'
              : voiceState === 'speaking'
              ? 'w-56 h-56 scale-100 opacity-50 border-purple-300/40'
              : 'w-52 h-52 scale-95 opacity-30'
          }`}
        />

        <div
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-100/40 pointer-events-none transition-all duration-500 ${
            voiceState === 'listening'
              ? 'w-44 h-44 scale-105 opacity-80'
              : voiceState === 'speaking'
              ? 'w-44 h-44 scale-100 opacity-60'
              : 'w-40 h-40 scale-95 opacity-40'
          }`}
        />

        {/* Flanking Waveform Bars - Left */}
        <div className="flex items-center gap-[6px] sm:gap-[8px] mr-3 sm:mr-5 z-10">
          {leftBarHeights.map((height, idx) => {
            const colorClasses = [
              'bg-gradient-to-t from-cyan-400 to-sky-400',
              'bg-gradient-to-t from-sky-400 to-blue-500',
              'bg-gradient-to-t from-blue-500 to-indigo-500',
              'bg-gradient-to-t from-indigo-500 to-violet-500',
              'bg-gradient-to-t from-violet-500 to-purple-500',
              'bg-gradient-to-t from-purple-500 to-fuchsia-500',
            ];
            return (
              <div
                key={`left-bar-${idx}`}
                style={{
                  height: `${Math.min(68, Math.max(8, height * 0.75))}px`,
                  transition:
                    voiceState === 'idle'
                      ? 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                      : 'height 0.08s ease-out',
                }}
                className={`w-[4.5px] sm:w-[6px] rounded-full shadow-[0_0_8px_rgba(56,189,248,0.3)] ${
                  colorClasses[idx % colorClasses.length]
                }`}
              />
            );
          })}
        </div>

        {/* Center Glossy Circular AI Orb */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full z-20 flex items-center justify-center shadow-[0_12px_36px_rgba(79,70,229,0.22),0_4px_16px_rgba(236,72,153,0.18)] transition-transform duration-500">
          {/* Orb Base Gradient Sphere */}
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-br from-[#00d2ff] via-[#7928ca] to-[#ff0080] p-[2px] transition-all duration-700 ${
              voiceState === 'speaking'
                ? 'animate-spin-slow'
                : voiceState === 'listening'
                ? 'scale-105 ring-4 ring-cyan-400/30'
                : ''
            }`}
          >
            {/* Inner Dark-Reflective Core */}
            <div className="w-full h-full rounded-full bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#2e1065] relative overflow-hidden flex items-center justify-center">
              {/* Radial Interior Lighting */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(56,189,248,0.7)_0%,rgba(147,51,234,0.5)_45%,rgba(15,23,42,0.9)_80%)]" />

              {/* Dynamic Interior Glow on Voice */}
              <div
                className={`absolute inset-0 transition-opacity duration-500 ${
                  voiceState === 'listening'
                    ? 'opacity-85 bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.65)_0%,transparent_70%)]'
                    : voiceState === 'speaking'
                    ? 'opacity-90 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.6)_0%,rgba(217,70,239,0.5)_60%,transparent_100%)]'
                    : 'opacity-40'
                }`}
              />

              {/* Inner Waveform Bars Visible through the Crystal Orb */}
              <div className="relative z-10 flex items-center gap-[4.5px] sm:gap-[5px]">
                {innerBarHeights.map((h, i) => (
                  <div
                    key={`inner-bar-${i}`}
                    style={{
                      height: `${Math.min(46, Math.max(10, h * 0.55))}px`,
                      transition:
                        voiceState === 'idle'
                          ? 'height 0.25s ease'
                          : 'height 0.08s ease-out',
                    }}
                    className={`w-[4px] sm:w-[5px] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.9)] ${
                      i === 2
                        ? 'bg-gradient-to-t from-white via-cyan-100 to-white'
                        : i % 2 === 0
                        ? 'bg-gradient-to-t from-cyan-300 via-white to-cyan-200'
                        : 'bg-gradient-to-t from-fuchsia-300 via-white to-pink-200'
                    }`}
                  />
                ))}
              </div>

              {/* Top Glass Reflection Crescent (Gloss Highlight) */}
              <div className="absolute -top-1 left-2 right-2 h-10 rounded-full bg-gradient-to-b from-white/60 via-white/20 to-transparent pointer-events-none transform -rotate-12 blur-[0.5px]" />

              {/* Secondary Lower Edge Ambient Rim Light */}
              <div className="absolute -bottom-2 left-4 right-4 h-6 rounded-full bg-gradient-to-t from-pink-400/40 via-purple-400/20 to-transparent pointer-events-none blur-[1px]" />
            </div>
          </div>
        </div>

        {/* Flanking Waveform Bars - Right */}
        <div className="flex items-center gap-[6px] sm:gap-[8px] ml-3 sm:ml-5 z-10">
          {rightBarHeights.map((height, idx) => {
            const colorClasses = [
              'bg-gradient-to-t from-fuchsia-500 to-purple-500',
              'bg-gradient-to-t from-pink-500 to-fuchsia-500',
              'bg-gradient-to-t from-rose-400 to-pink-500',
              'bg-gradient-to-t from-orange-400 to-rose-400',
              'bg-gradient-to-t from-amber-400 to-orange-400',
              'bg-gradient-to-t from-yellow-400 to-amber-400',
            ];
            return (
              <div
                key={`right-bar-${idx}`}
                style={{
                  height: `${Math.min(68, Math.max(8, height * 0.75))}px`,
                  transition:
                    voiceState === 'idle'
                      ? 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                      : 'height 0.08s ease-out',
                }}
                className={`w-[4.5px] sm:w-[6px] rounded-full shadow-[0_0_8px_rgba(244,63,94,0.3)] ${
                  colorClasses[idx % colorClasses.length]
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Visual Live Transcript and voice state status */}
      <div className="mt-4 min-h-[30px] flex items-center justify-center">
        {voiceState === 'listening' ? (
          <div className="px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-medium shadow-sm flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>{liveTranscript ? `“${liveTranscript}”` : 'Listening... Tap icon to finish'}</span>
          </div>
        ) : voiceState === 'speaking' ? (
          <div className="px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
            <span>Speaking... Tap icon to pause</span>
          </div>
        ) : voiceState === 'processing' ? (
          <div className="px-3.5 py-2 rounded-full bg-purple-50 border border-purple-200 text-purple-900 shadow-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" />
          </div>
        ) : (
          <div className="text-xs text-gray-400 group-hover:text-indigo-600 transition-colors">
            Tap the icon to speak with Myra.
          </div>
        )}
      </div>
    </div>
  );
};
