/**
 * Robust JSON extraction & parsing utility for LLM outputs.
 * Handles:
 * 1. Markdown code blocks (```json ... ``` or ``` ... ```)
 * 2. Leading / trailing conversational text (e.g., "Here is the JSON: { ... }")
 * 3. Trailing commas before } or ]
 * 4. Control characters and unescaped newlines
 */
export function safeJsonParse<T = any>(rawText: string | null | undefined, fallback: T): T {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    return fallback;
  }

  let text = rawText.trim();

  // 1. Strip markdown code fences if present
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  // 2. Direct parse attempt
  try {
    return JSON.parse(text) as T;
  } catch {
    // Continue to advanced cleanup
  }

  // 3. Extract substring between first '{' and last '}' (or '[' and ']')
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');

  let candidate = '';
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidate = text.substring(firstBrace, lastBrace + 1);
  } else if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    candidate = text.substring(firstBracket, lastBracket + 1);
  }

  if (candidate) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // 4. Remove trailing commas before } or ]
      const cleaned = candidate
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u0000-\u001F]+/g, ' '); // remove raw control characters
      try {
        return JSON.parse(cleaned) as T;
      } catch {
        // Fallback
      }
    }
  }

  return fallback;
}
