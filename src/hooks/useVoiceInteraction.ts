import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceState, MyraRequest, MyraResponse } from '../types/myra';
import { audioService } from '../services/audioService';
import { myraClient } from '../services/myraClient';

interface UseVoiceInteractionProps {
  onResponse: (response: MyraResponse, userSpeech: string) => void;
}

export function useVoiceInteraction({
  onResponse,
}: UseVoiceInteractionProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isMicPermissionDenied, setIsMicPermissionDenied] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [audioLevels, setAudioLevels] = useState<number[]>([12, 18, 30, 48, 65, 48, 30, 18, 12]);

  const recognitionRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isListeningRef = useRef(false);
  const isVoiceModeActiveRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTranscriptRef = useRef<string>('');
  const hasAudibleSpeechRef = useRef<boolean>(false);

  const cleanupTimers = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const cleanupMic = useCallback(() => {
    cleanupTimers();
    audioService.stopMicrophoneStream();
    analyserRef.current = null;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  // Animate audio waveform bars dynamically using live microphone analyser or synthetic presets
  useEffect(() => {
    let phase = 0;

    const tick = () => {
      phase += 0.08;

      if (analyserRef.current && voiceState === 'listening') {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Average raw microphone volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;

        // Dynamic Voice Activity Detection (VAD) for mobile & tablet
        if (avg > 12) {
          hasAudibleSpeechRef.current = true;
          // Clear any pending silence timer while user is actively talking
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else if (hasAudibleSpeechRef.current && !silenceTimerRef.current) {
          // User paused speaking: finalize recording after 1.4s of silence
          silenceTimerRef.current = setTimeout(() => {
            if (isListeningRef.current) {
              finishListeningSession();
            }
          }, 1400);
        }

        // Dynamic symmetrical audio bars mapped from real frequencies
        const b0 = Math.max(12, Math.min(85, (dataArray[1] || 0) * 0.7 + avg * 0.4));
        const b1 = Math.max(16, Math.min(90, (dataArray[2] || 0) * 0.8 + avg * 0.5));
        const b2 = Math.max(22, Math.min(95, (dataArray[4] || 0) * 0.9 + avg * 0.6));
        const b3 = Math.max(30, Math.min(98, (dataArray[6] || 0) * 1.0 + avg * 0.7));
        const b4 = Math.max(40, Math.min(100, (dataArray[8] || 0) * 1.1 + avg * 0.8));

        setAudioLevels([b0, b1, b2, b3, b4, b3, b2, b1, b0]);
      } else if (voiceState === 'listening') {
        // Active synthetic listening waveform if hardware mic analyser is constrained
        const l1 = 20 + Math.sin(phase * 2.8) * 14;
        const l2 = 32 + Math.sin(phase * 3.2 + 0.4) * 20;
        const l3 = 50 + Math.sin(phase * 2.5 + 0.9) * 26;
        const l4 = 70 + Math.sin(phase * 3.5 + 1.3) * 22;
        const l5 = 85 + Math.sin(phase * 3.0 + 1.8) * 15;
        setAudioLevels([l1, l2, l3, l4, l5, l4, l3, l2, l1]);
      } else if (voiceState === 'speaking') {
        // Vocal cadence waveform while Myra speaks
        const s1 = 18 + Math.sin(phase * 2.2) * 14;
        const s2 = 32 + Math.sin(phase * 1.8 + 0.5) * 24;
        const s3 = 54 + Math.sin(phase * 2.5 + 1.2) * 34;
        const s4 = 72 + Math.sin(phase * 3.1 + 0.8) * 22;
        const s5 = 88 + Math.sin(phase * 2.8 + 2.0) * 12;
        setAudioLevels([s1, s2, s3, s4, s5, s4, s3, s2, s1]);
      } else if (voiceState === 'processing') {
        // Subtle rhythm for thinking
        const p1 = 18 + Math.sin(phase * 1.2) * 8;
        const p2 = 28 + Math.sin(phase * 1.2 + 0.4) * 12;
        const p3 = 42 + Math.sin(phase * 1.2 + 0.8) * 15;
        const p4 = 58 + Math.sin(phase * 1.2 + 1.2) * 18;
        const p5 = 68 + Math.sin(phase * 1.2 + 1.6) * 14;
        setAudioLevels([p1, p2, p3, p4, p5, p4, p3, p2, p1]);
      } else {
        // Gentle ambient breathing
        const b1 = 12 + Math.sin(phase * 0.8) * 4;
        const b2 = 18 + Math.sin(phase * 0.8 + 0.3) * 6;
        const b3 = 30 + Math.sin(phase * 0.8 + 0.6) * 8;
        const b4 = 48 + Math.sin(phase * 0.8 + 0.9) * 10;
        const b5 = 62 + Math.sin(phase * 0.8 + 1.2) * 10;
        setAudioLevels([b1, b2, b3, b4, b5, b4, b3, b2, b1]);
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [voiceState]);

  const handleSpeechComplete = async (transcript: string) => {
    const cleanText = transcript.trim();
    if (!cleanText) {
      if (isVoiceModeActiveRef.current) {
        startListening();
      } else {
        setVoiceState('idle');
      }
      return;
    }

    setVoiceState('processing');
    setErrorText(null);
    setLiveTranscript('');

    try {
      const request: MyraRequest = {
        session_id: myraClient.getSession(),
        input_mode: 'voice',
        input: cleanText,
        conversation_context: 'voice_session',
        personalization: myraClient.getPersonalization(),
      };

      const response = await myraClient.sendVoiceMessage(request);

      const responseText = response?.response_text?.trim();
      if (!responseText) {
        throw new Error('Backend completed the request without returning valid response text.');
      }

      onResponse(response, cleanText);
      setVoiceState('speaking');

      // Speak text aloud only after receiving the verified result from backend
      audioService.speak(
        responseText,
        () => {
          setVoiceState('speaking');
        },
        () => {
          // CONTINUOUS CONVERSATION LOOP:
          // If Voice Mode is active, pause 350ms to allow audio hardware transition, then start listening again!
          if (isVoiceModeActiveRef.current) {
            setTimeout(() => {
              if (isVoiceModeActiveRef.current) {
                startListening();
              }
            }, 350);
          } else {
            setVoiceState('idle');
          }
        },
        (err) => {
          console.warn('Audio speech error:', err);
          if (isVoiceModeActiveRef.current) {
            setTimeout(() => {
              if (isVoiceModeActiveRef.current) {
                startListening();
              }
            }, 350);
          } else {
            setVoiceState('idle');
          }
        }
      );
    } catch (err) {
      console.warn('Voice request issue:', err);
      setErrorText('Can you please share your query again?');
      if (isVoiceModeActiveRef.current) {
        audioService.speak(
          'Can you please share your query again?',
          () => setVoiceState('speaking'),
          () => {
            if (isVoiceModeActiveRef.current) {
              setTimeout(() => {
                if (isVoiceModeActiveRef.current) {
                  startListening();
                }
              }, 350);
            } else {
              setVoiceState('idle');
            }
          },
          () => {
            if (isVoiceModeActiveRef.current) {
              setTimeout(() => {
                if (isVoiceModeActiveRef.current) {
                  startListening();
                }
              }, 350);
            } else {
              setVoiceState('idle');
            }
          }
        );
      } else {
        setVoiceState('error');
      }
    }
  };

  const finishListeningSession = async () => {
    if (!isListeningRef.current) return;
    cleanupTimers();

    const recognizedText = latestTranscriptRef.current.trim();

    // Check if we already have speech from Web Speech API
    if (recognizedText) {
      isListeningRef.current = false;
      latestTranscriptRef.current = '';
      hasAudibleSpeechRef.current = false;
      setLiveTranscript('');
      cleanupMic();
      await handleSpeechComplete(recognizedText);
      return;
    }

    // Only attempt server audio transcription if audible speech was actually detected
    if (hasAudibleSpeechRef.current) {
      isListeningRef.current = false;
      latestTranscriptRef.current = '';
      hasAudibleSpeechRef.current = false;
      setLiveTranscript('');
      setVoiceState('processing');
      try {
        const recorded = await audioService.stopAndGetRecording();
        cleanupMic();

        if (recorded && recorded.base64) {
          // Transcribe audio recorded from the microphone
          const transcribedText = await audioService.transcribeAudio(recorded.base64, recorded.mimeType);
          if (transcribedText) {
            await handleSpeechComplete(transcribedText);
            return;
          }
        }
      } catch {
        // Fallback silently without throwing unhandled exceptions
      }
    }

    // If no words were detected:
    // If Voice Mode is selected, DO NOT switch it off automatically. Keep listening!
    if (isVoiceModeActiveRef.current) {
      latestTranscriptRef.current = '';
      setLiveTranscript('');
      hasAudibleSpeechRef.current = false;
      if (analyserRef.current) {
        audioService.initMicrophoneStream().catch(() => {});
      } else {
        createAndStartRecognition();
      }
      return;
    }

    isListeningRef.current = false;
    cleanupMic();
    setErrorText("I didn't hear anything. Tap the mic and speak clearly.");
    setVoiceState('idle');
  };

  const createAndStartRecognition = useCallback(() => {
    if (!isVoiceModeActiveRef.current) return;

    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) return;

    // Clean up any stale or terminated instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }

    const isMobileOrTablet =
      typeof navigator !== 'undefined' &&
      (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 1));

    try {
      const recognition = new SpeechRecognition();
      // On mobile / tablet, continuous MUST be false to prevent WebKit speech bugs and freezes
      recognition.continuous = !isMobileOrTablet;
      recognition.interimResults = true;

      const devLang =
        typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';
      recognition.lang = devLang.startsWith('hi')
        ? 'hi-IN'
        : devLang.includes('IN')
        ? 'en-IN'
        : 'en-US';

      recognition.onstart = () => {
        if (isListeningRef.current) {
          setVoiceState('listening');
          setErrorText(null);
        }
      };

      recognition.onresult = (event: any) => {
        if (!isListeningRef.current) return;

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        const currentText = (final || interim || '').trim();
        if (currentText) {
          latestTranscriptRef.current = currentText;
          hasAudibleSpeechRef.current = true;
          setLiveTranscript(currentText);

          // Automatically finalize 1.6s after user stops speaking
          cleanupTimers();
          silenceTimerRef.current = setTimeout(() => {
            finishListeningSession();
          }, 1600);
        }
      };

      recognition.onerror = (event: any) => {
        console.info('Speech recognition error event:', event.error);
        if (event.error === 'no-speech') {
          // Ambient silence - recognition will restart cleanly on onend
          return;
        }
        if (event.error === 'not-allowed') {
          setIsMicPermissionDenied(true);
          setErrorText('Microphone permission required. Tap the microphone icon to enable voice.');
          isVoiceModeActiveRef.current = false;
          setVoiceState('error');
          return;
        }
        if (event.error === 'audio-capture' || event.error === 'network') {
          if (isVoiceModeActiveRef.current && isListeningRef.current) {
            setTimeout(() => {
              if (isVoiceModeActiveRef.current && isListeningRef.current) {
                createAndStartRecognition();
              }
            }, 350);
          }
        }
      };

      recognition.onend = () => {
        // If speech was captured, finish and respond
        if (isListeningRef.current && latestTranscriptRef.current.trim()) {
          finishListeningSession();
          return;
        }

        // CRITICAL FOR CONTINUOUS CONVERSATIONS:
        // In Web Speech API, a terminated recognition instance CANNOT be restarted with .start().
        // When silence causes recognition to end, we must spawn a fresh instance!
        if (isVoiceModeActiveRef.current && isListeningRef.current) {
          setTimeout(() => {
            if (isVoiceModeActiveRef.current && isListeningRef.current) {
              createAndStartRecognition();
            }
          }, 200);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition initialization error, retrying:', err);
      if (isVoiceModeActiveRef.current && isListeningRef.current) {
        setTimeout(() => {
          if (isVoiceModeActiveRef.current && isListeningRef.current) {
            createAndStartRecognition();
          }
        }, 400);
      }
    }
  }, []);

  const startListening = async () => {
    if (isListeningRef.current && voiceState === 'listening') return;
    setErrorText(null);
    setIsMicPermissionDenied(false);
    setLiveTranscript('');
    latestTranscriptRef.current = '';
    hasAudibleSpeechRef.current = false;
    cleanupTimers();
    audioService.stop();

    // Ensure audio output is unlocked for subsequent speech responses on mobile & tablet
    audioService.unlockAudio();

    // Mark continuous Voice Mode active
    isVoiceModeActiveRef.current = true;
    isListeningRef.current = true;
    setVoiceState('listening');

    // 1. Initialize microphone stream on all devices (mobile, tablet, PC)
    // This acquires mic permission, runs the silent gain node to pull live audio data, and starts MediaRecorder
    try {
      const { analyser } = await audioService.initMicrophoneStream();
      analyserRef.current = analyser;
    } catch (micErr: any) {
      console.warn('Microphone stream error:', micErr);
      if (
        micErr.name === 'NotAllowedError' ||
        micErr.name === 'PermissionDeniedError' ||
        micErr.message?.includes('Permission denied')
      ) {
        setIsMicPermissionDenied(true);
        setErrorText('Microphone permission required. Tap the microphone icon and allow access in your browser.');
        isVoiceModeActiveRef.current = false;
        setVoiceState('error');
        return;
      } else if (micErr.name === 'NotFoundError' || micErr.name === 'DevicesNotFoundError') {
        setErrorText('No microphone detected on this device. You can type in the chat box.');
        isVoiceModeActiveRef.current = false;
        setVoiceState('error');
        return;
      }
    }

    // 2. Also start Web Speech recognition if supported by browser
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (SpeechRecognition) {
      createAndStartRecognition();
    }
  };

  const stopVoiceMode = useCallback(() => {
    isVoiceModeActiveRef.current = false;
    isListeningRef.current = false;
    cleanupTimers();
    cleanupMic();
    audioService.stop();
    setVoiceState('idle');
    setLiveTranscript('');
    latestTranscriptRef.current = '';
  }, [cleanupMic]);

  const startVoiceMode = useCallback(() => {
    audioService.unlockAudio();
    isVoiceModeActiveRef.current = true;
    startListening();
  }, []);

  const toggleVoiceInteraction = useCallback(() => {
    audioService.unlockAudio();
    if (voiceState === 'listening') {
      // If user taps while listening, finalize and process speech immediately!
      finishListeningSession();
    } else if (voiceState === 'speaking' || isVoiceModeActiveRef.current) {
      stopVoiceMode();
    } else {
      startVoiceMode();
    }
  }, [voiceState, startVoiceMode, stopVoiceMode]);

  // Allows triggering a simulated or sample voice query directly
  const simulateVoiceQuery = async (queryText: string) => {
    setErrorText(null);
    setIsMicPermissionDenied(false);
    audioService.stop();
    setLiveTranscript(queryText);
    setVoiceState('listening');

    setTimeout(async () => {
      await handleSpeechComplete(queryText);
    }, 600);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMic();
      audioService.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cleanupMic]);

  return {
    voiceState,
    setVoiceState,
    errorText,
    isMicPermissionDenied,
    liveTranscript,
    audioLevels,
    startListening,
    stopListening: stopVoiceMode,
    toggleVoiceInteraction,
    simulateVoiceQuery,
    isVoiceModeActive: isVoiceModeActiveRef.current,
  };
}
