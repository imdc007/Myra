import {
  MyraRequest,
  MyraResponse,
  N8nChatRequest,
  N8nChatResponse,
  PersonalizationSettings,
  VerificationData,
} from '../types/myra';
import { DEFAULT_PERSONALIZATION } from './mockData';

class MyraClientService {
  private sessionId: string;
  private personalization: PersonalizationSettings;

  constructor() {
    this.sessionId = this.initSessionId();
    this.personalization = this.loadPersonalization();
  }

  private initSessionId(): string {
    try {
      const existing = localStorage.getItem('myra_session_id');
      if (existing) return existing;
      const newId =
        'myra-sess-' +
        Math.random().toString(36).substring(2, 11) +
        '-' +
        Date.now().toString(36);
      localStorage.setItem('myra_session_id', newId);
      return newId;
    } catch {
      return 'myra-sess-' + Date.now().toString(36);
    }
  }

  private loadPersonalization(): PersonalizationSettings {
    try {
      const stored = localStorage.getItem('myra_personalization');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PERSONALIZATION;
  }

  public getSession(): string {
    return this.sessionId;
  }

  public getPersonalization(): PersonalizationSettings {
    return this.personalization;
  }

  public async savePersonalization(settings: PersonalizationSettings): Promise<void> {
    this.personalization = settings;
    try {
      localStorage.setItem('myra_personalization', JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Sends a chat message to the server-side /api/myra endpoint which forwards to n8n.
   * Supports both raw text strings or structured message objects.
   */
  public async sendChatMessage(
    input: string | { input?: string; text?: string; raw_text?: string; input_mode?: string }
  ): Promise<N8nChatResponse> {
    const userText = (
      typeof input === 'string'
        ? input
        : input.text || input.raw_text || input.input || ''
    ).trim();

    if (!userText) {
      throw new Error('Cannot send an empty message');
    }

    const input_mode =
      typeof input === 'object' && input.input_mode
        ? input.input_mode
        : 'chat';
    const text = userText;

    // Temporary client-side diagnostic log immediately before calling /api/myra
    console.log('[Myra Client] Calling /api/myra', {
      input_mode,
      has_text: Boolean(text),
    });

    const payload: N8nChatRequest = {
      session_id: this.sessionId,
      input_mode,
      text,
      raw_text: text,
    };

    try {
      const response = await fetch('/api/myra', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let rawText = '';
      try {
        rawText = await response.text();
      } catch {
        rawText = '';
      }

      if (!response.ok) {
        console.warn(`[Myra Client] Non-OK status ${response.status}`);
        return {
          success: true,
          session_id: this.sessionId,
          input_mode,
          output_mode: input_mode === 'voice' ? 'voice' : 'text',
          response_text: 'Can you please share your query again?',
        };
      }

      let responseData: any;
      try {
        responseData = JSON.parse(rawText);
      } catch {
        console.warn('[Myra Client] Non-JSON response received');
        return {
          success: true,
          session_id: this.sessionId,
          input_mode,
          output_mode: input_mode === 'voice' ? 'voice' : 'text',
          response_text: 'Can you please share your query again?',
        };
      }

      const parsed: N8nChatResponse = Array.isArray(responseData)
        ? responseData[0]
        : responseData;

      const responseText =
        parsed?.response_text ||
        (parsed as any)?.output ||
        (parsed as any)?.text ||
        (parsed as any)?.message ||
        '';

      if (!responseText.trim()) {
        return {
          ...parsed,
          success: true,
          session_id: this.sessionId,
          input_mode,
          output_mode: input_mode === 'voice' ? 'voice' : 'text',
          response_text: 'Can you please share your query again?',
        };
      }

      return {
        ...parsed,
        response_text: responseText.trim(),
      };
    } catch (err) {
      console.warn('[Myra Client] Fetch error:', err);
      return {
        success: true,
        session_id: this.sessionId,
        input_mode,
        output_mode: input_mode === 'voice' ? 'voice' : 'text',
        response_text: 'Can you please share your query again?',
      };
    }
  }

  public async sendVoiceMessage(request: MyraRequest): Promise<MyraResponse> {
    const chatRes = await this.sendChatMessage({
      text: request.input,
      raw_text: request.input,
      input_mode: 'voice',
    });
    return {
      success: true,
      session_id: request.session_id,
      input_mode: 'voice',
      response_mode: 'voice',
      response_text: chatRes.response_text,
      sources: chatRes.source ? [chatRes.source] : undefined,
      assistant_state: chatRes.assistant_state || {
        emotion: 'warm',
        tone: 'conversational',
        visual_state: 'speaking',
        speaking_style: 'natural',
      },
    };
  }

  public async submitVerification(
    sessionId: string,
    verification: VerificationData,
    _originalQuery: string
  ): Promise<MyraResponse> {
    // Mock verification resolution
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      session_id: sessionId,
      input_mode: 'chat',
      response_mode: 'chat',
      response_text: `Thank you, ${verification.name}. Your details have been verified for "${verification.purpose}". Dushyant's direct correspondence is handled via contact@dushyant.dev. He typically reviews partnership and consultation inquiries within 24 to 48 hours. Is there anything specific about his technical portfolio I can share with you in the meantime?`,
      assistant_state: {
        emotion: 'warm',
        tone: 'conversational',
        visual_state: 'idle',
        speaking_style: 'natural',
      },
    };
  }
}

export const myraClient = new MyraClientService();
