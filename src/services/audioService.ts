export interface HindiVoiceOption {
  id: string;
  name: string;
  displayName: string;
  category: 'Indian English (Hindi accent)' | 'Native Hindi (शुद्ध हिन्दी)';
  engine: 'Microsoft Azure Neural' | 'Google Cloud Neural';
  accent: string;
  toneDescription: string;
  previewPrompt: string;
  isAvailableOnDevice: boolean;
  voiceObject?: SpeechSynthesisVoice;
}

class AudioService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private audioPlayer: HTMLAudioElement | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private stopListeners: Set<() => void> = new Set();
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private muteGain: GainNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isSpeaking = false;
  private selectedVoiceId: string = 'neerja-expressive';
  private welcomePlayed = false;
  private welcomeStarted = false;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
      }
      try {
        const stored = localStorage.getItem('myra_selected_voice');
        if (stored && stored !== 'neerja') {
          this.selectedVoiceId = stored;
        } else {
          this.selectedVoiceId = 'neerja-expressive';
          localStorage.setItem('myra_selected_voice', 'neerja-expressive');
        }
      } catch {
        this.selectedVoiceId = 'neerja-expressive';
      }
    }
  }

  public onStop(listener: () => void): () => void {
    this.stopListeners.add(listener);
    return () => {
      this.stopListeners.delete(listener);
    };
  }

  public getHasPlayedWelcome(): boolean {
    return this.welcomePlayed;
  }

  public setHasPlayedWelcome(val: boolean): void {
    this.welcomePlayed = val;
  }

  public getSelectedVoice(): string {
    const v = this.selectedVoiceId || 'neerja-expressive';
    if (v === 'neerja') return 'neerja-expressive';
    return v;
  }

  public setSelectedVoice(voiceId: string): void {
    const resolved = voiceId === 'neerja' ? 'neerja-expressive' : voiceId;
    this.selectedVoiceId = resolved;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('myra_selected_voice', resolved);
      } catch {
        // Ignore localStorage error
      }
    }
  }

  public getAvailableHindiFemaleVoices(): HindiVoiceOption[] {
    return [
      {
        id: 'neerja-expressive',
        name: 'Neerja (Expressive Neural)',
        displayName: 'Neerja — Conversational & Expressive',
        category: 'Indian English (Hindi accent)',
        engine: 'Microsoft Azure Neural',
        accent: 'Fluent, authentic Indian English',
        toneDescription:
          'Warm, lively, and conversational. Highly natural pacing with authentic Indian English inflection.',
        previewPrompt:
          "Hello! I'm Myra, Dushyant's dedicated AI assistant. Notice my natural conversational rhythm and warm Indian accent.",
        isAvailableOnDevice: true,
      },
      {
        id: 'swara',
        name: 'Swara (Native Hindi Neural)',
        displayName: 'Swara — Native Hindi Neural',
        category: 'Native Hindi (शुद्ध हिन्दी)',
        engine: 'Microsoft Azure Neural',
        accent: 'Pure Hindi & Hinglish',
        toneDescription:
          'Expressive, melodic, and authentic native Hindi female voice with traditional pronunciation.',
        previewPrompt:
          'नमस्ते! मैं मायरा हूँ, दुष्यंत की एआई असिस्टेंट। मैं इस मधुर और स्पष्ट हिन्दी आवाज़ में आपसे बात कर सकती हूँ।',
        isAvailableOnDevice: true,
      },
      {
        id: 'neerja-professional',
        name: 'Neerja (Professional Neural)',
        displayName: 'Neerja — Professional Tech & Systems',
        category: 'Indian English (Hindi accent)',
        engine: 'Microsoft Azure Neural',
        accent: 'Crisp, articulate Indian English',
        toneDescription:
          'Measured, formal, and authoritative. Designed specifically for tech deep-dives and engineering reviews.',
        previewPrompt:
          "Hello! I'm Myra. This is my professional voice, designed for structured portfolio tours and engineering deep-dives.",
        isAvailableOnDevice: true,
      },
      {
        id: 'google-hi',
        name: 'Google हिन्दी',
        displayName: 'Google हिन्दी — Direct & Modern',
        category: 'Native Hindi (शुद्ध हिन्दी)',
        engine: 'Google Cloud Neural',
        accent: 'Modern urban Hindi',
        toneDescription:
          'Bright, clean, and direct native Hindi voice with modern conversational pronunciation.',
        previewPrompt:
          'नमस्ते! यह गूगल की उच्च गुणवत्ता वाली हिन्दी आवाज़ है। आप इसे अपने पसंदीदा विकल्प के रूप में चुन सकते हैं।',
        isAvailableOnDevice: true,
      },
      {
        id: 'google-en-in',
        name: 'Google English (India)',
        displayName: 'Google English (India)',
        category: 'Indian English (Hindi accent)',
        engine: 'Google Cloud Neural',
        accent: 'Classic Google Indian English',
        toneDescription:
          'Contemporary Indian English female voice with crisp phrasing and modern delivery.',
        previewPrompt:
          "Hello! This is Google's Indian English female voice for Myra. I'm ready to answer any questions about Dushyant.",
        isAvailableOnDevice: true,
      },
    ];
  }

  public unlockAudio(): void {
    if (typeof window === 'undefined') return;

    if (this.synth) {
      try {
        if (this.synth.paused) {
          this.synth.resume();
        }
      } catch {
        // Ignore
      }
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext || this.audioContext.state === 'closed') {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        // Play silent 1-sample buffer to permanently unlock on iOS/iPadOS/Android
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);
      }
    } catch (e) {
      console.warn('AudioContext unlock notice:', e);
    }

    try {
      if (!this.audioPlayer) {
        this.audioPlayer = new Audio();
        this.audioPlayer.setAttribute('playsinline', 'true');
        this.audioPlayer.setAttribute('webkit-playsinline', 'true');
      }
      // Warm up the audio element with a tiny silent wave so iOS Safari allows subsequent playback
      this.audioPlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      this.audioPlayer.play().catch(() => {});
    } catch (e) {
      console.warn('Audio element unlock notice:', e);
    }
  }

  public async unlockAudioContext(): Promise<void> {
    this.unlockAudio();
  }

  public playWelcome(onWelcomeStart?: () => void, onWelcomeEnd?: () => void): boolean {
    if (typeof window === 'undefined') return false;
    if (this.welcomePlayed) return false;

    try {
      localStorage.removeItem('myra_welcome_played');
    } catch {
      // Ignore storage errors
    }

    const text = "Hello, I'm Dushyant's AI assistant.";
    this.welcomeStarted = true;

    this.speak(
      text,
      () => {
        this.welcomeStarted = false;
        this.welcomePlayed = true;
        if (onWelcomeStart) onWelcomeStart();
      },
      () => {
        this.welcomeStarted = false;
        this.welcomePlayed = true;
        if (onWelcomeEnd) onWelcomeEnd();
      },
      () => {
        this.welcomeStarted = false;
        this.welcomePlayed = true;
        if (onWelcomeEnd) onWelcomeEnd();
      }
    );

    return true;
  }

  public async playSampleVoice(
    voiceId: string,
    sampleText?: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: unknown) => void
  ): Promise<void> {
    this.stop();

    const voices = this.getAvailableHindiFemaleVoices();
    const voice = voices.find((v) => v.id === voiceId) || voices[0];
    const textToSpeak = sampleText?.trim() || voice.previewPrompt;

    try {
      this.isSpeaking = true;
      if (onStart) onStart();

      const url = `/api/tts?voice=${encodeURIComponent(voice.id)}&text=${encodeURIComponent(textToSpeak)}`;
      const audio = new Audio(url);
      this.currentAudio = audio;

      audio.onended = () => {
        this.isSpeaking = false;
        this.currentAudio = null;
        if (onEnd) onEnd();
      };

      audio.onerror = (e) => {
        console.warn('Neural audio sample error, falling back to Web Speech API:', e);
        this.isSpeaking = false;
        this.currentAudio = null;
        this.fallbackSpeakUtterance(textToSpeak, onStart, onEnd, onError);
      };

      await audio.play();
    } catch (err) {
      console.warn('Error initiating neural sample playback:', err);
      this.currentAudio = null;
      this.fallbackSpeakUtterance(textToSpeak, onStart, onEnd, onError);
    }
  }

  public async speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: unknown) => void
  ): Promise<void> {
    this.stop();

    const cleanText = text
      .replace(/[*#_`]/g, '')
      .replace(/•/g, ', ')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const voiceId = this.getSelectedVoice();

    try {
      this.unlockAudio();

      const url = `/api/tts?voice=${encodeURIComponent(voiceId)}&text=${encodeURIComponent(cleanText.slice(0, 1000))}`;

      // Fetch audio data with 12s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`TTS server responded with status ${res.status}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('TTS returned empty audio buffer');
      }

      let played = false;

      // Strategy A: Web Audio API (Primary for mobile/tablet — avoids iOS autoplay audio bugs once unlocked)
      if (this.audioContext && this.audioContext.state !== 'closed') {
        try {
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }

          const bufferCopy = arrayBuffer.slice(0);
          const decoded = await new Promise<AudioBuffer>((resolve, reject) => {
            this.audioContext!.decodeAudioData(bufferCopy, resolve, reject);
          });

          const source = this.audioContext.createBufferSource();
          source.buffer = decoded;
          source.connect(this.audioContext.destination);
          this.currentSource = source;

          this.isSpeaking = true;
          if (onStart) onStart();

          source.onended = () => {
            this.isSpeaking = false;
            this.currentSource = null;
            if (onEnd) onEnd();
          };

          source.start(0);
          played = true;
        } catch (webAudioErr) {
          console.warn('Web Audio decode failed, falling back to Audio element:', webAudioErr);
        }
      }

      // Strategy B: HTML5 Audio with Blob URL
      if (!played) {
        const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        const blobUrl = URL.createObjectURL(blob);

        const player = this.audioPlayer || new Audio();
        this.audioPlayer = player;
        this.currentAudio = player;
        player.setAttribute('playsinline', 'true');
        player.setAttribute('webkit-playsinline', 'true');
        player.src = blobUrl;

        this.isSpeaking = true;
        if (onStart) onStart();

        player.onended = () => {
          this.isSpeaking = false;
          this.currentAudio = null;
          URL.revokeObjectURL(blobUrl);
          if (onEnd) onEnd();
        };

        player.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          this.currentAudio = null;
          this.fallbackSpeakUtterance(cleanText, onStart, onEnd, onError);
        };

        await player.play();
      }
    } catch (err) {
      console.warn('Network TTS speech error, using browser speech synthesis fallback:', err);
      this.fallbackSpeakUtterance(cleanText, onStart, onEnd, onError);
    }
  }

  private fallbackSpeakUtterance(
    cleanText: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: unknown) => void
  ): void {
    if (!this.synth) {
      this.isSpeaking = false;
      if (onEnd) onEnd();
      return;
    }

    try {
      this.synth.cancel();
      if (this.synth.paused) {
        this.synth.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.currentUtterance = utterance;
      // Retain reference on window to prevent garbage collection dropouts on iOS/Android
      if (typeof window !== 'undefined') {
        (window as unknown as { __myraUtterance: SpeechSynthesisUtterance }).__myraUtterance = utterance;
      }

      const voices = this.synth.getVoices();
      const preferred = voices.find((v) => {
        const l = v.lang.toLowerCase();
        return l.startsWith('hi') || l === 'en-in';
      });

      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.rate = 0.98;
      utterance.pitch = 1.04;

      utterance.onstart = () => {
        this.isSpeaking = true;
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        if (onError) onError(e);
        else if (onEnd) onEnd();
      };

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
      this.isSpeaking = false;
      if (onError) onError(e);
      else if (onEnd) onEnd();
    }
  }

  public stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // Ignore
      }
      this.currentSource = null;
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // Ignore
      }
      this.currentAudio = null;
    }
    if (this.audioPlayer) {
      try {
        this.audioPlayer.pause();
      } catch {
        // Ignore
      }
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // Ignore
      }
    }
    this.isSpeaking = false;
    this.currentUtterance = null;

    // Notify listeners so UI updates immediately
    this.stopListeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // Ignore
      }
    });
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  // Audio Context & Microphone Stream setup for real visualization & recording
  public async initMicrophoneStream(): Promise<{ analyser: AnalyserNode; stream: MediaStream }> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone not supported in this browser');
      }

      // Close previous mic stream if open
      this.stopMicrophoneStream();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.micStream = stream;

      if (!this.audioContext || this.audioContext.state === 'closed') {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      const ctx = this.audioContext;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      if (this.micSource) {
        try {
          this.micSource.disconnect();
        } catch {
          // Ignore
        }
        this.micSource = null;
      }

      const source = ctx.createMediaStreamSource(stream);
      const muteGain = ctx.createGain();
      muteGain.gain.value = 0;
      source.connect(analyser);
      analyser.connect(muteGain);
      muteGain.connect(ctx.destination);
      this.micSource = source;
      this.muteGain = muteGain;
      this.analyser = analyser;

      // Also setup MediaRecorder if supported
      this.setupMediaRecorder(stream);

      return { analyser, stream };
    } catch (err) {
      console.warn('Could not initialize microphone stream:', err);
      throw err;
    }
  }

  private setupMediaRecorder(stream: MediaStream): void {
    try {
      if (typeof MediaRecorder !== 'undefined') {
        const mimeTypes = [
          'audio/mp4',
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/aac',
          'audio/ogg;codecs=opus',
          'audio/wav',
        ];
        let chosenMime = '';
        for (const mime of mimeTypes) {
          if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mime)) {
            chosenMime = mime;
            break;
          }
        }

        const options = chosenMime ? { mimeType: chosenMime } : undefined;
        this.mediaRecorder = new MediaRecorder(stream, options);
        this.audioChunks = [];

        // Cap recorded audio to maximum 20MB to prevent PayloadTooLarge errors
        const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
        let accumulatedBytes = 0;

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            accumulatedBytes += event.data.size;
            if (accumulatedBytes <= MAX_TOTAL_BYTES) {
              this.audioChunks.push(event.data);
            }
          }
        };

        // Call start() without timeslice.
        // On iOS Safari, timeslice causes ondataavailable to deliver empty or corrupt chunks.
        this.mediaRecorder.start();
      }
    } catch (e) {
      console.info('MediaRecorder setup note:', e);
    }
  }

  public async stopAndGetRecording(): Promise<{ base64: string; mimeType: string } | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      const recorder = this.mediaRecorder;
      const chunks = this.audioChunks;
      const mimeType = recorder.mimeType || 'audio/webm';

      recorder.onstop = () => {
        try {
          if (!chunks || chunks.length === 0) {
            resolve(null);
            return;
          }

          const totalBytes = chunks.reduce((acc, chunk) => acc + chunk.size, 0);
          if (totalBytes < 100) {
            resolve(null);
            return;
          }

          const blob = new Blob(chunks, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1] || '';
            if (base64.length < 50) {
              resolve(null);
            } else {
              resolve({ base64, mimeType });
            }
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        } catch {
          resolve(null);
        }
      };

      try {
        recorder.stop();
      } catch {
        resolve(null);
      }
    });
  }

  public async transcribeAudio(audioData: string, mimeType: string): Promise<string> {
    try {
      if (!audioData || audioData.length < 50) {
        return '';
      }
      if (audioData.length > 35 * 1024 * 1024) {
        console.warn('Audio data exceeds transcription size limit.');
        return '';
      }
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData, mimeType }),
      });
      if (!response.ok) {
        throw new Error('Transcription API error');
      }
      const rawText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        return '';
      }
      return (data.text || '').trim();
    } catch (err) {
      console.warn('Transcription request error:', err);
      return '';
    }
  }

  public stopMicrophoneStream(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignore
      }
      this.mediaRecorder = null;
    }
    this.audioChunks = [];

    if (this.micSource) {
      try {
        this.micSource.disconnect();
      } catch {
        // Ignore
      }
      this.micSource = null;
    }

    if (this.muteGain) {
      try {
        this.muteGain.disconnect();
      } catch {
        // Ignore
      }
      this.muteGain = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    // DO NOT CLOSE this.audioContext!
    // Keeping audioContext alive ensures subsequent TTS audio can play smoothly on mobile & tablet without getting blocked by autoplay!
    this.analyser = null;
  }
}

export const audioService = new AudioService();
