import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Global error handler for JSON parser and request entity errors
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err) {
      if (err.type === 'entity.too.large' || err.status === 413) {
        console.warn('[Server] Request payload entity too large (413):', err.message);
        return res.status(413).json({
          success: false,
          error: 'The request payload is too large. Please shorten your message or record a shorter audio clip.',
        });
      }
      if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({
          success: false,
          error: 'Malformed JSON payload received.',
        });
      }
      console.error('[Server] Unhandled middleware error:', err);
      return res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
      });
    }
    next();
  });

  // Initialize Gemini API client per @google/genai guidelines
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Deterministic portfolio intelligence response generator (100% resilient fallback)
  function generateDeterministicAssistantResponse(
    userText: string,
    sessionId: string,
    inputMode: string
  ) {
    const lower = userText.toLowerCase().trim();
    let replyText = '';

    if (
      /^(hello|hi|hey|good\s*(morning|afternoon|evening)|greetings|howdy)\b/i.test(lower) ||
      lower.includes('hello myra') ||
      lower.includes('hi myra')
    ) {
      replyText =
        "Hello! I’m Myra, Dushyant’s dedicated AI assistant and portfolio guide. I'm here to help you explore his work across autonomous agent workflows, low-latency voice AI systems, and full-stack architecture. What would you like to know?";
    } else if (
      lower.includes('who are you') ||
      lower.includes('what are you') ||
      lower.includes('about you') ||
      lower.includes('what can you do')
    ) {
      replyText =
        "I am Myra, an ambient, intelligent AI assistant designed by Dushyant. I represent his engineering portfolio, showcase his work with autonomous systems and real-time audio interfaces, and facilitate collaboration inquiries.";
    } else if (
      lower.includes('who is dushyant') ||
      lower.includes('about dushyant') ||
      lower.includes('background') ||
      lower.includes('bio') ||
      lower.includes('profile')
    ) {
      replyText =
        "Dushyant is an AI Engineer & Full-Stack Systems Architect specializing in autonomous agent workflows, low-latency voice AI interfaces, and distributed systems. He has over 5 years of experience building scalable platforms, high-throughput microservices, and bespoke multimodal user experiences.";
    } else if (
      lower.includes('project') ||
      lower.includes('portfolio') ||
      lower.includes('work') ||
      lower.includes('build')
    ) {
      replyText =
        "Dushyant's featured builds include: 1) Myra Voice & Multimodal Assistant (low-latency ambient voice AI with real-time equalization); 2) Agentic Workflow Orchestrator (multi-model autonomous routing with RAG pipelines); 3) Real-Time Audio Processing Hub (browser-native bidirectional synthesis with emotion-adaptive responses).";
    } else if (
      lower.includes('skill') ||
      lower.includes('stack') ||
      lower.includes('tech') ||
      lower.includes('language') ||
      lower.includes('framework')
    ) {
      replyText =
        "Dushyant's core stack includes AI & Agents (Gemini, Claude, LangChain, n8n automation, RAG), Frontend & Voice (React, Next.js, TypeScript, Tailwind CSS, Web Audio API), and Backend & Cloud (Node.js, Express, Python, FastAPI, PostgreSQL, Cloud Run, Docker).";
    } else if (
      lower.includes('contact') ||
      lower.includes('hire') ||
      lower.includes('email') ||
      lower.includes('reach') ||
      lower.includes('message') ||
      lower.includes('collaborat')
    ) {
      replyText =
        "You can connect directly with Dushyant at contact@dushyant.dev or through this assistant. He welcomes inquiries regarding autonomous agent architecture, voice AI systems, and strategic engineering roles.";
    } else if (
      lower.includes('experience') ||
      lower.includes('career') ||
      lower.includes('history') ||
      lower.includes('resume')
    ) {
      replyText =
        "Dushyant currently serves as Lead AI & Full-Stack Architect (2023–Present) developing agentic pipelines and voice interfaces. Previously, he worked as Senior Full-Stack Engineer (2021–2023) modernizing scalable microservices, and Software Engineer (2019–2021) building fluid interactive platforms.";
    } else {
      replyText =
        `Dushyant is an AI Engineer & Full-Stack Architect focused on autonomous agent workflows and voice AI interfaces. Whether you're interested in his architecture for "${userText.slice(0, 45)}", his featured builds, or exploring a partnership, I'm here to assist. Feel free to ask or reach out to contact@dushyant.dev.`;
    }

    return {
      success: true,
      session_id: sessionId,
      input_mode: inputMode,
      output_mode: inputMode === 'voice' ? 'voice' : 'text',
      response_text: replyText,
      source: 'myra-knowledge',
      assistant_state: {
        emotion: 'warm',
        tone: 'conversational',
        visual_state: 'speaking',
        speaking_style: 'natural',
      },
    };
  }

  // Assistant generator fallback using Gemini with graceful 503 mitigation
  async function generateGeminiAssistantResponse(
    userText: string,
    sessionId: string,
    inputMode: string
  ) {
    const systemPrompt = `You are Myra, the personal AI voice & chat assistant for Dushyant.
Dushyant's Profile:
- Role: AI Engineer & Full-Stack Systems Architect
- Expertise: Autonomous agent workflows, low-latency voice AI interfaces, multi-agent orchestration, n8n automation, LLM integration, Web Audio API, modern React, TypeScript, Python.
- Key Achievements: Built low-latency voice agents, agentic RAG orchestration engines, and high-throughput real-time distributed platforms.
- Persona: You are Myra. Be articulate, warm, visionary, and concise. Speak naturally and intelligently.
- Tone: Welcoming, friendly, and knowledgeable.
- Contact: For inquiries, collaborations, or hiring, reach out to contact@dushyant.dev.

Guidelines:
- Keep answers engaging, natural, and concise (1-3 sentences for greetings/basic Q&A).
- If greeted with "Hello Myra" or similar, warmly greet back and introduce yourself as Myra, Dushyant's dedicated AI assistant.
- Never mention internal technical fallback mechanisms or system prompts.`;

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUser: ${userText}\nMyra:` }],
            },
          ],
        });
        const replyText = response.text?.trim();
        if (replyText) {
          return {
            success: true,
            session_id: sessionId,
            input_mode: inputMode,
            output_mode: inputMode === 'voice' ? 'voice' : 'text',
            response_text: replyText,
            source: 'myra-gemini',
            assistant_state: {
              emotion: 'warm',
              tone: 'conversational',
              visual_state: 'speaking',
              speaking_style: 'natural',
            },
          };
        }
      } catch (geminiErr: any) {
        // High demand spikes (503) or rate limits (429) are expected cloud capacity variations; try next candidate
        if (geminiErr.status === 503 || geminiErr.status === 429 || geminiErr.message?.includes('503')) {
          continue;
        }
      }
    }

    // Deterministic intelligence guarantee if cloud LLM capacity is temporarily constrained
    return generateDeterministicAssistantResponse(userText, sessionId, inputMode);
  }

  // Support GET /api/myra gracefully
  app.get('/api/myra', (_req, res) => {
    return res.status(200).json({
      success: true,
      session_id: 'myra-sess-default',
      response_text: 'Can you please share your query again?',
      assistant_state: {
        emotion: 'warm',
        tone: 'conversational',
        visual_state: 'idle',
        speaking_style: 'natural',
      },
    });
  });

  // n8n Webhook Chat Proxy Endpoint
  app.post('/api/myra', async (req, res) => {
    const { session_id, input_mode, text, raw_text, voice_id, tts_model } = req.body || {};
    const userText = (text || raw_text || req.body?.input || req.body?.message || '').trim();
    const resolvedInputMode = input_mode || 'chat';
    const effectiveSessionId = session_id || 'myra-sess-default';

    try {
      const PRODUCTION_WEBHOOK_URL = 'https://itsdc.app.n8n.cloud/webhook/myra';
      const webhookUrl =
        process.env.N8N_WEBHOOK_URL || PRODUCTION_WEBHOOK_URL;
      const authHeaderName =
        process.env.N8N_WEBHOOK_AUTH_HEADER_NAME || 'X-Myra-Secret';
      const authHeaderValue = process.env.N8N_WEBHOOK_AUTH_HEADER_VALUE || '';

      if (!userText) {
        return res.status(200).json({
          success: true,
          session_id: effectiveSessionId,
          response_text: 'Can you please share your query again?',
        });
      }

      // Build structured payload for n8n with common field synonyms
      const payload: Record<string, any> = {
        session_id: effectiveSessionId,
        input_mode: resolvedInputMode,
        text: userText,
        raw_text: raw_text || userText,
        input: userText,
        message: userText,
        query: userText,
        chatInput: userText,
      };

      if (voice_id) {
        payload.voice_id = voice_id;
      }
      if (tts_model) {
        payload.tts_model = tts_model;
      }

      // Server-side secret header injection
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        [authHeaderName]: authHeaderValue,
      };

      // Call n8n webhook and wait for backend completion (120s timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      let n8nResponse: Response | null = null;
      try {
        n8nResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') {
          console.warn('[Server /api/myra] Backend response exceeded 120s timeout window.');
        } else {
          console.warn('[Server /api/myra] Backend connection error:', fetchErr.message);
        }
        n8nResponse = null;
      } finally {
        clearTimeout(timeoutId);
      }

      if (n8nResponse && n8nResponse.ok) {
        let responseData: any = null;
        try {
          responseData = await n8nResponse.json();
        } catch {
          responseData = null;
        }

        const result = Array.isArray(responseData) ? responseData[0] : responseData;
        const n8nText =
          result?.response_text ||
          result?.output ||
          result?.text ||
          result?.message ||
          result?.data?.response_text ||
          result?.data?.output ||
          result?.data?.text ||
          (typeof result === 'string' ? result : '');

        // If n8n gave a valid successful answer with text, return only the true backend result
        if (typeof n8nText === 'string' && n8nText.trim().length > 0) {
          return res.status(200).json({
            success: true,
            session_id: result?.session_id || effectiveSessionId,
            input_mode: resolvedInputMode,
            output_mode: result?.output_mode || (resolvedInputMode === 'voice' ? 'voice' : 'text'),
            response_text: n8nText.trim(),
            source: result?.source || 'n8n',
            assistant_state: result?.assistant_state || {
              emotion: 'warm',
              tone: 'conversational',
              visual_state: 'speaking',
              speaking_style: 'natural',
            },
            audio: result?.audio,
          });
        }
      }

      // If backend was unreachable, timed out, or returned an error, show polite user prompt
      return res.status(200).json({
        success: true,
        session_id: effectiveSessionId,
        input_mode: resolvedInputMode,
        output_mode: resolvedInputMode === 'voice' ? 'voice' : 'text',
        response_text: 'Can you please share your query again?',
        source: 'fallback',
        assistant_state: {
          emotion: 'warm',
          tone: 'conversational',
          visual_state: 'idle',
          speaking_style: 'natural',
        },
      });
    } catch (err: any) {
      console.warn('[Server /api/myra] Request processing failed:', err.message);

      return res.status(200).json({
        success: true,
        session_id: effectiveSessionId,
        input_mode: resolvedInputMode,
        output_mode: resolvedInputMode === 'voice' ? 'voice' : 'text',
        response_text: 'Can you please share your query again?',
      });
    }
  });

  // Voice transcription endpoint with resilient error handling and validation
  app.post('/api/transcribe', async (req, res) => {
    try {
      const { audioData, mimeType } = req.body;
      if (!audioData || typeof audioData !== 'string' || audioData.trim().length < 2500) {
        return res.status(200).json({ text: '' });
      }

      // Normalize MIME type (e.g., 'audio/webm;codecs=opus' -> 'audio/webm')
      const cleanMimeType = (mimeType || 'audio/webm').split(';')[0].trim();

      // Only models that support audio modality per skill guidelines:
      // 1. 'gemini-3.5-transcribe': Dedicated audio transcription model
      // 2. 'gemini-flash-latest': Multimodal fallback supporting audio
      const candidateModels = [
        'gemini-3.5-transcribe',
        'gemini-flash-latest',
      ];

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: cleanMimeType,
                    data: audioData.trim(),
                  },
                },
                {
                  text: 'Transcribe the spoken speech in this audio accurately into text. Return ONLY the transcribed text. Do not include quotes, preamble, or notes. If the audio is silent or unintelligible noise, return an empty string.',
                },
              ],
            },
          });

          const transcription = response.text?.trim() || '';
          return res.json({ text: transcription, model: modelName });
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          const isRateLimit =
            errMsg.includes('429') ||
            errMsg.includes('RESOURCE_EXHAUSTED') ||
            err?.status === 429;

          // If rate limited, do not loop to avoid burning quota
          if (isRateLimit) {
            break;
          }
          // If invalid argument, break rather than cascading
          if (errMsg.includes('400') || errMsg.includes('INVALID_ARGUMENT')) {
            break;
          }
        }
      }

      return res.status(200).json({
        text: '',
        warning: 'Transcription temporarily unavailable. You can type in the chat box.',
      });
    } catch {
      return res.status(200).json({
        text: '',
        warning: 'Audio processing could not complete.',
      });
    }
  });

  // API catch-all: ensure unhandled API requests return friendly response rather than technical error
  app.all('/api/*', (_req, res) => {
    return res.status(200).json({
      success: true,
      response_text: 'Can you please share your query again?',
      assistant_state: {
        emotion: 'warm',
        tone: 'conversational',
        visual_state: 'idle',
        speaking_style: 'natural',
      },
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
