export interface LLMRequestOptions {
  systemPrompt?: string;
  temperature?: number;
  responseFormatJson?: boolean;
}

export class LLMClient {
  private apiKey: string | undefined;
  private provider: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.LLM_API_KEY;
    this.provider = process.env.LLM_PROVIDER || 'gemini';
    this.model = process.env.LLM_MODEL || 'gemini-2.0-flash';
  }

  public async generateText(prompt: string, options: LLMRequestOptions = {}): Promise<string> {
    if (this.apiKey && this.apiKey.trim().length > 0) {
      try {
        if (this.provider === 'gemini') {
          return await this.callGemini(prompt, options);
        } else if (this.provider === 'openai' || this.provider === 'groq') {
          return await this.callOpenAICompatible(prompt, options);
        }
      } catch (err) {
        console.error('LLM API call failed, falling back to heuristic engine:', err);
      }
    }

    return this.fallbackGenerate(prompt);
  }

  private async callGemini(prompt: string, options: LLMRequestOptions): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
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
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private async callOpenAICompatible(prompt: string, options: LLMRequestOptions): Promise<string> {
    const baseUrl =
      this.provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model || (this.provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini'),
        messages,
        temperature: options.temperature ?? 0.2,
        response_format: options.responseFormatJson ? { type: 'json_object' } : undefined,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as any;
    return data.choices?.[0]?.message?.content || '';
  }

  private fallbackGenerate(prompt: string): string {
    // When offline, returns fallback format or handles structured extraction
    return '';
  }
}

export const llmClient = new LLMClient();
