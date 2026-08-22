export interface LLMRequestOptions {
  systemPrompt?: string;
  temperature?: number;
  responseFormatJson?: boolean;
  /** When true, callers want a shorter answer suitable for TTS / small screen */
  shortAnswer?: boolean;
}

export class LLMClient {
  private getApiKey(): string | undefined {
    return process.env.LLM_API_KEY || process.env.SARVAM_API_KEY;
  }

  private getProvider(): string {
    return (process.env.LLM_PROVIDER || 'sarvam').toLowerCase();
  }

  private getModel(): string {
    const provider = this.getProvider();
    if (provider === 'sarvam') {
      return process.env.LLM_MODEL || 'sarvam-105b-conversations';
    } else if (provider === 'groq') {
      return process.env.LLM_MODEL || 'llama-3.3-70b-versatile';
    } else if (provider === 'openai') {
      return process.env.LLM_MODEL || 'gpt-4o-mini';
    }
    return process.env.LLM_MODEL || 'gemini-2.0-flash';
  }

  public async generateText(prompt: string, options: LLMRequestOptions = {}): Promise<string> {
    const apiKey = this.getApiKey();
    const provider = this.getProvider();

    if (apiKey && apiKey.trim().length > 0) {
      try {
        if (provider === 'sarvam') {
          return await this.callSarvam(prompt, options, apiKey);
        } else if (provider === 'gemini') {
          return await this.callGemini(prompt, options, apiKey);
        } else if (provider === 'openai' || provider === 'groq') {
          return await this.callOpenAICompatible(prompt, options, apiKey, provider);
        }
      } catch (err) {
        console.error(`LLM API call (${provider}) failed, falling back to heuristic engine:`, err);
      }
    }

    return this.fallbackGenerate(prompt);
  }

  /** Streaming variant — yields text chunks as they arrive (SSE delta). */
  public async *generateTextStream(
    prompt: string,
    options: LLMRequestOptions = {}
  ): AsyncIterable<string> {
    const apiKey = this.getApiKey();
    const provider = this.getProvider();

    if (apiKey && apiKey.trim().length > 0) {
      try {
        if (provider === 'sarvam' || provider === 'openai' || provider === 'groq') {
          yield* this.callOpenAICompatibleStream(prompt, options, apiKey, provider);
          return;
        }
        // Gemini doesn't yet have a streaming helper — fall through to word-chunk fallback
      } catch (err) {
        console.warn(`LLM stream (${provider}) failed, falling back to word-chunk mode:`, err);
      }
    }

    // Fallback: get full response then emit in word groups for a streaming feel
    const full = await this.generateText(prompt, options);
    yield* this.streamFallback(full);
  }

  /** Splits a pre-generated string into word-group chunks with small delays (simulated streaming). */
  private async *streamFallback(text: string): AsyncIterable<string> {
    if (!text) return;
    const words = text.split(' ');
    const CHUNK_SIZE = 3; // words per chunk
    for (let i = 0; i < words.length; i += CHUNK_SIZE) {
      const chunk = words.slice(i, i + CHUNK_SIZE).join(' ');
      yield (i === 0 ? chunk : ' ' + chunk);
      await new Promise(r => setTimeout(r, 40));
    }
  }

  /** Streaming OpenAI-compatible SSE call — works for Sarvam, OpenAI, Groq. */
  private async *callOpenAICompatibleStream(
    prompt: string,
    options: LLMRequestOptions,
    apiKey: string,
    provider: string
  ): AsyncIterable<string> {
    const isSarvam = provider === 'sarvam';
    const baseUrl = isSarvam
      ? 'https://api.sarvam.ai/v1/chat/completions'
      : provider === 'groq'
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    const messages: Array<{ role: string; content: string }> = [];
    if (options.systemPrompt) messages.push({ role: 'system', content: options.systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const payload: Record<string, any> = {
      model: this.getModel(),
      messages,
      temperature: options.temperature ?? 0.3,
      stream: true,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    if (isSarvam) headers['api-subscription-key'] = apiKey;

    const res = await fetch(baseUrl, { method: 'POST', headers, body: JSON.stringify(payload) });

    if (!res.ok || !res.body) {
      const err = await res.text().catch(() => '');
      throw new Error(`LLM stream error ${res.status}: ${err}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? ''; // keep incomplete line in buffer
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') return;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // malformed chunk — skip
        }
      }
    }
  }

  private async callSarvam(prompt: string, options: LLMRequestOptions, apiKey: string): Promise<string> {
    const url = 'https://api.sarvam.ai/v1/chat/completions';
    const model = this.getModel();

    const messages: Array<{ role: string; content: string }> = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const payload: Record<string, any> = {
      model: model || 'sarvam-105b-conversations',
      messages,
      temperature: options.temperature ?? 0.2,
    };

    if (options.responseFormatJson) {
      payload.response_format = { type: 'json_object' };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Sarvam LLM API error: ${res.status} ${res.statusText} - ${errBody}`);
    }

    const data = (await res.json()) as any;
    const content = data.choices?.[0]?.message?.content || '';
    return this.cleanMarkdownCodeBlocks(content);
  }

  private async callGemini(prompt: string, options: LLMRequestOptions, apiKey: string): Promise<string> {
    const model = this.getModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `${options.systemPrompt ? options.systemPrompt + '\n\n' : ''}${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        responseMimeType: options.responseFormatJson ? 'application/json' : 'text/plain',
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as any;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return this.cleanMarkdownCodeBlocks(content);
  }

  private async callOpenAICompatible(
    prompt: string,
    options: LLMRequestOptions,
    apiKey: string,
    provider: string
  ): Promise<string> {
    const baseUrl =
      provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

    const messages: Array<{ role: string; content: string }> = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const payload: Record<string, any> = {
      model: this.getModel(),
      messages,
      temperature: options.temperature ?? 0.2,
    };

    if (options.responseFormatJson) {
      payload.response_format = { type: 'json_object' };
    }

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`OpenAI-compatible (${provider}) API error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as any;
    const content = data.choices?.[0]?.message?.content || '';
    return this.cleanMarkdownCodeBlocks(content);
  }

  private cleanMarkdownCodeBlocks(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    // Extract balanced JSON object if surrounded by conversational filler
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    return cleaned.trim();
  }

  private fallbackGenerate(_prompt: string): string {
    // When offline or API key is not supplied, returns empty string to trigger deterministic fallback
    return '';
  }
}

export const llmClient = new LLMClient();

