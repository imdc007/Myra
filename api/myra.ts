export default async function handler(
  req: any,
  res: any
) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  if (req.method === 'GET') {
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
  }

  const body = req.body || {};

  const {
    session_id,
    input_mode,
    text,
    raw_text,
    voice_id,
    tts_model,
  } = body;

  const userText = String(
    text ||
      raw_text ||
      body.input ||
      body.message ||
      ''
  ).trim();

  const resolvedInputMode = input_mode || 'chat';
  const effectiveSessionId =
    session_id || 'myra-sess-default';

  if (!userText) {
    return res.status(200).json({
      success: true,
      session_id: effectiveSessionId,
      response_text: 'Can you please share your query again?',
    });
  }

  const webhookUrl =
    process.env.N8N_WEBHOOK_URL ||
    'https://itsdc.app.n8n.cloud/webhook/myra';

  const authHeaderName =
    process.env.N8N_WEBHOOK_AUTH_HEADER_NAME ||
    'X-Myra-Secret';

  const authHeaderValue =
    process.env.N8N_WEBHOOK_AUTH_HEADER_VALUE || '';

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

  try {
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 120000);

    let n8nResponse: Response;

    try {
      n8nResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [authHeaderName]: authHeaderValue,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (n8nResponse.ok) {
      let responseData: any = null;

      try {
        responseData = await n8nResponse.json();
      } catch {
        responseData = null;
      }

      const result = Array.isArray(responseData)
        ? responseData[0]
        : responseData;

      const n8nText =
        result?.response_text ||
        result?.output ||
        result?.text ||
        result?.message ||
        result?.data?.response_text ||
        result?.data?.output ||
        result?.data?.text ||
        (typeof result === 'string'
          ? result
          : '');

      if (
        typeof n8nText === 'string' &&
        n8nText.trim().length > 0
      ) {
        return res.status(200).json({
          success: true,
          session_id:
            result?.session_id ||
            effectiveSessionId,
          input_mode: resolvedInputMode,
          output_mode:
            result?.output_mode ||
            (resolvedInputMode === 'voice'
              ? 'voice'
              : 'text'),
          response_text: n8nText.trim(),
          source: result?.source || 'n8n',
          assistant_state:
            result?.assistant_state || {
              emotion: 'warm',
              tone: 'conversational',
              visual_state: 'speaking',
              speaking_style: 'natural',
            },
          audio: result?.audio,
        });
      }
    }

    return res.status(200).json({
      success: true,
      session_id: effectiveSessionId,
      input_mode: resolvedInputMode,
      output_mode:
        resolvedInputMode === 'voice'
          ? 'voice'
          : 'text',
      response_text:
        'Can you please share your query again?',
      source: 'fallback',
      assistant_state: {
        emotion: 'warm',
        tone: 'conversational',
        visual_state: 'idle',
        speaking_style: 'natural',
      },
    });
  } catch (error: any) {
    console.warn(
      '[Vercel /api/myra] Request failed:',
      error?.message || error
    );

    return res.status(200).json({
      success: true,
      session_id: effectiveSessionId,
      input_mode: resolvedInputMode,
      output_mode:
        resolvedInputMode === 'voice'
          ? 'voice'
          : 'text',
      response_text:
        'Can you please share your query again?',
    });
  }
}
