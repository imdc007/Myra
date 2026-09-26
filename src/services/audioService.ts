class AudioService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isSpeaking = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  private welcomePlayed = false;
  private welcomeStarted = false;

  public getHasPlayedWelcome(): boolean {
    return this.welcomePlayed;
  }

  public setHasPlayedWelcome(val: boolean): void {
    this.welcomePlayed = val;
  }

  public async unlockAudioContext(): Promise<void> {
    try {
      if (this.synth && this.synth.paused) {
        this.synth.resume();
      }
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext) {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      }
    } catch {
      // Ignore
    }
  }

  public checkAndPlayWelcome(onWelcomeStart?: () => void, onWelcomeEnd?: () => void): boolean {
    return this.playWelcome(onWelcomeStart, onWelcomeEnd);
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
    let executed = false;
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    const executeSpeak = () => {
      if (executed) return;
      executed = true;

      try {
        if (this.synth) {
          this.synth.resume();
        }
      } catch {
        // Ignore
      }

      // Safety watchdog: if the browser blocks speech without throwing or firing onstart within 2.5s,
      // allow fallback to proceed (e.g. enable microphone)
      safetyTimer = setTimeout(() => {
        if (!this.welcomeStarted && !this.welcomePlayed) {
          console.info('Welcome speech pending user gesture or autoplay policy; unlocking mic fallback.');
          if (onWelcomeEnd) onWelcomeEnd();
        }
      }, 2500);

      this.speak(
        text,
        () => {
          this.welcomeStarted = true;
          if (safetyTimer) clearTimeout(safetyTimer);
          if (onWelcomeStart) onWelcomeStart();
        },
        () => {
          this.welcomePlayed = true;
          this.welcomeStarted = false;
          if (safetyTimer) clearTimeout(safetyTimer);
          if (onWelcomeEnd) onWelcomeEnd();
        },
        (err: any) => {
          this.welcomeStarted = false;
          if (safetyTimer) clearTimeout(safetyTimer);
          // If blocked by browser autoplay (not-allowed / canceled), keep welcomePlayed false
          // so the user's manual click on the Voice/Mic icon will play the welcome message!
          if (err && (err.error === 'not-allowed' || err.error === 'canceled')) {
            this.welcomePlayed = false;
          } else {
            this.welcomePlayed = true;
          }
          if (onWelcomeEnd) onWelcomeEnd();
        }
      );
    };

    // If voices haven't loaded yet in Chromium, await voiceschanged or run immediate fallback
    if (this.synth && this.synth.getVoices().length === 0) {
      if ('onvoiceschanged' in this.synth) {
        this.synth.addEventListener('voiceschanged', executeSpeak, { once: true });
      }
      setTimeout(() => {
        executeSpeak();
      }, 200);
    } else {
      executeSpeak();
    }

    return true;
  }

  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: unknown) => void
  ): void {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    try {
      this.stop();

      // Clean markdown tags or bullets from text for natural speaking
      const cleanText = text
        .replace(/[*#_`]/g, '')
        .replace(/•/g, ', ')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.currentUtterance = utterance;

      // Select high quality voice if available
      const voices = this.synth.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          (v.name.includes('Natural') ||
            v.name.includes('Samantha') ||
            v.name.includes('Google') ||
            v.name.includes('Karen') ||
            v.name.includes('Victoria') ||
            v.name.includes('Moira') ||
            v.name.includes('Siri')) &&
          v.lang.startsWith('en')
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.02;

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

      if (this.synth.paused) {
        this.synth.resume();
      }

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
      this.isSpeaking = false;
      if (onError) onError(e);
      else if (onEnd) onEnd();
    }
  }

  public stop(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // Ignore
      }
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
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

      // Close previous stream if open
      this.stopMicrophoneStream();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.micStream = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      this.audioContext = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

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
        const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
        let chosenMime = '';
        for (const mime of mimeTypes) {
          if (MediaRecorder.isTypeSupported(mime)) {
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

        this.mediaRecorder.start(250);
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

          // Calculate total bytes recorded; if less than 3KB, it's just header with no speech
          const totalBytes = chunks.reduce((acc, chunk) => acc + chunk.size, 0);
          if (totalBytes < 3000) {
            resolve(null);
            return;
          }

          const blob = new Blob(chunks, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            // Extract base64 portion
            const base64 = result.split(',')[1] || '';
            if (base64.length < 2500) {
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
      if (!audioData || audioData.length < 2500) {
        return '';
      }
      // Guard against excessively large audio payloads exceeding limits
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

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {
        // Ignore
      }
      this.audioContext = null;
    }
    this.analyser = null;
  }
}

export const audioService = new AudioService();
