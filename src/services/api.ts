import { GoogleGenAI } from '@google/genai';

export type Provider = 'gemini' | 'openai' | 'anthropic';

export const PROVIDER_KEY_MAP: Record<Provider, string> = {
  gemini: 'ai_office_key_gemini',
  openai: 'ai_office_key_openai',
  anthropic: 'ai_office_key_anthropic',
};

export const PROVIDER_STORAGE_KEY = 'ai_office_provider';

export const DEFAULT_MODELS: Record<Provider, string> = {
  gemini: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5-20251001',
};

export interface HistoryEntry {
  role: 'user' | 'model';
  text: string;
}

export async function* streamRoleResponse(
  provider: Provider,
  systemPrompt: string,
  history: HistoryEntry[],
  userMessage: string,
  apiKey: string,
): AsyncGenerator<string> {
  switch (provider) {
    case 'gemini':
      yield* streamGemini(systemPrompt, history, userMessage, apiKey);
      break;
    case 'openai':
      yield* streamOpenAI(systemPrompt, history, userMessage, apiKey);
      break;
    case 'anthropic':
      yield* streamAnthropic(systemPrompt, history, userMessage, apiKey);
      break;
  }
}

async function* streamGemini(
  systemPrompt: string,
  history: HistoryEntry[],
  userMessage: string,
  apiKey: string,
): AsyncGenerator<string> {
  const ai = new GoogleGenAI({ apiKey });
  const contents = [
    ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: 'user' as const, parts: [{ text: userMessage }] },
  ];
  const stream = await ai.models.generateContentStream({
    model: DEFAULT_MODELS.gemini,
    contents,
    config: { systemInstruction: systemPrompt },
  });
  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}

async function* streamOpenAI(
  systemPrompt: string,
  history: HistoryEntry[],
  userMessage: string,
  apiKey: string,
): AsyncGenerator<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((h) => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.text,
    })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch('/api/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: DEFAULT_MODELS.openai, stream: true, messages }),
  });

  if (!res.ok) throw new Error(`OpenAI: ${await res.text()}`);

  yield* readSSE(res, (data) => {
    if (data === '[DONE]') return null;
    const json = JSON.parse(data);
    return json.choices?.[0]?.delta?.content ?? null;
  });
}

async function* streamAnthropic(
  systemPrompt: string,
  history: HistoryEntry[],
  userMessage: string,
  apiKey: string,
): AsyncGenerator<string> {
  const messages = [
    ...history.map((h) => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.text,
    })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: DEFAULT_MODELS.anthropic,
      max_tokens: 1024,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) throw new Error(`Anthropic: ${await res.text()}`);

  yield* readSSE(res, (data) => {
    const json = JSON.parse(data);
    if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
      return json.delta.text;
    }
    return null;
  });
}

async function* readSSE(
  res: Response,
  parse: (data: string) => string | null,
): AsyncGenerator<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      try {
        const text = parse(data);
        if (text) yield text;
      } catch {
        // malformed SSE chunk — skip
      }
    }
  }
}
